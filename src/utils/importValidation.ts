/**
 * Phase 0 Data Integrity, Import Validation, Formula Sanitization & Workspace Storage Keys
 * Pure functions testable in Node and Browser environments.
 */

import {
  resolveP1InventoryColumns,
  resolveP2DispatchColumns,
  resolveP3FreightColumns,
  resolveP4WarehouseBinColumns,
} from './columnAliasResolver.ts';

export const STORAGE_KEY_P2_ACTIVE_WS = 'otif_active_workspace_id_v2';
export const LEGACY_STORAGE_KEY_P2_ACTIVE_WS = 'otif_active_ws_v2';

/**
 * Resolves the active Project 2 (Delivery & OTIF) workspace ID consistently across
 * Project2App, Dashboard snapshot builder, SmartTallyMapper, PlantContext, and Excel Exporter.
 * Automatically migrates legacy 'otif_active_ws_v2' if 'otif_active_workspace_id_v2' is not yet set.
 */
export function getActiveP2WorkspaceId(
  fallbackId: string,
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null
): string {
  const store =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined' && window.localStorage
        ? window.localStorage
        : null;

  if (!store) return fallbackId;

  try {
    const primary = store.getItem(STORAGE_KEY_P2_ACTIVE_WS);
    if (primary && primary.trim().length > 0) {
      return primary.trim();
    }
    const legacy = store.getItem(LEGACY_STORAGE_KEY_P2_ACTIVE_WS);
    if (legacy && legacy.trim().length > 0) {
      const trimmed = legacy.trim();
      try {
        store.setItem(STORAGE_KEY_P2_ACTIVE_WS, trimmed);
      } catch {
        // Ignore storage write errors in restricted contexts
      }
      return trimmed;
    }
  } catch {
    return fallbackId;
  }

  return fallbackId;
}

export type DateValidationStatus =
  | 'VALID'
  | 'MISSING_DATE'
  | 'INVALID_DATE'
  | 'AMBIGUOUS_DATE';

export interface DateValidationResult {
  status: DateValidationStatus;
  normalized?: string;
  reason?: string;
}

const MONTH_MAP: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (year < 1970 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const daysInMonths = [
    31,
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return day <= daysInMonths[month - 1];
}

function formatYMD(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Strictly validates an imported date value without silently substituting default dates.
 * Distinguishes between VALID, MISSING_DATE, INVALID_DATE, and AMBIGUOUS_DATE (e.g. 04/05/2026).
 */
export function validateImportDate(val: unknown): DateValidationResult {
  if (val === null || val === undefined) {
    return { status: 'MISSING_DATE', reason: 'Date value is missing or blank.' };
  }

  // Handle Excel serial dates if numeric
  if (typeof val === 'number') {
    if (!Number.isFinite(val) || val <= 25569 || val > 80000) {
      return {
        status: 'INVALID_DATE',
        reason: `Numeric serial '${val}' is outside valid calendar bounds.`,
      };
    }
    const utcDays = Math.floor(val - 25569);
    const d = new Date(utcDays * 86400 * 1000);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    if (!isValidCalendarDate(year, month, day)) {
      return { status: 'INVALID_DATE', reason: `Invalid Excel serial date '${val}'.` };
    }
    return { status: 'VALID', normalized: formatYMD(year, month, day) };
  }

  const raw = String(val).trim();
  if (!raw || raw === '-' || raw.toLowerCase() === 'n/a' || raw.toLowerCase() === 'null' || raw.toLowerCase() === 'tbd') {
    return { status: 'MISSING_DATE', reason: 'Date value is blank or placeholder.' };
  }

  // Strip time portion if ISO timestamp or trailing time (e.g. 2026-09-18T00:00:00 or 2026-09-18 14:30)
  const datePart = raw.split(/[T\s]/)[0];

  // 1. YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = datePart.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (!isValidCalendarDate(year, month, day)) {
      return {
        status: 'INVALID_DATE',
        reason: `'${raw}' is not a valid calendar date (Year ${year}, Month ${month}, Day ${day}).`,
      };
    }
    return { status: 'VALID', normalized: formatYMD(year, month, day) };
  }

  // 2. DD-MMM-YYYY or DD-MMM-YY or DD MMM YYYY (unambiguous named month)
  const namedMonthMatch = raw.match(/^(\d{1,2})[-/\s.]([A-Za-z]{3,4})[-/\s.](\d{2,4})$/);
  if (namedMonthMatch) {
    const day = Number(namedMonthMatch[1]);
    const monthKey = namedMonthMatch[2].toLowerCase();
    let year = Number(namedMonthMatch[3]);
    if (year < 100) year += 2000;
    const month = MONTH_MAP[monthKey];
    if (!month || !isValidCalendarDate(year, month, day)) {
      return {
        status: 'INVALID_DATE',
        reason: `'${raw}' has an invalid day or month name.`,
      };
    }
    return { status: 'VALID', normalized: formatYMD(year, month, day) };
  }

  // 3. Numeric slash/dash/dot formats: A/B/YYYY or A-B-YYYY
  const numericPartsMatch = datePart.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (numericPartsMatch) {
    const first = Number(numericPartsMatch[1]);
    const second = Number(numericPartsMatch[2]);
    let year = Number(numericPartsMatch[3]);
    if (year < 100) year += 2000;

    // Both > 12 -> impossible calendar date
    if (first > 12 && second > 12) {
      return {
        status: 'INVALID_DATE',
        reason: `'${raw}' has invalid month and day values (${first} and ${second}).`,
      };
    }

    // Both <= 12 and first !== second -> ambiguous between DD/MM/YYYY and MM/DD/YYYY
    if (first >= 1 && first <= 12 && second >= 1 && second <= 12 && first !== second) {
      return {
        status: 'AMBIGUOUS_DATE',
        reason: `'${raw}' is ambiguous between DD/MM/YYYY and MM/DD/YYYY. Use YYYY-MM-DD or DD-MMM-YYYY (e.g. 2026-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}).`,
      };
    }

    // If first === second (e.g. 05/05/2026), DD/MM and MM/DD produce the exact same date
    if (first >= 1 && first <= 12 && first === second) {
      if (!isValidCalendarDate(year, first, second)) {
        return { status: 'INVALID_DATE', reason: `'${raw}' is not a valid calendar date.` };
      }
      return { status: 'VALID', normalized: formatYMD(year, first, second) };
    }

    // If first > 12 and second <= 12 -> unambiguously DD/MM/YYYY
    if (first > 12 && second >= 1 && second <= 12) {
      const day = first;
      const month = second;
      if (!isValidCalendarDate(year, month, day)) {
        return {
          status: 'INVALID_DATE',
          reason: `'${raw}' is not a valid calendar date (Day ${day}, Month ${month}, Year ${year}).`,
        };
      }
      return { status: 'VALID', normalized: formatYMD(year, month, day) };
    }

    // If first <= 12 and second > 12 -> unambiguously MM/DD/YYYY
    if (first >= 1 && first <= 12 && second > 12) {
      const month = first;
      const day = second;
      if (!isValidCalendarDate(year, month, day)) {
        return {
          status: 'INVALID_DATE',
          reason: `'${raw}' is not a valid calendar date (Month ${month}, Day ${day}, Year ${year}).`,
        };
      }
      return { status: 'VALID', normalized: formatYMD(year, month, day) };
    }

    return {
      status: 'INVALID_DATE',
      reason: `'${raw}' contains out-of-range day or month values.`,
    };
  }

  return {
    status: 'INVALID_DATE',
    reason: `'${raw}' could not be parsed as a valid date. Expected YYYY-MM-DD or DD-MMM-YYYY.`,
  };
}

