/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Deterministic ERP Header Alias Resolver for Tally Prime, SAP (ECC/S4/B1), Busy, and Excel exports.
 * Maps raw column headers to Operationalyst's canonical P1–P4 schemas before validation.
 */

export type IngestionPillar = 'p1' | 'p2' | 'p3' | 'p4';

export interface ColumnResolutionResult<T = Record<string, unknown>> {
  mappedRows: T[];
  columnMappingUsed: Record<string, string>;
  unmappedHeaders: string[];
}

/**
 * Normalizes a column header string for deterministic alias lookup:
 * lowercases, strips currency/unit parentheticals or symbols, and collapses non-alphanumeric runs to '_'.
 */
export function normalizeHeaderKey(rawHeader: string): string {
  return String(rawHeader || '')
    .trim()
    .toLowerCase()
    .replace(/₹/g, 'inr')
    .replace(/%/g, 'pct')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export const P1_HEADER_ALIASES: Record<string, string[]> = {
  Part_ID: [
    'part_id',
    'item_code',
    'sku',
    'part_no',
    'part_number',
    'matnr',
    'stock_item_code',
    'material_code',
    'material_no',
    'item_id',
    'stock_code',
    'code',
    'part_code',
  ],
  Part_Description: [
    'part_description',
    'description',
    'stock_item_name',
    'material_description',
    'maktx',
    'particulars',
    'item_name',
    'part_name',
    'material_name',
    'item_description',
    'name',
  ],
  Closing_Stock_Qty: [
    'closing_stock_qty',
    'qty',
    'closing_balance',
    'closing_qty',
    'labst',
    'quantity_on_hand',
    'stock_qty',
    'qty_on_hand',
    'unrestricted_stock',
    'balance_qty',
    'closing_stock',
    'quantity',
  ],
  Unit_Cost_INR: [
    'unit_cost_inr',
    'rate',
    'std_rate',
    'standard_rate',
    'unit_price',
    'closing_rate',
    'verpr',
    'standard_cost',
    'unit_valuation',
    'cost_rate',
    'unit_cost',
    'valuation_rate',
    'moving_avg_price',
    'price_inr',
    'rate_inr',
    'cost',
  ],
  Last_Movement_Date: [
    'last_movement_date',
    'last_issue_date',
    'last_voucher_date',
    'last_txn_date',
    'movement_date',
    'budat',
    'last_movement',
    'last_consumption_date',
    'voucher_date',
    'posting_date',
    'last_sale_date',
  ],
  Category: [
    'category',
    'stock_group',
    'material_group',
    'matkl',
    'item_group',
    'store_category',
    'group_name',
    'group',
    'material_type',
  ],
  Is_Reserve_Spare: [
    'is_reserve_spare',
    'reserve_spare',
    'critical_spare',
    'insurance_spare',
    'oem_machine_spare',
    'spare_flag',
    'is_critical_spare',
  ],
};

export const P2_HEADER_ALIASES: Record<string, string[]> = {
  Dispatch_ID: [
    'dispatch_id',
    'challan_no',
    'vbeln',
    'delivery_id',
    'shipment_id',
    'dc_no',
    'invoice_no',
    'dispatch_no',
    'id',
  ],
  Customer_Name: [
    'customer_name',
    'customer',
    'party_name',
    'kunnr',
    'oem_customer',
    'buyer_name',
    'consignee',
    'client_name',
    'party',
  ],
  Promised_Date: [
    'promised_date',
    'edatu',
    'due_date',
    'po_delivery_date',
    'committed_date',
    'schedule_date',
    'target_date',
    'promised_delivery_date',
  ],
  Dispatch_Date: [
    'dispatch_date',
    'wadat_ist',
    'actual_out',
    'actual_gate_out_date',
    'gate_out_date',
    'shipped_date',
    'challan_date',
    'delivery_date',
    'actual_dispatch_date',
  ],
  Ordered_Qty: [
    'ordered_qty',
    'kwmeng',
    'po_qty',
    'order_qty',
    'scheduled_qty',
    'required_qty',
    'order_quantity',
  ],
  Dispatched_Qty: [
    'dispatched_qty',
    'lfimg',
    'shipped_qty',
    'billed_qty',
    'delivered_qty',
    'challan_qty',
    'actual_qty',
    'dispatch_quantity',
  ],
  Part_Description: [
    'part_description',
    'part',
    'part_code',
    'item_name',
    'material',
    'maktx',
    'sku',
    'part_name',
  ],
  PO_Number: [
    'po_number',
    'po',
    'bstnk',
    'customer_po',
    'order_no',
    'po_ref',
  ],
  Delay_Reason: [
    'delay_reason',
    'delay_reason_category',
    'failure_reason',
    'delay_cause',
    'remarks',
    'reason',
  ],
};

export const P3_HEADER_ALIASES: Record<string, string[]> = {
  LR_Number: [
    'lr_number',
    'lr_no',
    'trip_id',
    'tknum',
    'bilty_no',
    'consignment_no',
    'docket_no',
    'gc_no',
    'id',
  ],
  Transporter: [
    'transporter',
    'carrier',
    'carrier_name',
    'vendor_name',
    'lifnr',
    'transport_company',
    'logistics_partner',
    'fleet_vendor',
    'transporter_name',
  ],
  Weight_Ton: [
    'weight_ton',
    'tonnage',
    'wt_mt',
    'ntgew_ton',
    'metric_tons',
    'tons',
    'load_ton',
    'weight_mt',
  ],
  Weight_Kg: [
    'weight_kg',
    'load_weight_kg',
    'ntgew',
    'brgew',
    'gross_weight_kg',
    'net_weight_kg',
    'wt_kg',
    'load_kg',
  ],
  Distance_Km: [
    'distance_km',
    'km',
    'distanz',
    'route_km',
    'kilometers',
    'distance',
    'trip_km',
  ],
  Contract_Rate_INR: [
    'contract_rate_inr',
    'agreed_rate',
    'rate_card_inr',
    'standard_freight',
    'contract_amount',
    'expected_bill',
    'contract_rate',
  ],
  Billed_Amount_INR: [
    'billed_amount_inr',
    'freight_bill_inr',
    'bill',
    'netwr',
    'invoice_amount',
    'freight_billed',
    'total_bill_inr',
    'billed_inr',
    'freight_amount',
  ],
  Detention_INR: [
    'detention_inr',
    'detention_charges',
    'halting_charges',
    'halt_charges',
    'waiting_charge_inr',
    'detention',
    'detention_amount',
  ],
  Advance_Paid_INR: [
    'advance_paid_inr',
    'advance',
    'diesel_advance',
    'advance_inr',
    'advance_paid',
  ],
  Trip_Date: [
    'trip_date',
    'date',
    'lr_date',
    'dispatch_date',
    'invoice_date',
  ],
  Lane: [
    'lane',
    'route_lane',
    'route',
    'origin_destination',
    'sector',
    'corridor',
  ],
  Wait_Hours: [
    'wait_hours',
    'gate_wait_hours',
    'waiting_hours',
    'gate_wait_hrs',
    'halt_hours',
    'detention_hours',
  ],
};

export const P4_HEADER_ALIASES: Record<string, string[]> = {
  Bin_ID: [
    'bin_id',
    'lgpla',
    'rack_bin',
    'rack_location',
    'rack_zone',
    'location_code',
    'bin_code',
    'storage_bin',
    'bin_no',
    'spot',
    'id',
  ],
  Part_ID: [
    'part_id',
    'code',
    'item_code',
    'sku',
    'matnr',
    'part_code',
    'stock_item_code',
    'material_code',
  ],
  Book_Qty: [
    'book_qty',
    'system_book_qty',
    'system_qty',
    'buchm',
    'erp_qty',
    'tally_qty',
    'ledger_qty',
    'closing_book_qty',
    'book_balance',
  ],
  Physical_Count_Qty: [
    'physical_count_qty',
    'physical_qty',
    'actual_qty',
    'menge',
    'counted_qty',
    'floor_count',
    'actual_bin_qty',
    'audit_qty',
    'physical_balance',
  ],
  Unit_Cost_INR: [
    'unit_cost_inr',
    'rate_inr',
    'cost',
    'rate',
    'unit_price',
    'verpr',
    'valuation_rate',
    'cost_rate',
    'unit_cost',
  ],
  Part_Description: [
    'part_description',
    'part',
    'description',
    'item_name',
    'maktx',
    'stock_item_name',
  ],
  Monthly_Issues: [
    'monthly_issues',
    'monthly_issues_freq',
    'issues_per_month',
    'picks_per_month',
    'monthly_consumption',
  ],
};

const ALIAS_MAP_BY_PILLAR: Record<IngestionPillar, Record<string, string[]>> = {
  p1: P1_HEADER_ALIASES,
  p2: P2_HEADER_ALIASES,
  p3: P3_HEADER_ALIASES,
  p4: P4_HEADER_ALIASES,
};

/**
 * Resolves raw spreadsheet/ERP row objects to canonical Operationalyst column names for a given pillar ('p1' | 'p2' | 'p3' | 'p4').
 */
export function resolveErpRowsColumns(
  rawRows: Array<Record<string, unknown>>,
  pillar: IngestionPillar = 'p1'
): ColumnResolutionResult<Record<string, unknown>> {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return {
      mappedRows: [],
      columnMappingUsed: {},
      unmappedHeaders: [],
    };
  }

  const aliasDictionary = ALIAS_MAP_BY_PILLAR[pillar] || P1_HEADER_ALIASES;

  // Build reverse lookup: normalizedAlias -> canonicalField
  const normalizedToCanonical = new Map<string, string>();
  for (const [canonicalField, aliases] of Object.entries(aliasDictionary)) {
    normalizedToCanonical.set(normalizeHeaderKey(canonicalField), canonicalField);
    for (const alias of aliases) {
      normalizedToCanonical.set(normalizeHeaderKey(alias), canonicalField);
    }
  }

  // Collect all distinct raw headers across the input rows
  const distinctRawHeaders = new Set<string>();
  for (const row of rawRows) {
    if (row && typeof row === 'object') {
      for (const k of Object.keys(row)) {
        distinctRawHeaders.add(k);
      }
    }
  }

  const rawToCanonicalMap = new Map<string, string>();
  const columnMappingUsed: Record<string, string> = {};
  const unmappedHeaders: string[] = [];

  for (const rawHeader of distinctRawHeaders) {
    const norm = normalizeHeaderKey(rawHeader);
    const canonical = normalizedToCanonical.get(norm);
    if (canonical) {
      rawToCanonicalMap.set(rawHeader, canonical);
      columnMappingUsed[canonical] = rawHeader;
      if (rawHeader !== canonical) {
        columnMappingUsed[rawHeader] = canonical;
      }
    } else {
      unmappedHeaders.push(rawHeader);
    }
  }

  const mappedRows = rawRows.map((row) => {
    if (!row || typeof row !== 'object') return {};
    const out: Record<string, unknown> = {};
    for (const [rawKey, value] of Object.entries(row)) {
      const canonicalKey = rawToCanonicalMap.get(rawKey);
      if (canonicalKey) {
        // Only overwrite if canonicalKey isn't already populated with a non-empty value
        if (out[canonicalKey] === undefined || out[canonicalKey] === '') {
          out[canonicalKey] = value;
        }
      } else {
        out[rawKey] = value;
      }
    }
    return out;
  });

  return {
    mappedRows,
    columnMappingUsed,
    unmappedHeaders,
  };
}

export const resolveP1InventoryColumns = (rows: Array<Record<string, unknown>>) =>
  resolveErpRowsColumns(rows, 'p1');
export const resolveP2DispatchColumns = (rows: Array<Record<string, unknown>>) =>
  resolveErpRowsColumns(rows, 'p2');
export const resolveP3FreightColumns = (rows: Array<Record<string, unknown>>) =>
  resolveErpRowsColumns(rows, 'p3');
export const resolveP4WarehouseBinColumns = (rows: Array<Record<string, unknown>>) =>
  resolveErpRowsColumns(rows, 'p4');
