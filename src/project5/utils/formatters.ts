/**
 * Indian Rupee and number formatters for the Monday Control Tower
 */

export function formatINR(val: number): string {
  if (isNaN(val)) return '₹0';
  return '₹' + Number(val).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });
}

export function formatNumber(val: number): string {
  if (isNaN(val)) return '0';
  return Number(val).toLocaleString('en-IN');
}

export function formatPercent(val: number): string {
  if (isNaN(val)) return '0%';
  return `${Math.round(val)}%`;
}

/**
 * Builds the exact WhatsApp string:
 * "Monday note, week ending 05 Oct. Dead cash ₹2,23,110. Stockout risk 4 SKUs. Orders late 7 of 18. Freight per trip ₹4,833. OTIF 50%. Unpaid bills ₹3,40,000. Reply with the one you want opened today."
 */
export function buildWhatsAppNote(params: {
  clientName: string;
  weekEndingDate: string;
  deadCash: number;
  stockoutSKUs: number;
  ordersLate: number;
  dispatches: number;
  freightPerTrip: number;
  otifPercent: number;
  unpaidBills: number;
}): string {
  const freightFormatted = formatINR(Math.round(params.freightPerTrip));
  const deadCashFormatted = formatINR(params.deadCash);
  const unpaidFormatted = formatINR(params.unpaidBills);
  const otifFormatted = `${Math.round(params.otifPercent)}%`;

  return `Monday note, week ending ${params.weekEndingDate}. Dead cash ${deadCashFormatted}. Stockout risk ${params.stockoutSKUs} SKUs. Orders late ${params.ordersLate} of ${params.dispatches}. Freight per trip ${freightFormatted}. OTIF ${otifFormatted}. Unpaid bills ${unpaidFormatted}. Reply with the one you want opened today.`;
}