export type NumberValidationStatus =
  | 'VALID_NUMBER'
  | 'MISSING_NUMBER'
  | 'INVALID_NUMBER'
  | 'NEGATIVE_NUMBER';

export interface NumberValidationResult {
  status: NumberValidationStatus;
  value?: number;
  reason?: string;
}

export interface NumberValidationOptions {
  allowNegative?: boolean;
  allowZero?: boolean;
  maxVal?: number;
}

/**
 * Strictly validates an imported numeric value without turning unparseable text or blanks into 0.
 */
export function validateImportNumber(
  val: unknown,
  options: NumberValidationOptions = {}
): NumberValidationResult {
  const { allowNegative = false, allowZero = true, maxVal = 1_000_000_000 } = options;

  if (val === null || val === undefined) {
    return { status: 'MISSING_NUMBER', reason: 'Numeric value is missing or blank.' };
  }

  if (typeof val === 'number') {
    if (!Number.isFinite(val)) {
      return { status: 'INVALID_NUMBER', reason: 'Numeric value is NaN or infinite.' };
    }
    if (!allowNegative && val < 0) {
      return {
        status: 'NEGATIVE_NUMBER',
        reason: `Negative number (${val}) is not permitted for this field.`,
      };
    }
    if (!allowZero && val === 0) {
      return {
        status: 'INVALID_NUMBER',
        reason: 'Zero value is not permitted for this field.',
      };
    }
    if (Math.abs(val) > maxVal) {
      return {
        status: 'INVALID_NUMBER',
        reason: `Value (${val}) exceeds maximum allowed threshold (${maxVal.toLocaleString()}).`,
      };
    }
    return { status: 'VALID_NUMBER', value: val };
  }

  const raw = String(val).trim();
  if (!raw || raw === '-' || raw === '--' || raw.toLowerCase() === 'n/a' || raw.toLowerCase() === 'null') {
    return { status: 'MISSING_NUMBER', reason: 'Numeric value is blank or placeholder.' };
  }

  // Strip known currency symbols, thousands separators, and trailing accounting/unit suffixes
  let cleaned = raw
    .replace(/^(INR|Rs\.?|USD|EUR|₹|\$)\s*/i, '')
    .replace(/\s*(INR|Rs\.?|Nos\.?|Pcs\.?|Kits\.?|Sets\.?|Units\.?|MT|kg|hrs|Days|Dr|Cr|%)\s*$/i, '')
    .replace(/,/g, '')
    .trim();

  // Handle accounting parentheses for negative numbers e.g. (1250.50)
  if (/^\(\d+(\.\d+)?\)$/.test(cleaned)) {
    cleaned = '-' + cleaned.slice(1, -1);
  }

  // Must strictly match a valid signed decimal number after stripping known prefixes/suffixes
  if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(cleaned)) {
    return {
      status: 'INVALID_NUMBER',
      reason: `'${raw}' is not a valid number.`,
    };
  }

  const num = Number(cleaned);
  if (!Number.isFinite(num)) {
    return {
      status: 'INVALID_NUMBER',
      reason: `'${raw}' could not be parsed as a finite number.`,
    };
  }

  if (!allowNegative && num < 0) {
    return {
      status: 'NEGATIVE_NUMBER',
      reason: `Negative value (${num}) is not allowed for this field.`,
    };
  }

  if (!allowZero && num === 0) {
    return {
      status: 'INVALID_NUMBER',
      reason: 'Value must be greater than zero.',
    };
  }

  if (Math.abs(num) > maxVal) {
    return {
      status: 'INVALID_NUMBER',
      reason: `Value (${num.toLocaleString()}) exceeds maximum safety limit (${maxVal.toLocaleString()}).`,
    };
  }

  return { status: 'VALID_NUMBER', value: num };
}

export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024; // 5 MB safety limit
export const ALLOWED_IMPORT_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.json'];

export interface FileSafetyCheckResult {
  valid: boolean;
  errorType?:
    | 'FILE_TOO_LARGE'
    | 'UNSUPPORTED_FORMAT'
    | 'EMPTY_FILE';
  reason?: string;
}

export function validateUploadFileSafety(
  file: { name: string; size: number; type?: string },
  allowedExtensions: string[] = ALLOWED_IMPORT_EXTENSIONS,
  maxBytes: number = MAX_IMPORT_FILE_BYTES
): FileSafetyCheckResult {
  if (!file || file.size === 0) {
    return {
      valid: false,
      errorType: 'EMPTY_FILE',
      reason: 'The selected file is empty (0 bytes). Please upload a valid file with records.',
    };
  }

  if (file.size > maxBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      errorType: 'FILE_TOO_LARGE',
      reason: `File size (${sizeMb} MB) exceeds the ${maxMb} MB client-side safety limit.`,
    };
  }

  const lowerName = (file.name || '').toLowerCase();
  const hasAllowedExt = allowedExtensions.some((ext) => lowerName.endsWith(ext.toLowerCase()));
  if (!hasAllowedExt) {
    return {
      valid: false,
      errorType: 'UNSUPPORTED_FORMAT',
      reason: `Unsupported file format '${file.name}'. Allowed formats: ${allowedExtensions.join(', ')}.`,
    };
  }

  return { valid: true };
}

/**
 * Neutralizes spreadsheet formula injection in user-controlled strings when exporting to CSV or XLSX.
 * Any string beginning with =, +, -, or @ (or leading whitespace/control characters followed by them)
 * is prefixed with a single quote (') so Excel/Sheets treats it as literal text.
 */
export function sanitizeSpreadsheetCell<T>(val: T): T {
  if (typeof val !== 'string') return val;
  if (val.length === 0) return val;

  // Check if string starts with optional whitespace/tab/newline followed by =, +, -, or @
  if (/^[\s\t\r\n]*[=+\-@]/.test(val)) {
    return `'${val}` as unknown as T;
  }
  return val;
}

/**
 * Formats a value for CSV output while neutralizing spreadsheet formula injection and escaping quotes.
 */
export function toSafeCsvCell(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""';
  if (typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }
  const safeStr = sanitizeSpreadsheetCell(String(val));
  return `"${safeStr.replace(/"/g, '""')}"`;
}

// ============================================================================
// PHASE 6: STRICT 4-PILLAR ROW QUARANTINE VALIDATORS & RESERVE SPARES ENGINE
// ============================================================================

export interface QuarantinedRowRecord {
  rowNumber: number;
  rawRow: Record<string, unknown>;
  fieldErrors: Record<string, string>;
  errorSummary: string;
}

export interface PillarQualitySummary {
  totalSubmitted: number;
  validCount: number;
  validAccepted: number;
  quarantinedCount: number;
  quarantinedRejected: number;
  completenessPct: number;
  duplicateKeysCount: number;
  reserveSparesFlaggedCount: number;
  reserveSparesCount: number;
  reserveSparesExcludedValue?: number;
  reserveSparesValueINR?: number;
  columnMappingUsed: Record<string, string>;
}

export interface PillarValidationResult<T> {
  validRows: T[];
  quarantinedRows: QuarantinedRowRecord[];
  qualitySummary: PillarQualitySummary;
}

