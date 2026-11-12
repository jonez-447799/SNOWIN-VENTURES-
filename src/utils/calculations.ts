import type { StockItem, RulesConfig, OwnerReportSummary, CurrencyCode, StockCategory, LiquidationScenario } from '../types.ts';

/**
 * Exchange rates relative to INR (base currency)
 */
export const CURRENCY_CONFIGS: Record<CurrencyCode, { symbol: string; rateToINR: number; name: string }> = {
  INR: { symbol: '₹', rateToINR: 1, name: 'Indian Rupee (INR)' },
  USD: { symbol: '$', rateToINR: 0.0118, name: 'US Dollar (USD)' },
  EUR: { symbol: '€', rateToINR: 0.0108, name: 'Euro (EUR)' },
  GBP: { symbol: '£', rateToINR: 0.0091, name: 'British Pound (GBP)' },
  AED: { symbol: 'AED ', rateToINR: 0.0433, name: 'UAE Dirham (AED)' },
};

/**
 * Formats a rupee amount in traditional Indian numbering system (e.g. ₹6,45,650),
 * or converted to selected currency.
 */
export function formatCurrency(amountInINR: number, currency: CurrencyCode = 'INR'): string {
  if (isNaN(amountInINR) || amountInINR === null || amountInINR === undefined) {
    return '₹0';
  }

  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.INR;
  const converted = amountInINR * config.rateToINR;

  if (currency === 'INR') {
    // Format using Indian Numbering System: e.g. 6,45,650
    const rounded = Math.round(converted);
    const sign = rounded < 0 ? '-' : '';
    const absStr = Math.abs(rounded).toString();

    let result = '';
    if (absStr.length <= 3) {
      result = absStr;
    } else {
      const lastThree = absStr.substring(absStr.length - 3);
      const otherNumbers = absStr.substring(0, absStr.length - 3);
      const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      result = formattedOther + ',' + lastThree;
    }
    return `${sign}₹${result}`;
  }

  // International formatting
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: currency === 'AED' ? 1 : 0,
  }).format(converted);
}

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

/**
 * Normalizes dates from various formats (Tally YYYYMMDD, DD-MMM-YYYY, DD/MM/YYYY, YYYY-MM-DD)
 * to ISO YYYY-MM-DD to avoid NaN in calculations.
 */
