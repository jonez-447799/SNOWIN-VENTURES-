import type { DispatchRow, RulesConfig, OTIFMetrics, CustomerStats, ReasonStats, FailType, DelayReason } from '../types/otif.ts';

export function calculateRowStatus(row: DispatchRow, rules: RulesConfig): DispatchRow {
  const promised = row.promisedDate ? new Date(row.promisedDate).getTime() : NaN;
  const actual = row.actualOut ? new Date(row.actualOut).getTime() : NaN;
  
  // On time: actual out is valid and on or before promised date plus grace hours
  const graceMs = (rules.graceHours || 0) * 60 * 60 * 1000;
  const onTime = Number.isFinite(promised) && Number.isFinite(actual) && actual <= (promised + graceMs);
  const lateHours =
    Number.isFinite(promised) && Number.isFinite(actual) && actual > promised + graceMs
      ? Math.round(((actual - (promised + graceMs)) / (1000 * 60 * 60)) * 10) / 10
      : 0;

  // In full: shipped divided by ordered is at least cutoff percentage (guard against negative/zero quantities)
  const safeShipped = Math.max(0, row.shippedQty);
  const fillRate = row.orderedQty > 0 ? (safeShipped / row.orderedQty) * 100 : 0;
  const inFull = row.orderedQty > 0 && row.shippedQty >= 0 && fillRate >= (rules.inFullCutoff || 100);

  // OTIF is Pass only if both are true
  const otif = onTime && inFull;

  let failType: FailType = null;
  if (!otif) {
    if (!onTime && !inFull) {
      failType = 'Late and short';
    } else if (!onTime) {
      failType = 'Late';
    } else {
      failType = 'Short';
    }
  }

  return {
    ...row,
    onTime,
    inFull,
    otif,
    failType,
    lateHours,
  };
}

export function calculateOTIFMetrics(rows: DispatchRow[], rules: RulesConfig): OTIFMetrics {
  const calculatedRows = rows.map(r => calculateRowStatus(r, rules));
  const totalDispatches = calculatedRows.length;

  if (totalDispatches === 0) {
    return {
      totalDispatches: 0,
      passes: 0,
      otifPercent: 0,
      onTimeCount: 0,
      onTimePercent: 0,
      inFullCount: 0,
      inFullPercent: 0,
      fails: 0,
      failsLateOnly: 0,
      failsShortOnly: 0,
      failsLateAndShort: 0,
      customerStats: [],
      reasonStats: [],
      weakestCustomer: null,
      topFailureReason: null,
    };
  }

  let passes = 0;
  let onTimeCount = 0;
  let inFullCount = 0;
  let fails = 0;
  let failsLateOnly = 0;
  let failsShortOnly = 0;
  let failsLateAndShort = 0;

  const customerMap = new Map<string, { dispatches: number; passes: number; onTime: number; inFull: number; fails: number }>();
  const reasonMap = new Map<DelayReason, number>();

  for (const r of calculatedRows) {
    if (r.onTime) onTimeCount++;
    if (r.inFull) inFullCount++;

    if (r.otif) {
      passes++;
    } else {
      fails++;
      if (r.failType === 'Late') failsLateOnly++;
      else if (r.failType === 'Short') failsShortOnly++;
      else if (r.failType === 'Late and short') failsLateAndShort++;

      if (r.delayReason) {
        reasonMap.set(r.delayReason, (reasonMap.get(r.delayReason) || 0) + 1);
      }
    }

    // Customer mapping
    const cStat = customerMap.get(r.customer) || { dispatches: 0, passes: 0, onTime: 0, inFull: 0, fails: 0 };
    cStat.dispatches++;
    if (r.otif) cStat.passes++;
    else cStat.fails++;
    if (r.onTime) cStat.onTime++;
    if (r.inFull) cStat.inFull++;
    customerMap.set(r.customer, cStat);
  }

  const otifPercent = Math.round((passes / totalDispatches) * 100);
  const onTimePercent = Math.round((onTimeCount / totalDispatches) * 100);
  const inFullPercent = Math.round((inFullCount / totalDispatches) * 100);

  const customerStats: CustomerStats[] = Array.from(customerMap.entries()).map(([customer, s]) => ({
    customer,
    dispatches: s.dispatches,
    passes: s.passes,
    otifPercent: Math.round((s.passes / s.dispatches) * 100),
    onTimeCount: s.onTime,
    inFullCount: s.inFull,
    fails: s.fails,
  }));

  // Sort customer stats by lowest OTIF first (weakest first as instructed: "Hyundai is the account to open first")
  customerStats.sort((a, b) => {
    if (a.otifPercent !== b.otifPercent) return a.otifPercent - b.otifPercent;
    return b.fails - a.fails;
  });

  const weakestCustomer = customerStats.length > 0 ? customerStats[0] : null;

  const reasonStats: ReasonStats[] = Array.from(reasonMap.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentageOfFails: fails > 0 ? Math.round((count / fails) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const topFailureReason = reasonStats.length > 0 ? reasonStats[0] : null;

  return {
    totalDispatches,
    passes,
    otifPercent,
    onTimeCount,
    onTimePercent,
    inFullCount,
    inFullPercent,
    fails,
    failsLateOnly,
    failsShortOnly,
    failsLateAndShort,
    customerStats,
    reasonStats,
    weakestCustomer,
    topFailureReason,
  };
}

export function formatDateTime(isoStr: string): string {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${hours}:${mins}`;
  } catch {
    return isoStr;
  }
}

export function formatDateOnly(isoStr: string): string {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return isoStr;
  }
}