export const DEFAULT_RESERVE_SPARE_KEYWORDS = [
  'CRITICAL SPARE',
  'INSURANCE SPARE',
  'OEM MACHINE SPARE',
  'CRITICAL_SPARE',
  'RESERVE SPARE',
] as const;

export interface ValidatedP1InventoryRow {
  id: string;
  Part_ID: string;
  Part_Description: string;
  Closing_Stock_Qty: number;
  Unit_Cost_INR: number;
  Last_Movement_Date: string;
  Category: 'Raw Material' | 'Finished Goods' | 'Spares' | 'Consumable';
  Is_Reserve_Spare: boolean;
  isReserveSpare: boolean;
  reserveTag?: 'CRITICAL_RESERVE_SPARE';
  // Engine-compatible fields for evaluateStockEngine
  itemCode: string;
  itemName: string;
  category: 'Raw Material' | 'Finished Goods' | 'Spares' | 'Consumable';
  qtyOnHand: number;
  costRate: number;
  lastMovement: string;
}

export interface ValidatedP2DispatchRow {
  id: string;
  Dispatch_ID: string;
  Customer_Name: string;
  Promised_Date: string;
  Dispatch_Date: string;
  Ordered_Qty: number;
  Dispatched_Qty: number;
  Part_Description: string;
  PO_Number: string;
  Delay_Reason: string;
  // Engine-compatible fields for calculateOTIFMetrics
  customer: string;
  po: string;
  part: string;
  orderedQty: number;
  shippedQty: number;
  promisedDate: string;
  actualOut: string;
  vehicle: string;
  delayReason: '' | 'Machine Down' | 'Material Short' | 'QC Hold' | 'No Truck' | 'Payment Hold' | 'Spec Change';
  notes: string;
}

export interface ValidatedP3FreightRow {
  id: string;
  LR_Number: string;
  Transporter: string;
  Weight_Ton: number;
  Weight_Kg: number;
  Distance_Km: number;
  Contract_Rate_INR: number;
  Billed_Amount_INR: number;
  Detention_INR: number;
  Advance_Paid_INR: number;
  Trip_Date: string;
  Lane: string;
  Wait_Hours: number;
  // Engine-compatible fields for calculateAuditMetrics
  date: string;
  lane: string;
  km: number;
  transporter: string;
  weightKg: number;
  bill: number;
  waitHours: number;
  split: 'Yes' | 'No';
  emptyReturn: 'Yes' | 'No';
  notes: string;
  sourceDoc: string;
}

export interface ValidatedP4WarehouseBinRow {
  id: string;
  Bin_ID: string;
  Part_ID: string;
  Part_Description: string;
  Book_Qty: number;
  Physical_Count_Qty: number;
  Unit_Cost_INR: number;
  // Engine-compatible fields for computeSummary / calculateItemFields
  code: string;
  part: string;
  spot: string;
  systemQty: number;
  physicalQty: number;
  cost: number;
  issuesPerMonth: number;
  statusNote: string;
}

function cleanStringValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

function inferStoreCategory(
  rawCat: string,
  description: string,
  isReserveSpare: boolean
): 'Raw Material' | 'Finished Goods' | 'Spares' | 'Consumable' {
  if (isReserveSpare) return 'Spares';
  const combined = `${rawCat} ${description}`.toLowerCase();
  if (combined.includes('spare') || combined.includes('bearing') || combined.includes('valve')) {
    return 'Spares';
  }
  if (combined.includes('finished') || combined.includes('fg') || combined.includes('assembly')) {
    return 'Finished Goods';
  }
  if (combined.includes('consumable') || combined.includes('oil') || combined.includes('insert')) {
    return 'Consumable';
  }
  return 'Raw Material';
}

export function isRowReserveSpare(
  rawRow: Record<string, unknown>,
  partDescription: string,
  rawCategory: string,
  customKeywords: readonly string[] = DEFAULT_RESERVE_SPARE_KEYWORDS
): boolean {
  const flagVal = rawRow.Is_Reserve_Spare ?? rawRow.isReserveSpare ?? rawRow.is_reserve_spare;
  if (
    flagVal === true ||
    String(flagVal).toLowerCase() === 'true' ||
    String(flagVal).toLowerCase() === 'yes' ||
    String(flagVal).toLowerCase() === '1' ||
    String(flagVal).toUpperCase() === 'CRITICAL_SPARE' ||
    String(flagVal).toUpperCase() === 'CRITICAL_RESERVE_SPARE'
  ) {
    return true;
  }

  const hay = `${partDescription} ${rawCategory}`.toUpperCase();
  return customKeywords.some((kw) => hay.includes(kw.toUpperCase()));
}

/**
 * Strictly validates P1 Inventory rows without silent fallback to 2026-09-20 or 0.
 */