export function normalizeDateString(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Tally format YYYYMMDD e.g. 20250814
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.substring(0, 4)}-${trimmed.substring(4, 6)}-${trimmed.substring(6, 8)}`;
  }

  // DD-MMM-YYYY or DD-MMM-YY e.g. 14-Aug-2025, 1-Sep-2026
  const dMmmY = trimmed.match(/^(\d{1,2})[-/ ]([A-Za-z]{3})[-/ ](\d{2,4})$/);
  if (dMmmY) {
    const day = dMmmY[1].padStart(2, '0');
    const month = MONTH_MAP[dMmmY[2].toLowerCase()] || '01';
    let year = dMmmY[3];
    if (year.length === 2) {
      year = Number(year) > 70 ? `19${year}` : `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    let year = dmy[3];
    if (year.length === 2) {
      year = Number(year) > 70 ? `19${year}` : `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }

  // Fallback to standard Date parsing if possible
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return trimmed;
}

/**
 * Returns Indian Lakhs/Crores shorthand for quick executive glance
 * (e.g., ₹2.23 L, ₹6.45 L, ₹1.50 Cr)
 */
export function formatIndianLakhsCrores(amountInINR: number): string {
  if (isNaN(amountInINR) || amountInINR === 0) return '₹0';
  const abs = Math.abs(amountInINR);
  const sign = amountInINR < 0 ? '-' : '';
  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  return formatCurrency(amountInINR, 'INR');
}

/**
 * Calculates days idle between as-of date and last movement date.
 * Handles Tally date formats reliably.
 */
export function calculateDaysIdle(asOfDateStr: string, lastMovementStr: string): number {
  if (!asOfDateStr || !lastMovementStr) return 0;
  const normAsOf = normalizeDateString(asOfDateStr);
  const normLast = normalizeDateString(lastMovementStr);
  const asOf = new Date(normAsOf + 'T00:00:00Z').getTime();
  const lastMove = new Date(normLast + 'T00:00:00Z').getTime();
  if (isNaN(asOf) || isNaN(lastMove)) return 0;
  const diffTime = asOf - lastMove;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Recalculates all engine formulas for the stock items based on current rules.
 */
export function evaluateStockEngine(items: StockItem[], rules: RulesConfig): StockItem[] {
  // Step 1: Calculate raw closing values and idle days
  const withValues = items.map((item) => {
    const closingValue = Math.round(item.qtyOnHand * item.costRate);
    const daysIdle = calculateDaysIdle(rules.asOfDate, item.lastMovement);

    let status: 'Dead' | 'Slow' | 'Moving' = 'Moving';
    if (daysIdle >= rules.deadThresholdDays) {
      status = 'Dead';
    } else if (daysIdle >= rules.slowThresholdDays) {
      status = 'Slow';
    }

    const deadValue = status === 'Dead' ? closingValue : 0;

    return {
      ...item,
      closingValue,
      daysIdle,
      status,
      deadValue,
    };
  });

  // Step 2: Rank items by closing value descending
  const sorted = [...withValues].sort((a, b) => (b.closingValue || 0) - (a.closingValue || 0));
  const totalStock = sorted.reduce((sum, item) => sum + (item.closingValue || 0), 0);

  // Step 3: Cumulative percentage & ABC Classification
  let runningSum = 0;
  const rankedMap = new Map<
    string,
    { valueRank: number; cumulativePercent: number; abcClass: 'A' | 'B' | 'C'; action: string }
  >();

  sorted.forEach((item, index) => {
    runningSum += item.closingValue || 0;
    const cumulativePercent = totalStock > 0 ? (runningSum / totalStock) * 100 : 0;

    // Pareto ABC logic:
    // Items up to and including the one that crosses 80% are Class A.
    // If previous item was < 80%, this item is A.
    const prevCumul = totalStock > 0 ? ((runningSum - (item.closingValue || 0)) / totalStock) * 100 : 0;
    let abcClass: 'A' | 'B' | 'C' = 'C';
    if (prevCumul < rules.classACutoff) {
      abcClass = 'A';
    } else if (prevCumul < rules.classBCutoff) {
      abcClass = 'B';
    } else {
      abcClass = 'C';
    }

    // Action sentence derivation as per prompt rules:
    // Dead and A: stop buy, discount or return this week.
    // Dead and not A: stop buy, liquidate or scrap.
    // Slow and A: do not reorder until it moves.
    // Slow otherwise: freeze purchase.
    // Moving and A: protect it, do not stock out.
    // Moving and C: leave it.
    let action = 'Leave it';
    if (item.status === 'Dead') {
      if (abcClass === 'A') {
        action = 'Stop buying. Discount or return this week.';
      } else {
        action = 'Stop buying. Liquidate or write off.';
      }
    } else if (item.status === 'Slow') {
      if (abcClass === 'A') {
        action = 'Do not reorder until it moves.';
      } else {
        action = 'Freeze purchase.';
      }
    } else {
      if (abcClass === 'A') {
        action = 'Protect it, do not stock out.';
      } else if (abcClass === 'B') {
        action = 'Replenish on demand.';
      } else {
        action = 'Leave it.';
      }
    }

    rankedMap.set(item.id, {
      valueRank: index + 1,
      cumulativePercent: Math.round(cumulativePercent * 10) / 10,
      abcClass,
      action,
    });
  });

  return items.map((orig) => {
    const val = withValues.find((v) => v.id === orig.id)!;
    const rk = rankedMap.get(orig.id)!;
    return {
      ...orig,
      closingValue: val.closingValue,
      daysIdle: val.daysIdle,
      status: val.status,
      deadValue: val.deadValue,
      valueRank: rk.valueRank,
      cumulativePercent: rk.cumulativePercent,
      abcClass: rk.abcClass,
      action: rk.action,
    };
  });
}

/**
 * Calculates the complete executive Owner Report summary.
 */
export function generateOwnerReport(items: StockItem[], rules: RulesConfig): OwnerReportSummary {
  const evaluated = evaluateStockEngine(items, rules);

  let totalStockValue = 0;
  let deadCash = 0;
  let deadItemCount = 0;
  let slowCash = 0;
  let slowItemCount = 0;
  let movingCash = 0;
  let movingItemCount = 0;

  let range0_30 = 0;
  let range31_89 = 0;
  let range90_179 = 0;
  let range180_plus = 0;

  const categoryDeadMap: Record<StockCategory, { value: number; count: number }> = {
    'Raw Material': { value: 0, count: 0 },
    'Finished Goods': { value: 0, count: 0 },
    'Spares': { value: 0, count: 0 },
    'Consumable': { value: 0, count: 0 },
  };

  evaluated.forEach((item) => {
    const val = item.closingValue || 0;
    const idle = item.daysIdle || 0;
    totalStockValue += val;

    if (item.status === 'Dead') {
      deadCash += val;
      deadItemCount++;
      categoryDeadMap[item.category].value += val;
      categoryDeadMap[item.category].count += 1;
    } else if (item.status === 'Slow') {
      slowCash += val;
      slowItemCount++;
    } else {
      movingCash += val;
      movingItemCount++;
    }

    // Ageing bucket
    if (idle <= 30) {
      range0_30 += val;
    } else if (idle < 90) {
      range31_89 += val;
    } else if (idle < 180) {
      range90_179 += val;
    } else {
      range180_plus += val;
    }
  });

  const deadCashPercent = totalStockValue > 0 ? (deadCash / totalStockValue) * 100 : 0;
  const slowCashPercent = totalStockValue > 0 ? (slowCash / totalStockValue) * 100 : 0;
  const movingCashPercent = totalStockValue > 0 ? (movingCash / totalStockValue) * 100 : 0;

  // Annual holding burn = deadCash * holdingCostRate (e.g. 18%)
  const annualHoldingBurn = Math.round(deadCash * (rules.holdingCostPercent / 100));

  // Top 5 dead items
  const deadItems = evaluated
    .filter((item) => item.status === 'Dead')
    .sort((a, b) => (b.closingValue || 0) - (a.closingValue || 0));
  const topDeadItems = deadItems.slice(0, 5);

  const categoryDeadBreakdown = {} as Record<StockCategory, { value: number; count: number; percent: number }>;
  (Object.keys(categoryDeadMap) as StockCategory[]).forEach((cat) => {
    const d = categoryDeadMap[cat];
    categoryDeadBreakdown[cat] = {
      value: d.value,
      count: d.count,
      percent: deadCash > 0 ? Math.round((d.value / deadCash) * 1000) / 10 : 0,
    };
  });

  return {
    asOfDate: rules.asOfDate,
    totalStockValue,
    deadCash,
    deadCashPercent: Math.round(deadCashPercent * 10) / 10,
    deadItemCount,
    totalItemCount: evaluated.length,
    slowCash,
    slowCashPercent: Math.round(slowCashPercent * 10) / 10,
    slowItemCount,
    movingCash,
    movingCashPercent: Math.round(movingCashPercent * 10) / 10,
    movingItemCount,
    annualHoldingBurn,
    holdingCostRate: rules.holdingCostPercent,
    topDeadItems,
    ageingBreakdown: {
      range0_30,
      range0_30_pct: totalStockValue > 0 ? Math.round((range0_30 / totalStockValue) * 1000) / 10 : 0,
      range31_89,
      range31_89_pct: totalStockValue > 0 ? Math.round((range31_89 / totalStockValue) * 1000) / 10 : 0,
      range90_179,
      range90_179_pct: totalStockValue > 0 ? Math.round((range90_179 / totalStockValue) * 1000) / 10 : 0,
      range180_plus,
      range180_plus_pct: totalStockValue > 0 ? Math.round((range180_plus / totalStockValue) * 1000) / 10 : 0,
    },
    categoryDeadBreakdown,
  };
}

/**
 * Simulates a dead stock liquidation scenario with discount markdowns.
 * Computes immediate liquidity generated, warehouse holding burn eliminated,
 * haircut book loss, and capital turnaround velocity.
 */
export function simulateLiquidationScenario(
  items: StockItem[],
  rules: RulesConfig,
  discountPercent: number,
  categoryDiscounts?: Partial<Record<StockCategory, number>>
): LiquidationScenario {
  const evaluated = evaluateStockEngine(items, rules);
  const deadItems = evaluated.filter((i) => i.status === 'Dead');

  const fullCategoryDiscounts: Record<StockCategory, number> = {
    'Raw Material': discountPercent,
    'Finished Goods': discountPercent,
    'Spares': discountPercent,
    'Consumable': discountPercent,
    ...(categoryDiscounts || {}),
  };

  let totalDeadBookValue = 0;
  let cashRecovered = 0;

  deadItems.forEach((item) => {
    const val = item.closingValue || 0;
    totalDeadBookValue += val;
    const itemDiscountPct = fullCategoryDiscounts[item.category] ?? discountPercent;
    const recoveryMultiplier = Math.max(0, 1 - itemDiscountPct / 100);
    cashRecovered += Math.round(val * recoveryMultiplier);
  });

  const haircutLoss = Math.max(0, totalDeadBookValue - cashRecovered);
  const annualHoldingBurnEliminated = Math.round(totalDeadBookValue * (rules.holdingCostPercent / 100));
  const netFirstYearBenefit = Math.round((cashRecovered + annualHoldingBurnEliminated) - totalDeadBookValue);

  // If cashRecovered is redeployed into Class-A fast-moving items earning ~18% gross margin annually:
  const annualReinvestmentMargin = cashRecovered * 0.18;
  const reinvestmentRoiMonths = annualReinvestmentMargin > 0
    ? Math.round((haircutLoss / annualReinvestmentMargin) * 12 * 10) / 10
    : 0;

  return {
    discountPercent,
    categoryDiscounts: fullCategoryDiscounts,
    totalDeadBookValue,
    cashRecovered,
    haircutLoss,
    annualHoldingBurnEliminated,
    netFirstYearBenefit,
    reinvestmentRoiMonths,
  };
}
