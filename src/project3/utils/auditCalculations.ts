import type { Trip, CalculatedTrip, RulesConfig, LaneSummary, TransporterSummary, AuditTotals, AnomalyAlert } from '../types/freight.ts';

export function calculateAuditMetrics(trips: Trip[], rules: RulesConfig) {
  // 1. Filter trips within audit date window if specified
  const eligibleTrips = trips.filter(t => {
    if (!rules.startDate || !rules.endDate) return true;
    return t.date >= rules.startDate && t.date <= rules.endDate;
  });

  // 2. Identify clean trips and calculate best rate per lane (and best fixed trip bill per lane)
  // A clean trip has split === 'No' and weightKg >= rules.minWeightThresholdKg
  const laneBestCleanRate: Record<string, number> = {};
  const laneBestCleanTripBill: Record<string, number> = {};
  const isFixedTripMode = rules.benchmarkMode === 'fixed_trip';

  eligibleTrips.forEach(t => {
    const isClean = t.split === 'No' && t.weightKg >= rules.minWeightThresholdKg;
    if (isClean && t.weightKg > 0) {
      const tonnes = t.weightKg / 1000;
      const ratePerTonne = t.bill / tonnes;
      if (!laneBestCleanRate[t.lane] || ratePerTonne < laneBestCleanRate[t.lane]) {
        laneBestCleanRate[t.lane] = ratePerTonne;
      }
      if (!laneBestCleanTripBill[t.lane] || t.bill < laneBestCleanTripBill[t.lane]) {
        laneBestCleanTripBill[t.lane] = t.bill;
      }
    }
  });

  // 3. Compute calculated values for each trip
  const calculatedTrips: CalculatedTrip[] = eligibleTrips.map(t => {
    const tonnes = t.weightKg > 0 ? t.weightKg / 1000 : 0;
    const ratePerTonne = tonnes > 0 ? t.bill / tonnes : 0;
    const bestRate = laneBestCleanRate[t.lane] || ratePerTonne;
    const bestTripBill = laneBestCleanTripBill[t.lane] || t.bill;
    const isClean = t.split === 'No' && t.weightKg >= rules.minWeightThresholdKg;
    
    // Rate leak formula:
    // - per_tonne mode: (bill - bestRate * tonnes)
    // - fixed_trip mode: (bill - bestTripBill) for same-lane full lorry hire
    let rateLeak = 0;
    if (isClean && tonnes > 0) {
      if (isFixedTripMode) {
        rateLeak = Math.max(0, Math.round(t.bill - bestTripBill));
      } else {
        rateLeak = Math.max(0, Math.round(t.bill - (bestRate * tonnes)));
      }
    }

    const detention = Math.round(t.waitHours * rules.detentionRatePerHour);
    const totalLeak = rateLeak + detention;
    const isBenchmark = isClean && (rateLeak === 0 || (!isFixedTripMode && Math.abs(ratePerTonne - bestRate) < 1.0));

    return {
      ...t,
      tonnes,
      ratePerTonne,
      bestRate,
      rateLeak,
      detention,
      totalLeak,
      isBenchmark,
      isClean
    };
  });

  // 4. Audit Totals
  const totalTrips = calculatedTrips.length;
  const splitTrips = calculatedTrips.filter(t => t.split === 'Yes').length;
  const cleanTrips = calculatedTrips.filter(t => t.isClean).length;
  const freightPaid = calculatedTrips.reduce((sum, t) => sum + t.bill, 0);
  const rateLeak = calculatedTrips.reduce((sum, t) => sum + t.rateLeak, 0);
  const detention = calculatedTrips.reduce((sum, t) => sum + t.detention, 0);
  const totalLeak = rateLeak + detention;
  const totalWaitHours = calculatedTrips.reduce((sum, t) => sum + t.waitHours, 0);

  const totals: AuditTotals = {
    totalTrips,
    splitTrips,
    cleanTrips,
    freightPaid,
    rateLeak,
    detention,
    totalLeak,
    totalWaitHours
  };

  // 5. Lane Summaries
  const laneMap = new Map<string, CalculatedTrip[]>();
  calculatedTrips.forEach(t => {
    const existing = laneMap.get(t.lane) || [];
    existing.push(t);
    laneMap.set(t.lane, existing);
  });

  const laneSummaries: LaneSummary[] = Array.from(laneMap.entries()).map(([lane, lTrips]) => {
    const km = lTrips[0]?.km || 0;
    const tripsCount = lTrips.length;
    const cleanTripsCount = lTrips.filter(t => t.isClean).length;
    const bestCleanRate = laneBestCleanRate[lane] || 0;
    const totalFreightPaid = lTrips.reduce((s, t) => s + t.bill, 0);
    const totalRateLeak = lTrips.reduce((s, t) => s + t.rateLeak, 0);
    const totalWaitHours = lTrips.reduce((s, t) => s + t.waitHours, 0);
    const totalDetention = lTrips.reduce((s, t) => s + t.detention, 0);
    const totalWaste = totalRateLeak + totalDetention;

    const benchmarkTrip = lTrips.find(t => t.isBenchmark);
    const bestTransporter = benchmarkTrip?.transporter || 'Murugan';
    const worstRatePerTonne = Math.max(...lTrips.map(t => t.ratePerTonne));

    return {
      lane,
      km,
      tripsCount,
      cleanTripsCount,
      bestCleanRate,
      totalFreightPaid,
      totalRateLeak,
      totalWaitHours,
      totalDetention,
      totalWaste,
      bestTransporter,
      worstRatePerTonne
    };
  });

  // Sort lanes by rate leak descending (worst lane first)
  laneSummaries.sort((a, b) => b.totalRateLeak - a.totalRateLeak);

  // 6. Transporter Summaries
  const transporterMap = new Map<string, CalculatedTrip[]>();
  calculatedTrips.forEach(t => {
    const existing = transporterMap.get(t.transporter) || [];
    existing.push(t);
    transporterMap.set(t.transporter, existing);
  });

  const transporterSummaries: TransporterSummary[] = Array.from(transporterMap.entries()).map(([transporter, tTrips]) => {
    const tripsCount = tTrips.length;
    const cleanTripsCount = tTrips.filter(t => t.isClean).length;
    const splitTripsCount = tTrips.filter(t => t.split === 'Yes').length;
    const totalBilled = tTrips.reduce((s, t) => s + t.bill, 0);
    const totalRateLeak = tTrips.reduce((s, t) => s + t.rateLeak, 0);
    const totalWaitHours = tTrips.reduce((s, t) => s + t.waitHours, 0);
    const totalDetention = tTrips.reduce((s, t) => s + t.detention, 0);
    const totalWaste = totalRateLeak + totalDetention;
    const avgWaitHours = tripsCount > 0 ? Number((totalWaitHours / tripsCount).toFixed(1)) : 0;
    const rateLeakShare = rateLeak > 0 ? Number(((totalRateLeak / rateLeak) * 100).toFixed(1)) : 0;
    const detentionShare = detention > 0 ? Number(((totalDetention / detention) * 100).toFixed(1)) : 0;

    let category: 'benchmark' | 'primary_leak' | 'broker' = 'broker';
    if (transporter.toLowerCase().includes('murugan')) {
      category = 'benchmark';
    } else if (transporter.toLowerCase().includes('siva')) {
      category = 'primary_leak';
    }

    return {
      transporter,
      category,
      tripsCount,
      cleanTripsCount,
      splitTripsCount,
      totalBilled,
      totalRateLeak,
      totalWaitHours,
      totalDetention,
      totalWaste,
      rateLeakShare,
      detentionShare,
      avgWaitHours
    };
  });

  // Sort: primary_leak first, then broker, then benchmark
  transporterSummaries.sort((a, b) => b.totalWaste - a.totalWaste);

  // 7. Automated Anomaly Alerts
  const alerts: AnomalyAlert[] = [];

  calculatedTrips.forEach(t => {
    if (t.waitHours >= 3.0) {
      alerts.push({
        id: `alert-wait-${t.id}`,
        type: 'gate_delay',
        severity: t.waitHours >= 4.5 ? 'high' : 'medium',
        tripId: t.id,
        lane: t.lane,
        transporter: t.transporter,
        title: `Severe Gate Detention: ${t.waitHours}h at Gate`,
        description: `${t.transporter} vehicle sat for ${t.waitHours} hours (${t.lane}) on ${t.date}. Caused ₹${t.detention.toLocaleString('en-IN')} detention penalty.`,
        impactAmount: t.detention
      });
    }

    if (t.isClean && t.bestRate > 0) {
      const variancePercent = ((t.ratePerTonne - t.bestRate) / t.bestRate) * 100;
      if (variancePercent >= 25) {
        alerts.push({
          id: `alert-rate-${t.id}`,
          type: 'rate_gouging',
          severity: variancePercent >= 50 ? 'high' : 'medium',
          tripId: t.id,
          lane: t.lane,
          transporter: t.transporter,
          title: `Rate Hike Alert: +${Math.round(variancePercent)}% vs Lane Best`,
          description: `${t.transporter} charged ₹${Math.round(t.ratePerTonne).toLocaleString('en-IN')}/t vs benchmark ₹${Math.round(t.bestRate).toLocaleString('en-IN')}/t on ${t.lane}. Rate leak: ₹${t.rateLeak.toLocaleString('en-IN')}.`,
          impactAmount: t.rateLeak
        });
      }
    }
  });

  alerts.sort((a, b) => b.impactAmount - a.impactAmount);

  return {
    calculatedTrips,
    laneBestCleanRate,
    totals,
    laneSummaries,
    transporterSummaries,
    alerts
  };
}

export function formatINR(val: number): string {
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

export function formatTonneRate(val: number): string {
  return '₹' + Math.round(val).toLocaleString('en-IN') + '/t';
}