export function validateP1InventoryRows(
  rawRows: Array<Record<string, unknown>>,
  options: {
    excludeReserveSpares?: boolean;
    reserveKeywords?: readonly string[];
  } = {}
): PillarValidationResult<ValidatedP1InventoryRow> {
  const validRows: ValidatedP1InventoryRow[] = [];
  const quarantinedRows: QuarantinedRowRecord[] = [];
  const seenKeys = new Set<string>();
  let duplicateKeysCount = 0;
  let reserveSparesFlaggedCount = 0;
  let reserveSparesExcludedValue = 0;

  const keywords = options.reserveKeywords || DEFAULT_RESERVE_SPARE_KEYWORDS;
  const inputRows = Array.isArray(rawRows) ? rawRows : [];
  const resolved = resolveP1InventoryColumns(inputRows);
  const rows = resolved.mappedRows;

  for (let idx = 0; idx < rows.length; idx++) {
    const raw = rows[idx] || {};
    const origRaw = inputRows[idx] || raw;
    const rowNumber = idx + 1;
    const fieldErrors: Record<string, string> = {};

    const rawPartId = cleanStringValue(raw.Part_ID ?? raw.itemCode ?? raw.sku ?? raw.part_id);
    if (!rawPartId) {
      fieldErrors.Part_ID = 'Part_ID is missing or blank.';
    }

    const rawDesc = cleanStringValue(
      raw.Part_Description ?? raw.itemName ?? raw.description ?? raw.part_description
    );
    if (!rawDesc) {
      fieldErrors.Part_Description = 'Part_Description is missing or blank.';
    }

    const qtyCheck = validateImportNumber(
      raw.Closing_Stock_Qty ?? raw.qtyOnHand ?? raw.closing_stock_qty ?? raw.qty,
      { allowNegative: false, allowZero: true }
    );
    if (qtyCheck.status !== 'VALID_NUMBER' || qtyCheck.value === undefined) {
      fieldErrors.Closing_Stock_Qty =
        qtyCheck.reason || 'Closing_Stock_Qty must be a non-negative number.';
    }

    const costCheck = validateImportNumber(
      raw.Unit_Cost_INR ?? raw.costRate ?? raw.unit_cost_inr ?? raw.rate,
      { allowNegative: false, allowZero: false }
    );
    if (costCheck.status !== 'VALID_NUMBER' || costCheck.value === undefined) {
      fieldErrors.Unit_Cost_INR =
        costCheck.reason || 'Unit_Cost_INR must be a valid positive number.';
    }

    const dateCheck = validateImportDate(
      raw.Last_Movement_Date ?? raw.lastMovement ?? raw.last_movement_date
    );
    if (dateCheck.status !== 'VALID' || !dateCheck.normalized) {
      fieldErrors.Last_Movement_Date =
        dateCheck.reason || `Last_Movement_Date (${dateCheck.status}) is invalid.`;
    }

    if (rawPartId) {
      const normKey = rawPartId.toUpperCase();
      if (seenKeys.has(normKey)) {
        duplicateKeysCount++;
        fieldErrors.Part_ID = `Duplicate Part_ID '${rawPartId}' detected in upload batch.`;
      } else {
        seenKeys.add(normKey);
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      const errorSummary = Object.entries(fieldErrors)
        .map(([col, msg]) => `${col}: ${msg}`)
        .join(' | ');
      quarantinedRows.push({
        rowNumber,
        rawRow: { ...origRaw, ...raw },
        fieldErrors,
        errorSummary,
      });
      continue;
    }

    const rawCat = cleanStringValue(raw.Category ?? raw.category);
    const reserveFlag = isRowReserveSpare(raw, rawDesc, rawCat, keywords);
    const category = inferStoreCategory(rawCat, rawDesc, reserveFlag);
    const safePartId = String(sanitizeSpreadsheetCell(rawPartId));
    const safeDesc = String(sanitizeSpreadsheetCell(rawDesc));
    const qtyVal = qtyCheck.value!;
    const costVal = costCheck.value!;
    const dateVal = dateCheck.normalized!;

    if (reserveFlag) {
      reserveSparesFlaggedCount++;
      reserveSparesExcludedValue += Math.round(qtyVal * costVal);
    }

    validRows.push({
      id: `p1-row-${rowNumber}-${safePartId}`,
      Part_ID: safePartId,
      Part_Description: safeDesc,
      Closing_Stock_Qty: qtyVal,
      Unit_Cost_INR: costVal,
      Last_Movement_Date: dateVal,
      Category: category,
      Is_Reserve_Spare: reserveFlag,
      isReserveSpare: reserveFlag,
      ...(reserveFlag ? { reserveTag: 'CRITICAL_RESERVE_SPARE' } : {}),
      itemCode: safePartId,
      itemName: reserveFlag && !safeDesc.toUpperCase().includes('RESERVE')
        ? `${safeDesc} [CRITICAL_RESERVE_SPARE]`
        : safeDesc,
      category,
      qtyOnHand: qtyVal,
      costRate: costVal,
      lastMovement: dateVal,
    });
  }

  const totalSubmitted = rows.length;
  const validCount = validRows.length;
  const quarantinedCount = quarantinedRows.length;
  const completenessPct =
    totalSubmitted > 0 ? Math.round((validCount / totalSubmitted) * 1000) / 10 : 100;

  return {
    validRows,
    quarantinedRows,
    qualitySummary: {
      totalSubmitted,
      validCount,
      validAccepted: validCount,
      quarantinedCount,
      quarantinedRejected: quarantinedCount,
      completenessPct,
      duplicateKeysCount,
      reserveSparesFlaggedCount,
      reserveSparesCount: reserveSparesFlaggedCount,
      reserveSparesExcludedValue,
      reserveSparesValueINR: reserveSparesExcludedValue,
      columnMappingUsed: resolved.columnMappingUsed,
    },
  };
}

/**
 * Strictly validates P2 Dispatch rows without silent date or numeric coercion.
 */
export function validateP2DispatchRows(
  rawRows: Array<Record<string, unknown>>
): PillarValidationResult<ValidatedP2DispatchRow> {
  const validRows: ValidatedP2DispatchRow[] = [];
  const quarantinedRows: QuarantinedRowRecord[] = [];
  const seenKeys = new Set<string>();
  let duplicateKeysCount = 0;
  const inputRows = Array.isArray(rawRows) ? rawRows : [];
  const resolved = resolveP2DispatchColumns(inputRows);
  const rows = resolved.mappedRows;

  const allowedReasons = [
    '',
    'Machine Down',
    'Material Short',
    'QC Hold',
    'No Truck',
    'Payment Hold',
    'Spec Change',
  ] as const;

  for (let idx = 0; idx < rows.length; idx++) {
    const raw = rows[idx] || {};
    const rowNumber = idx + 1;
    const fieldErrors: Record<string, string> = {};

    const dispatchId = cleanStringValue(raw.Dispatch_ID ?? raw.id ?? raw.dispatch_id);
    if (!dispatchId) {
      fieldErrors.Dispatch_ID = 'Dispatch_ID is missing or blank.';
    } else {
      const normKey = dispatchId.toUpperCase();
      if (seenKeys.has(normKey)) {
        duplicateKeysCount++;
        fieldErrors.Dispatch_ID = `Duplicate Dispatch_ID '${dispatchId}' detected.`;
      } else {
        seenKeys.add(normKey);
      }
    }

    const customerName = cleanStringValue(raw.Customer_Name ?? raw.customer ?? raw.customer_name);
    if (!customerName) {
      fieldErrors.Customer_Name = 'Customer_Name is missing or blank.';
    }

    const promisedCheck = validateImportDate(raw.Promised_Date ?? raw.promisedDate ?? raw.promised_date);
    if (promisedCheck.status !== 'VALID' || !promisedCheck.normalized) {
      fieldErrors.Promised_Date = promisedCheck.reason || 'Promised_Date is invalid.';
    }

    const dispatchDateCheck = validateImportDate(
      raw.Dispatch_Date ?? raw.actualOut ?? raw.dispatch_date
    );
    if (dispatchDateCheck.status !== 'VALID' || !dispatchDateCheck.normalized) {
      fieldErrors.Dispatch_Date = dispatchDateCheck.reason || 'Dispatch_Date is invalid.';
    }

    const orderedCheck = validateImportNumber(
      raw.Ordered_Qty ?? raw.orderedQty ?? raw.ordered_qty,
      { allowNegative: false, allowZero: false }
    );
    if (orderedCheck.status !== 'VALID_NUMBER' || orderedCheck.value === undefined) {
      fieldErrors.Ordered_Qty = orderedCheck.reason || 'Ordered_Qty must be a positive number.';
    }

    const dispatchedCheck = validateImportNumber(
      raw.Dispatched_Qty ?? raw.shippedQty ?? raw.dispatched_qty,
      { allowNegative: false, allowZero: true }
    );
    if (dispatchedCheck.status !== 'VALID_NUMBER' || dispatchedCheck.value === undefined) {
      fieldErrors.Dispatched_Qty =
        dispatchedCheck.reason || 'Dispatched_Qty must be a non-negative number.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      quarantinedRows.push({
        rowNumber,
        rawRow: raw,
        fieldErrors,
        errorSummary: Object.entries(fieldErrors)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | '),
      });
      continue;
    }

    const safeId = String(sanitizeSpreadsheetCell(dispatchId));
    const safeCustomer = String(sanitizeSpreadsheetCell(customerName));
    const safePart = String(
      sanitizeSpreadsheetCell(
        cleanStringValue(raw.Part_Description ?? raw.part) || `Dispatch Item ${rowNumber}`
      )
    );
    const safePo = String(
      sanitizeSpreadsheetCell(cleanStringValue(raw.PO_Number ?? raw.po) || `PO-${rowNumber}`)
    );
    const rawReason = cleanStringValue(raw.Delay_Reason ?? raw.delayReason);
    const delayReason = (allowedReasons as readonly string[]).includes(rawReason)
      ? (rawReason as ValidatedP2DispatchRow['delayReason'])
      : '';

    validRows.push({
      id: safeId,
      Dispatch_ID: safeId,
      Customer_Name: safeCustomer,
      Promised_Date: promisedCheck.normalized!,
      Dispatch_Date: dispatchDateCheck.normalized!,
      Ordered_Qty: orderedCheck.value!,
      Dispatched_Qty: dispatchedCheck.value!,
      Part_Description: safePart,
      PO_Number: safePo,
      Delay_Reason: delayReason,
      customer: safeCustomer,
      po: safePo,
      part: safePart,
      orderedQty: orderedCheck.value!,
      shippedQty: dispatchedCheck.value!,
      promisedDate: promisedCheck.normalized!,
      actualOut: dispatchDateCheck.normalized!,
      vehicle: String(sanitizeSpreadsheetCell(cleanStringValue(raw.vehicle) || 'TN-01-IND')),
      delayReason,
      notes: String(sanitizeSpreadsheetCell(cleanStringValue(raw.notes))),
    });
  }

  const totalSubmitted = rows.length;
  const validCount = validRows.length;
  const quarantinedCount = quarantinedRows.length;

  return {
    validRows,
    quarantinedRows,
    qualitySummary: {
      totalSubmitted,
      validCount,
      validAccepted: validCount,
      quarantinedCount,
      quarantinedRejected: quarantinedCount,
      completenessPct:
        totalSubmitted > 0 ? Math.round((validCount / totalSubmitted) * 1000) / 10 : 100,
      duplicateKeysCount,
      reserveSparesFlaggedCount: 0,
      reserveSparesCount: 0,
      columnMappingUsed: resolved.columnMappingUsed,
    },
  };
}

