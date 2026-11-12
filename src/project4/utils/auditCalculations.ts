import type { AuditItem, AuditRules, AuditSummary, PredictiveShortage } from '../types/audit.ts';

export function calculateItemFields(item: AuditItem, rules: AuditRules): AuditItem {
  const gapQty = item.physicalQty - item.systemQty;
  const gapRupees = gapQty * item.cost;
  const speed = item.issuesPerMonth >= rules.fastMoverCutoff ? 'Fast' : 'Slow';
  const isCounter = item.spot.trim().toLowerCase() === 'counter';

  let action = '';
  if (gapQty < 0) {
    if (speed === 'Fast' && !isCounter) {
      action = `Move what is left (${item.physicalQty} pcs) to counter. Recount ${Math.abs(gapQty)} missing piece once before write-off.`;
    } else if (speed === 'Fast' && isCounter) {
      action = `Missing ${Math.abs(gapQty)} pcs (₹${Math.abs(gapRupees).toLocaleString('en-IN')}). Fast mover process leak; audit counter logs.`;
    } else {
      action = `Missing ${Math.abs(gapQty)} pcs (₹${Math.abs(gapRupees).toLocaleString('en-IN')}). Recount once, then write off or find. Do not give counter.`;
    }
  } else if (gapQty > 0) {
    action = `Found stock +${gapQty} pcs (₹${gapRupees.toLocaleString('en-IN')}). Enter supplier receipt into system immediately.`;
  } else {
    // gapQty === 0
    if (speed === 'Fast' && !isCounter) {
      action = `Matched count, but fast mover (${item.issuesPerMonth} issues). Move forward to counter immediately.`;
    } else if (isCounter && speed === 'Fast') {
      action = `Fine. Properly slotted fast mover at counter face.`;
    } else if (isCounter && speed === 'Slow') {
      action = `Slow seller occupying counter face. Clean up and relocate to back rack.`;
    } else {
      action = `Matched, slow (${item.issuesPerMonth} issues). Leave in ${item.spot}.`;
    }
  }

  return {
    ...item,
    gapQty,
    gapRupees,
    speed,
    action,
  };
}

export function computeSummary(items: AuditItem[], rules: AuditRules): AuditSummary {
  const enriched = items.map((it) => calculateItemFields(it, rules));

  let shelfShortRupees = 0;
  let foundStockRupees = 0;
  let linesMismatch = 0;
  let linesMatched = 0;
  let fastMoversHidden = 0;
  let slowAtCounter = 0;
  let totalSystemValue = 0;
  let totalPhysicalValue = 0;

  for (const item of enriched) {
    totalSystemValue += item.systemQty * item.cost;
    totalPhysicalValue += item.physicalQty * item.cost;

    if (item.gapQty! < 0) {
      shelfShortRupees += Math.abs(item.gapRupees!);
      linesMismatch++;
    } else if (item.gapQty! > 0) {
      foundStockRupees += item.gapRupees!;
      linesMismatch++;
    } else {
      linesMatched++;
    }

    const isCounter = item.spot.trim().toLowerCase() === 'counter';
    if (item.speed === 'Fast' && !isCounter) {
      fastMoversHidden++;
    }
    if (item.speed === 'Slow' && isCounter) {
      slowAtCounter++;
    }
  }

  return {
    skusCounted: items.length,
    shelfShortRupees,
    foundStockRupees,
    linesMismatch,
    linesMatched,
    fastMoversHidden,
    slowAtCounter,
    netGapRupees: foundStockRupees - shelfShortRupees,
    totalSystemValue,
    totalPhysicalValue,
  };
}

export function formatINR(val: number): string {
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

export function generateCSV(items: AuditItem[], rules: AuditRules, summary: AuditSummary): string {
  const enriched = items.map((it) => calculateItemFields(it, rules));
  const headers = [
    'Code',
    'Part',
    'Spot',
    'System Qty',
    'Physical Qty',
    'Cost (INR)',
    'Issues / Month',
    'Gap Qty',
    'Gap Rupees (INR)',
    'Speed',
    'Action Required',
  ];

  const rows = enriched.map((it) => [
    `"${it.code}"`,
    `"${it.part.replace(/"/g, '""')}"`,
    `"${it.spot}"`,
    it.systemQty,
    it.physicalQty,
    it.cost,
    it.issuesPerMonth,
    it.gapQty,
    it.gapRupees,
    it.speed,
    `"${(it.action || '').replace(/"/g, '""')}"`,
  ]);

  const metaRows = [
    `"Bin Audit Report - ${rules.storeName}"`,
    `"Audit Date: ${rules.countDate}"`,
    `"Auditor: ${rules.auditorName}"`,
    `"Summary: Counted ${summary.skusCounted} SKUs, shelf short by ${formatINR(summary.shelfShortRupees)}, long by ${formatINR(summary.foundStockRupees)}, ${summary.fastMoversHidden} fast movers hidden"`,
    '',
  ];

  return [...metaRows, headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function computePredictiveShortages(items: AuditItem[], rules: AuditRules): PredictiveShortage[] {
  const enriched = items.map((it) => calculateItemFields(it, rules));
  const results: PredictiveShortage[] = [];

  for (const item of enriched) {
    if (item.issuesPerMonth <= 0) continue;
    const dailyVelocity = item.issuesPerMonth / 30;
    const daysRemaining = Math.max(0, Math.round((item.physicalQty / dailyVelocity) * 10) / 10);

    let severity: 'critical' | 'warning' | 'stable' = 'stable';
    if (daysRemaining <= 15) {
      severity = 'critical';
    } else if (daysRemaining <= 30) {
      severity = 'warning';
    }

    // Recommended reorder to cover 45 days
    const targetStock = Math.ceil(dailyVelocity * 45);
    const recommendedReorderQty = Math.max(0, targetStock - item.physicalQty);

    results.push({
      code: item.code,
      part: item.part,
      physicalQty: item.physicalQty,
      monthlyVelocity: item.issuesPerMonth,
      daysRemaining,
      severity,
      recommendedReorderQty,
    });
  }

  return results.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