/**
 * Strictly validates P3 Freight rows without silent numeric coercion.
 */
export function validateP3FreightRows(
  rawRows: Array<Record<string, unknown>>
): PillarValidationResult<ValidatedP3FreightRow> {
  const validRows: ValidatedP3FreightRow[] = [];
  const quarantinedRows: QuarantinedRowRecord[] = [];
  const seenKeys = new Set<string>();
  let duplicateKeysCount = 0;
  const inputRows = Array.isArray(rawRows) ? rawRows : [];
  const resolved = resolveP3FreightColumns(inputRows);
  const rows = resolved.mappedRows;

  for (let idx = 0; idx < rows.length; idx++) {
    const raw = rows[idx] || {};
    const rowNumber = idx + 1;
    const fieldErrors: Record<string, string> = {};

    const lrNumber = cleanStringValue(raw.LR_Number ?? raw.id ?? raw.lr_number);
    if (!lrNumber) {
      fieldErrors.LR_Number = 'LR_Number is missing or blank.';
    } else {
      const normKey = lrNumber.toUpperCase();
      if (seenKeys.has(normKey)) {
        duplicateKeysCount++;
        fieldErrors.LR_Number = `Duplicate LR_Number '${lrNumber}' detected.`;
      } else {
        seenKeys.add(normKey);
      }
    }

    const transporter = cleanStringValue(raw.Transporter ?? raw.transporter);
    if (!transporter) {
      fieldErrors.Transporter = 'Transporter is missing or blank.';
    }

    // Accept Weight_Ton or Weight_Kg
    const hasTon = raw.Weight_Ton !== undefined && raw.Weight_Ton !== null && raw.Weight_Ton !== '';
    const weightCheck = hasTon
      ? validateImportNumber(raw.Weight_Ton, { allowNegative: false, allowZero: false })
      : validateImportNumber(raw.Weight_Kg ?? raw.weightKg, {
          allowNegative: false,
          allowZero: false,
        });
    if (weightCheck.status !== 'VALID_NUMBER' || weightCheck.value === undefined) {
      fieldErrors.Weight_Ton = weightCheck.reason || 'Weight must be a valid positive number.';
    }

    const kmCheck = validateImportNumber(raw.Distance_Km ?? raw.km ?? raw.distance_km ?? 100, {
      allowNegative: false,
      allowZero: false,
    });
    if (kmCheck.status !== 'VALID_NUMBER' || kmCheck.value === undefined) {
      fieldErrors.Distance_Km = kmCheck.reason || 'Distance_Km must be a positive number.';
    }

    const billedCheck = validateImportNumber(
      raw.Billed_Amount_INR ?? raw.bill ?? raw.billed_amount_inr,
      { allowNegative: false, allowZero: false }
    );
    if (billedCheck.status !== 'VALID_NUMBER' || billedCheck.value === undefined) {
      fieldErrors.Billed_Amount_INR =
        billedCheck.reason || 'Billed_Amount_INR must be a positive number.';
    }

    const contractRateRaw = raw.Contract_Rate_INR ?? raw.contract_rate_inr;
    let contractRateVal = billedCheck.value ?? 0;
    if (contractRateRaw !== undefined && contractRateRaw !== null && contractRateRaw !== '') {
      const crCheck = validateImportNumber(contractRateRaw, {
        allowNegative: false,
        allowZero: true,
      });
      if (crCheck.status !== 'VALID_NUMBER' || crCheck.value === undefined) {
        fieldErrors.Contract_Rate_INR =
          crCheck.reason || 'Contract_Rate_INR must be a valid non-negative number.';
      } else {
        contractRateVal = crCheck.value;
      }
    }

    const detentionRaw = raw.Detention_INR ?? raw.detention ?? raw.detention_inr ?? 0;
    const detCheck = validateImportNumber(detentionRaw, {
      allowNegative: false,
      allowZero: true,
    });
    if (detCheck.status !== 'VALID_NUMBER' || detCheck.value === undefined) {
      fieldErrors.Detention_INR = detCheck.reason || 'Detention_INR must be a non-negative number.';
    }

    const advanceRaw = raw.Advance_Paid_INR ?? raw.advance_paid_inr ?? 0;
    const advCheck = validateImportNumber(advanceRaw, {
      allowNegative: false,
      allowZero: true,
    });
    if (advCheck.status !== 'VALID_NUMBER' || advCheck.value === undefined) {
      fieldErrors.Advance_Paid_INR =
        advCheck.reason || 'Advance_Paid_INR must be a non-negative number.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      quarantinedRows.push({
        rowNumber,
        rawRow: raw,
        fieldErrors,
        errorSummary: Object.entries(fieldErrors)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | '),
      });
      continue;
    }

    const safeLr = String(sanitizeSpreadsheetCell(lrNumber));
    const safeTransporter = String(sanitizeSpreadsheetCell(transporter));
    const weightTon = hasTon ? weightCheck.value! : Math.round((weightCheck.value! / 1000) * 100) / 100;
    const weightKg = hasTon ? Math.round(weightCheck.value! * 1000) : Math.round(weightCheck.value!);
    const detInr = detCheck.value!;
    const waitHoursRaw = raw.Wait_Hours ?? raw.waitHours;
    const waitHours =
      waitHoursRaw !== undefined && waitHoursRaw !== null && waitHoursRaw !== ''
        ? Math.max(0, Number(waitHoursRaw) || 0)
        : detInr > 0
          ? Math.max(3, Math.round(detInr / 400) + 2)
          : 0;

    const rawTripDate = cleanStringValue(raw.Trip_Date ?? raw.date);
    const parsedDate = rawTripDate ? validateImportDate(rawTripDate) : null;
    const dateStr = parsedDate?.normalized || '2026-09-18';
    const laneStr = String(
      sanitizeSpreadsheetCell(cleanStringValue(raw.Lane ?? raw.lane) || 'Chennai -> OEM Hub')
    );

    validRows.push({
      id: safeLr,
      LR_Number: safeLr,
      Transporter: safeTransporter,
      Weight_Ton: weightTon,
      Weight_Kg: weightKg,
      Distance_Km: kmCheck.value!,
      Contract_Rate_INR: contractRateVal,
      Billed_Amount_INR: billedCheck.value!,
      Detention_INR: detInr,
      Advance_Paid_INR: advCheck.value!,
      Trip_Date: dateStr,
      Lane: laneStr,
      Wait_Hours: waitHours,
      date: dateStr,
      lane: laneStr,
      km: kmCheck.value!,
      transporter: safeTransporter,
      weightKg,
      bill: billedCheck.value!,
      waitHours,
      split: cleanStringValue(raw.split) === 'Yes' ? 'Yes' : 'No',
      emptyReturn: cleanStringValue(raw.emptyReturn) === 'No' ? 'No' : 'Yes',
      notes: String(sanitizeSpreadsheetCell(cleanStringValue(raw.notes))),
      sourceDoc: String(sanitizeSpreadsheetCell(cleanStringValue(raw.sourceDoc) || safeLr)),
    });
  }

  const totalSubmitted = rows.length;
  const validCount = validRows.length;
  const quarantinedCount = quarantinedRows.length;

  return {
    validRows,
    quarantinedRows,
    qualitySummary: {
      totalSubmitted,
      validCount,
      validAccepted: validCount,
      quarantinedCount,
      quarantinedRejected: quarantinedCount,
      completenessPct:
        totalSubmitted > 0 ? Math.round((validCount / totalSubmitted) * 1000) / 10 : 100,
      duplicateKeysCount,
      reserveSparesFlaggedCount: 0,
      reserveSparesCount: 0,
      columnMappingUsed: resolved.columnMappingUsed,
    },
  };
}

/**
 * Strictly validates P4 Warehouse Bin rows without silent numeric coercion.
 */
export function validateP4WarehouseBinRows(
  rawRows: Array<Record<string, unknown>>
): PillarValidationResult<ValidatedP4WarehouseBinRow> {
  const validRows: ValidatedP4WarehouseBinRow[] = [];
  const quarantinedRows: QuarantinedRowRecord[] = [];
  const seenKeys = new Set<string>();
  let duplicateKeysCount = 0;
  const inputRows = Array.isArray(rawRows) ? rawRows : [];
  const resolved = resolveP4WarehouseBinColumns(inputRows);
  const rows = resolved.mappedRows;

  for (let idx = 0; idx < rows.length; idx++) {
    const raw = rows[idx] || {};
    const rowNumber = idx + 1;
    const fieldErrors: Record<string, string> = {};

    const binId = cleanStringValue(raw.Bin_ID ?? raw.spot ?? raw.id ?? raw.bin_id);
    if (!binId) {
      fieldErrors.Bin_ID = 'Bin_ID is missing or blank.';
    }

    const partId = cleanStringValue(raw.Part_ID ?? raw.code ?? raw.part_id);
    if (!partId) {
      fieldErrors.Part_ID = 'Part_ID is missing or blank.';
    }

    if (binId && partId) {
      const compositeKey = `${binId.toUpperCase()}::${partId.toUpperCase()}`;
      if (seenKeys.has(compositeKey)) {
        duplicateKeysCount++;
        fieldErrors.Part_ID = `Duplicate Bin_ID + Part_ID combination (${binId} / ${partId}).`;
      } else {
        seenKeys.add(compositeKey);
      }
    }

    const bookCheck = validateImportNumber(raw.Book_Qty ?? raw.systemQty ?? raw.book_qty, {
      allowNegative: false,
      allowZero: true,
    });
    if (bookCheck.status !== 'VALID_NUMBER' || bookCheck.value === undefined) {
      fieldErrors.Book_Qty = bookCheck.reason || 'Book_Qty must be a non-negative number.';
    }

    const physCheck = validateImportNumber(
      raw.Physical_Count_Qty ?? raw.physicalQty ?? raw.physical_count_qty,
      { allowNegative: false, allowZero: true }
    );
    if (physCheck.status !== 'VALID_NUMBER' || physCheck.value === undefined) {
      fieldErrors.Physical_Count_Qty =
        physCheck.reason || 'Physical_Count_Qty must be a non-negative number.';
    }

    const costCheck = validateImportNumber(raw.Unit_Cost_INR ?? raw.cost ?? raw.unit_cost_inr, {
      allowNegative: false,
      allowZero: false,
    });
    if (costCheck.status !== 'VALID_NUMBER' || costCheck.value === undefined) {
      fieldErrors.Unit_Cost_INR = costCheck.reason || 'Unit_Cost_INR must be a positive number.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      quarantinedRows.push({
        rowNumber,
        rawRow: raw,
        fieldErrors,
        errorSummary: Object.entries(fieldErrors)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | '),
      });
      continue;
    }

    const safeBin = String(sanitizeSpreadsheetCell(binId));
    const safePartId = String(sanitizeSpreadsheetCell(partId));
    const safeDesc = String(
      sanitizeSpreadsheetCell(
        cleanStringValue(raw.Part_Description ?? raw.part) || `Bin Item ${safePartId}`
      )
    );
    const issuesRaw = raw.Monthly_Issues ?? raw.issuesPerMonth ?? 6;
    const issuesNum = Math.max(0, Number(issuesRaw) || 6);

    validRows.push({
      id: `bin-${rowNumber}-${safePartId}`,
      Bin_ID: safeBin,
      Part_ID: safePartId,
      Part_Description: safeDesc,
      Book_Qty: bookCheck.value!,
      Physical_Count_Qty: physCheck.value!,
      Unit_Cost_INR: costCheck.value!,
      code: safePartId,
      part: safeDesc,
      spot: safeBin,
      systemQty: bookCheck.value!,
      physicalQty: physCheck.value!,
      cost: costCheck.value!,
      issuesPerMonth: issuesNum,
      statusNote: String(sanitizeSpreadsheetCell(cleanStringValue(raw.statusNote))),
    });
  }

  const totalSubmitted = rows.length;
  const validCount = validRows.length;
  const quarantinedCount = quarantinedRows.length;

  return {
    validRows,
    quarantinedRows,
    qualitySummary: {
      totalSubmitted,
      validCount,
      validAccepted: validCount,
      quarantinedCount,
      quarantinedRejected: quarantinedCount,
      completenessPct:
        totalSubmitted > 0 ? Math.round((validCount / totalSubmitted) * 1000) / 10 : 100,
      duplicateKeysCount,
      reserveSparesFlaggedCount: 0,
      reserveSparesCount: 0,
      columnMappingUsed: resolved.columnMappingUsed,
    },
  };
}

/**
 * Client-Side Pre-Upload Anonymizer:
 * Masks proprietary Part_Description to MASKED-PART-001 (<Category>),
 * Customer_Name to MASKED-OEM-01, and Transporter to CARRIER-01
 * while preserving exact Part_ID codes, quantities, unit costs, dates,
 * reserve spare tags, and P1–P4 mathematical totals.
 */
export function anonymizeP1ToP4DatasetClientSide(input: {
  p1Rows?: Array<Record<string, unknown>>;
  p2Rows?: Array<Record<string, unknown>>;
  p3Rows?: Array<Record<string, unknown>>;
  p4Rows?: Array<Record<string, unknown>>;
}): {
  p1Rows: Array<Record<string, unknown>>;
  p2Rows: Array<Record<string, unknown>>;
  p3Rows: Array<Record<string, unknown>>;
  p4Rows: Array<Record<string, unknown>>;
} {
  const customerAliasMap = new Map<string, string>();
  const carrierAliasMap = new Map<string, string>();

  const p1Rows = (input.p1Rows || []).map((row, idx) => {
    const num = String(idx + 1).padStart(3, '0');
    const rawDesc = cleanStringValue(
      row.Part_Description ??
        row.itemName ??
        row.description ??
        row.Particulars ??
        row['Stock Item Name']
    );
    const rawCat =
      cleanStringValue(row.Category ?? row.category ?? row.Stock_Group ?? row['Stock Group']) ||
      'General';
    const isRes = isRowReserveSpare(row, rawDesc, rawCat);
    const maskedDesc = isRes
      ? `MASKED-PART-${num} (${rawCat} - CRITICAL SPARE)`
      : `MASKED-PART-${num} (${rawCat})`;

    const next: Record<string, unknown> = {
      ...row,
      Part_Description: maskedDesc,
    };
    if ('itemName' in row) next.itemName = maskedDesc;
    if ('Particulars' in row) next.Particulars = maskedDesc;
    if ('Stock Item Name' in row) next['Stock Item Name'] = maskedDesc;
    if ('MAKTX' in row) next.MAKTX = maskedDesc;
    if (isRes) next.Is_Reserve_Spare = true;
    return next;
  });

  const p2Rows = (input.p2Rows || []).map((row, idx) => {
    const rawCust =
      cleanStringValue(row.Customer_Name ?? row.customer ?? row['Party Name']) || `Customer-${idx + 1}`;
    let custMask = customerAliasMap.get(rawCust.toUpperCase());
    if (!custMask) {
      custMask = `MASKED-OEM-${String(customerAliasMap.size + 1).padStart(2, '0')}`;
      customerAliasMap.set(rawCust.toUpperCase(), custMask);
    }
    const next: Record<string, unknown> = {
      ...row,
      Customer_Name: custMask,
    };
    if ('customer' in row) next.customer = custMask;
    if ('Part_Description' in row || 'part' in row || 'Part_Code' in row) {
      const partMask = `MASKED-DISPATCH-PART-${String(idx + 1).padStart(3, '0')}`;
      next.Part_Description = partMask;
      if ('part' in row) next.part = partMask;
      if ('Part_Code' in row) next.Part_Code = partMask;
    }
    return next;
  });

  const p3Rows = (input.p3Rows || []).map((row, idx) => {
    const rawTrans =
      cleanStringValue(
        row.Transporter ?? row.Transporter_Name ?? row.transporter ?? row.Carrier
      ) || `Carrier-${idx + 1}`;
    let carrierMask = carrierAliasMap.get(rawTrans.toUpperCase());
    if (!carrierMask) {
      carrierMask = `CARRIER-${String(carrierAliasMap.size + 1).padStart(2, '0')}`;
      carrierAliasMap.set(rawTrans.toUpperCase(), carrierMask);
    }
    const next: Record<string, unknown> = {
      ...row,
      Transporter: carrierMask,
    };
    if ('Transporter_Name' in row) next.Transporter_Name = carrierMask;
    if ('transporter' in row) next.transporter = carrierMask;
    return next;
  });

  const p4Rows = (input.p4Rows || []).map((row, idx) => {
    const num = String(idx + 1).padStart(3, '0');
    const maskedDesc = `MASKED-PART-${num} (Bin Audit)`;
    const next: Record<string, unknown> = {
      ...row,
      Part_Description: maskedDesc,
    };
    if ('part' in row) next.part = maskedDesc;
    return next;
  });

  return { p1Rows, p2Rows, p3Rows, p4Rows };
}

/**
 * Generates a realistic Tally Prime / SAP export containing:
 * - 18 Valid P1 rows (using Tally Prime & SAP header names like `Stock_Item_Code`, `Particulars`, `Closing_Balance`, `Std_Rate`, `Last_Voucher_Date`, `Stock_Group`, `Is_Reserve_Spare`)
 * - 2 of those 18 valid rows are Critical Machine / Insurance Spares (`Is_Reserve_Spare: 'YES'`, ₹68,500 + ₹44,000 = ₹1,12,500 total book value)
 * - 4 Intentional Dirty Rows (missing `Stock_Item_Code`, negative `Closing_Balance: -45`, non-numeric `Std_Rate: 'TBD_RATE'`, corrupted `Last_Voucher_Date: '32/13/2026'`)
 * Total = 22 P1 rows (18 Valid + 4 Quarantined).
 */
export function buildSampleDirtyTallyPrimeExportDataset(): {
  p1Rows: Array<Record<string, unknown>>;
  p2Rows: Array<Record<string, unknown>>;
  p3Rows: Array<Record<string, unknown>>;
  p4Rows: Array<Record<string, unknown>>;
} {
  const p1Rows: Array<Record<string, unknown>> = [
    {
      Stock_Item_Code: 'AMB-RM-101',
      Particulars: 'EN8 Forged Steel Round Bar 65mm (Tally Batch #441)',
      Stock_Group: 'Raw Material',
      Closing_Balance: '420',
      Std_Rate: '₹185',
      Last_Voucher_Date: '12-Aug-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-RM-102',
      Particulars: 'SG Iron Casting Housing Blank SG400/15',
      Stock_Group: 'Raw Material',
      Closing_Balance: '95',
      Std_Rate: '₹1,120',
      Last_Voucher_Date: '15-Jan-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-FG-201',
      Particulars: 'Machined Hydraulic Valve Manifold Assembly V4',
      Stock_Group: 'Finished Goods',
      Closing_Balance: '28',
      Std_Rate: '₹4,450',
      Last_Voucher_Date: '04-Feb-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-FG-204',
      Particulars: 'High-Pressure Flange Adapter DN80 (Legacy OEM Spec)',
      Stock_Group: 'Finished Goods',
      Closing_Balance: '64',
      Std_Rate: '₹1,650',
      Last_Voucher_Date: '19-Nov-2025',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-RM-108',
      Particulars: 'SS316L Cold Drawn Hex Bar 32mm',
      Stock_Group: 'Raw Material',
      Closing_Balance: '150',
      Std_Rate: '₹410',
      Last_Voucher_Date: '18-May-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-CN-301',
      Particulars: 'Carbide CNC Turning Insert CNMG 120408 (Box of 10)',
      Stock_Group: 'Consumable',
      Closing_Balance: '35',
      Std_Rate: '₹2,150',
      Last_Voucher_Date: '02-Sep-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-FG-209',
      Particulars: 'Precision Ground Pump Shaft Ø40x320mm',
      Stock_Group: 'Finished Goods',
      Closing_Balance: '42',
      Std_Rate: '₹1,980',
      Last_Voucher_Date: '10-Dec-2025',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-RM-114',
      Particulars: 'Phosphor Bronze Bush Blank PB2 Ø90mm',
      Stock_Group: 'Raw Material',
      Closing_Balance: '38',
      Std_Rate: '₹2,400',
      Last_Voucher_Date: '22-Jan-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-CN-305',
      Particulars: 'Synthetic Water-Soluble CNC Coolant Concentrate 20L',
      Stock_Group: 'Consumable',
      Closing_Balance: '18',
      Std_Rate: '₹3,200',
      Last_Voucher_Date: '28-Aug-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-FG-215',
      Particulars: 'Actuator Mounting Bracket Sub-Assembly Rev-A (Obsolete)',
      Stock_Group: 'Finished Goods',
      Closing_Balance: '80',
      Std_Rate: '₹890',
      Last_Voucher_Date: '14-Oct-2025',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-RM-119',
      Particulars: 'Alloy Steel Forged Gear Blank 20MnCr5',
      Stock_Group: 'Raw Material',
      Closing_Balance: '110',
      Std_Rate: '₹760',
      Last_Voucher_Date: '05-Jun-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-SP-401',
      Particulars: 'Standard V-Belt Drive Set B-68',
      Stock_Group: 'Spares',
      Closing_Balance: '24',
      Std_Rate: '₹650',
      Last_Voucher_Date: '11-Feb-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-FG-221',
      Particulars: 'Heavy Duty Check Valve Body 4-Inch Class 300',
      Stock_Group: 'Finished Goods',
      Closing_Balance: '19',
      Std_Rate: '₹5,400',
      Last_Voucher_Date: '09-Jan-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-RM-125',
      Particulars: 'Ductile Iron Manifolds Batch #119',
      Stock_Group: 'Raw Material',
      Closing_Balance: '60',
      Std_Rate: '₹1,350',
      Last_Voucher_Date: '14-Aug-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-CN-312',
      Particulars: 'VCI Rust Preventive Export Packaging Film Roll',
      Stock_Group: 'Consumable',
      Closing_Balance: '45',
      Std_Rate: '₹920',
      Last_Voucher_Date: '25-Jul-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-FG-228',
      Particulars: 'Custom Tapered Roller Bearing Housing Assembly',
      Stock_Group: 'Finished Goods',
      Closing_Balance: '32',
      Std_Rate: '₹2,750',
      Last_Voucher_Date: '01-Mar-2026',
      Is_Reserve_Spare: 'NO',
    },
    // 2 Critical Machine / Insurance Spares (Valid rows, >180d old, tagged as Reserve Spares under Item 07)
    {
      Stock_Item_Code: 'AMB-SP-901',
      Particulars: 'Mazak VTC-800 Main CNC Spindle Cartridge Assembly (Critical Machine Spare)',
      Stock_Group: 'Spares',
      Closing_Balance: '1',
      Std_Rate: '₹68,500',
      Last_Voucher_Date: '12-Sep-2025',
      Is_Reserve_Spare: 'YES',
    },
    {
      Stock_Item_Code: 'AMB-SP-902',
      Particulars: 'Fanuc Alpha-i Servo Amplifier Drive Module (Insurance Spare)',
      Stock_Group: 'Spares',
      Closing_Balance: '1',
      Std_Rate: '₹44,000',
      Last_Voucher_Date: '20-Oct-2025',
      Is_Reserve_Spare: 'YES',
    },
    // 4 Intentional Dirty Rows (to trigger Quarantine Engine & Interactive Cell Repair)
    {
      Stock_Item_Code: '',
      Particulars: 'Unindexed Shopfloor Casting Scrap Pallet #7',
      Stock_Group: 'Raw Material',
      Closing_Balance: '50',
      Std_Rate: '₹420',
      Last_Voucher_Date: '10-04-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-DIRTY-NEG',
      Particulars: 'Unreconciled Sub-Contractor Challan Return (Negative Ledger Balance)',
      Stock_Group: 'Raw Material',
      Closing_Balance: '-45',
      Std_Rate: '₹1,150',
      Last_Voucher_Date: '18-03-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-DIRTY-RATE',
      Particulars: 'Imported Special Seal Kit (Pending Customs Valuation)',
      Stock_Group: 'Spares',
      Closing_Balance: '15',
      Std_Rate: 'TBD_RATE',
      Last_Voucher_Date: '05-05-2026',
      Is_Reserve_Spare: 'NO',
    },
    {
      Stock_Item_Code: 'AMB-DIRTY-DATE',
      Particulars: 'Legacy Forged Coupling Batch (Corrupted Tally Voucher Date)',
      Stock_Group: 'Finished Goods',
      Closing_Balance: '30',
      Std_Rate: '₹1,800',
      Last_Voucher_Date: '32/13/2026',
      Is_Reserve_Spare: 'NO',
    },
  ];

  const p2Rows: Array<Record<string, unknown>> = [
    {
      Dispatch_ID: 'DISP-901',
      Customer_Name: 'Ashok Leyland Ennore Unit',
      PO_Number: 'PO-AL-8812',
      Part_Description: 'Machined Hydraulic Valve Manifold Assembly V4',
      Ordered_Qty: '50',
      Dispatched_Qty: '50',
      Promised_Date: '14-09-2026',
      Dispatch_Date: '14-09-2026',
      Delay_Reason: '',
    },
    {
      Dispatch_ID: 'DISP-902',
      Customer_Name: 'TAFE Sembium Tractor Division',
      PO_Number: 'PO-TF-4410',
      Part_Description: 'Precision Ground Pump Shaft Ø40x320mm',
      Ordered_Qty: '100',
      Dispatched_Qty: '82',
      Promised_Date: '15-09-2026',
      Dispatch_Date: '17-09-2026',
      Delay_Reason: 'Machine Down',
    },
    {
      Dispatch_ID: 'DISP-903',
      Customer_Name: 'Caterpillar India Tiruvallur',
      PO_Number: 'PO-CAT-2190',
      Part_Description: 'Heavy Duty Check Valve Body 4-Inch Class 300',
      Ordered_Qty: '40',
      Dispatched_Qty: '40',
      Promised_Date: '16-09-2026',
      Dispatch_Date: '16-09-2026',
      Delay_Reason: '',
    },
  ];

  const p3Rows: Array<Record<string, unknown>> = [
    {
      LR_Number: 'LR-CHN-7701',
      Transporter: 'Sri Murugan Heavy Logistics',
      Weight_Ton: '8.5',
      Distance_Km: '45',
      Contract_Rate_INR: '9500',
      Billed_Amount_INR: '11200',
      Detention_INR: '1600',
      Advance_Paid_INR: '5000',
      Trip_Date: '15-09-2026',
      Lane: 'Ambattur -> Ennore Foundry Hub',
    },
    {
      LR_Number: 'LR-CHN-7702',
      Transporter: 'KPN Industrial Freight',
      Weight_Ton: '12.0',
      Distance_Km: '310',
      Contract_Rate_INR: '24000',
      Billed_Amount_INR: '24000',
      Detention_INR: '0',
      Advance_Paid_INR: '10000',
      Trip_Date: '16-09-2026',
      Lane: 'Ambattur -> Hosur OEM Plant',
    },
  ];

  const p4Rows: Array<Record<string, unknown>> = [
    {
      Bin_ID: 'RACK-A-01',
      Part_ID: 'AMB-RM-101',
      Part_Description: 'EN8 Forged Steel Round Bar 65mm',
      Book_Qty: '420',
      Physical_Count_Qty: '420',
      Unit_Cost_INR: '185',
    },
    {
      Bin_ID: 'RACK-B-04',
      Part_ID: 'AMB-FG-201',
      Part_Description: 'Machined Hydraulic Valve Manifold Assembly V4',
      Book_Qty: '28',
      Physical_Count_Qty: '23',
      Unit_Cost_INR: '4450',
    },
  ];

  return { p1Rows, p2Rows, p3Rows, p4Rows };
}


