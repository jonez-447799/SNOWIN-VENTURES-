/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import {
  sanitizeSpreadsheetCell,
  toSafeCsvCell,
  type QuarantinedRowRecord,
} from './importValidation.ts';
import { trackServerFunnelEvent } from './analytics.ts';

export const PILOT_DATA_KIT_COLUMNS = [
  'Part_ID',
  'Part_Description',
  'Closing_Stock_Qty',
  'Unit_Cost_INR',
  'Last_Movement_Date',
] as const;

export const PILOT_DATA_KIT_FIVE_SHEET_NAMES = [
  '1_P1_Inventory_Template',
  '2_P2_OTIF_Template',
  '3_P3_Freight_Template',
  '4_P4_Warehouse_Bin_Template',
  '5_ERP_Export_&_Anonymization_Guide',
] as const;

export interface PilotDataKitTemplateRow {
  Part_ID: string;
  Part_Description: string;
  Closing_Stock_Qty: number;
  Unit_Cost_INR: number;
  Last_Movement_Date: string;
  Category?: string;
  Is_Reserve_Spare?: string;
}

export interface PilotP2TemplateRow {
  Dispatch_ID: string;
  Customer_Name: string;
  Part_Description: string;
  PO_Number: string;
  Ordered_Qty: number;
  Dispatched_Qty: number;
  Promised_Date: string;
  Dispatch_Date: string;
  Delay_Reason: string;
}

export interface PilotP3TemplateRow {
  LR_Number: string;
  Trip_Date: string;
  Lane: string;
  Transporter: string;
  Weight_Ton: number;
  Distance_Km: number;
  Contract_Rate_INR: number;
  Billed_Amount_INR: number;
  Detention_INR: number;
  Advance_Paid_INR: number;
}

export interface PilotP4TemplateRow {
  Bin_ID: string;
  Part_ID: string;
  Part_Description: string;
  Book_Qty: number;
  Physical_Count_Qty: number;
  Unit_Cost_INR: number;
}

export interface PilotDataKitGuideSection {
  Topic: string;
  Step_Or_Rule: string;
  Practical_Instructions: string;
  Anonymization_And_Safety_Notes: string;
}

/**
 * Returns the 5 clearly marked illustrative sample rows for the 5-Column Inventory Audit Template.
 * Every string cell is sanitized against spreadsheet formula injection.
 */
export function buildPilotDataKitSampleRows(): PilotDataKitTemplateRow[] {
  const rawRows: PilotDataKitTemplateRow[] = [
    {
      Part_ID: 'SKU-CAST-001 (SAMPLE - DELETE BEFORE UPLOAD)',
      Part_Description: 'Machined Housing Bracket — Cast Iron (Illustrative Sample Row 1)',
      Closing_Stock_Qty: 48,
      Unit_Cost_INR: 8500,
      Last_Movement_Date: '2025-11-14',
      Category: 'Raw Material',
      Is_Reserve_Spare: 'FALSE',
    },
    {
      Part_ID: 'SKU-BRG-002 (SAMPLE - DELETE BEFORE UPLOAD)',
      Part_Description: 'CRITICAL SPARE — CNC Spindle Bearing 6308 (Illustrative Sample Row 2)',
      Closing_Stock_Qty: 12,
      Unit_Cost_INR: 14500,
      Last_Movement_Date: '2026-01-19',
      Category: 'Spares',
      Is_Reserve_Spare: 'TRUE',
    },
    {
      Part_ID: 'SKU-STL-003 (SAMPLE - DELETE BEFORE UPLOAD)',
      Part_Description: 'EN24 Alloy Steel Round Bar 60mm Dia (Illustrative Sample Row 3)',
      Closing_Stock_Qty: 35,
      Unit_Cost_INR: 4200,
      Last_Movement_Date: '2026-03-05',
      Category: 'Raw Material',
      Is_Reserve_Spare: 'FALSE',
    },
    {
      Part_ID: 'SKU-FST-004 (SAMPLE - DELETE BEFORE UPLOAD)',
      Part_Description: 'High-Tensile Hex Bolt M12x60 Grade 10.9 (Illustrative Sample Row 4)',
      Closing_Stock_Qty: 1500,
      Unit_Cost_INR: 24,
      Last_Movement_Date: '2026-06-22',
      Category: 'Consumable',
      Is_Reserve_Spare: 'FALSE',
    },
    {
      Part_ID: 'SKU-VLV-005 (SAMPLE - DELETE BEFORE UPLOAD)',
      Part_Description: 'SS 304 Ball Valve 1 Inch Industrial (Illustrative Sample Row 5)',
      Closing_Stock_Qty: 28,
      Unit_Cost_INR: 1850,
      Last_Movement_Date: '2026-09-18',
      Category: 'Finished Goods',
      Is_Reserve_Spare: 'FALSE',
    },
  ];

  return rawRows.map((row) => ({
    Part_ID: String(sanitizeSpreadsheetCell(row.Part_ID)),
    Part_Description: String(sanitizeSpreadsheetCell(row.Part_Description)),
    Closing_Stock_Qty: Number(row.Closing_Stock_Qty),
    Unit_Cost_INR: Number(row.Unit_Cost_INR),
    Last_Movement_Date: String(sanitizeSpreadsheetCell(row.Last_Movement_Date)),
    Category: String(sanitizeSpreadsheetCell(row.Category || 'Raw Material')),
    Is_Reserve_Spare: String(sanitizeSpreadsheetCell(row.Is_Reserve_Spare || 'FALSE')),
  }));
}

export function buildPilotP2SampleRows(): PilotP2TemplateRow[] {
  return [
    {
      Dispatch_ID: 'DISP-SAMPLE-01',
      Customer_Name: 'OEM Auto Assembly Line A',
      Part_Description: 'Machined Housing Bracket',
      PO_Number: 'PO-2026-881',
      Ordered_Qty: 200,
      Dispatched_Qty: 200,
      Promised_Date: '2026-09-10',
      Dispatch_Date: '2026-09-10',
      Delay_Reason: '',
    },
    {
      Dispatch_ID: 'DISP-SAMPLE-02',
      Customer_Name: 'Tier-1 Drivetrain Systems',
      Part_Description: 'Flanged Valve Body 150mm',
      PO_Number: 'PO-2026-889',
      Ordered_Qty: 120,
      Dispatched_Qty: 95,
      Promised_Date: '2026-09-12',
      Dispatch_Date: '2026-09-15',
      Delay_Reason: 'Material Short',
    },
    {
      Dispatch_ID: 'DISP-SAMPLE-1003',
      Customer_Name: 'OEM-CLIENT-03',
      Part_Description: 'CNC Turned Shaft Assembly 40mm',
      PO_Number: 'PO-2026-912',
      Ordered_Qty: 80,
      Dispatched_Qty: 80,
      Promised_Date: '2026-09-16',
      Dispatch_Date: '2026-09-16',
      Delay_Reason: '',
    },
  ];
}

export function buildPilotP3SampleRows(): PilotP3TemplateRow[] {
  return [
    {
      LR_Number: 'LR-SAMPLE-9001',
      Trip_Date: '2026-09-11',
      Lane: 'Chennai -> Hosur OEM Hub',
      Transporter: 'Southern Express Cargo',
      Weight_Ton: 9.5,
      Distance_Km: 310,
      Contract_Rate_INR: 18500,
      Billed_Amount_INR: 21200,
      Detention_INR: 1600,
      Advance_Paid_INR: 10000,
    },
    {
      LR_Number: 'LR-SAMPLE-9002',
      Trip_Date: '2026-09-14',
      Lane: 'Ambattur -> Sriperumbudur Corridor',
      Transporter: 'Prime Industrial Logistics',
      Weight_Ton: 7.2,
      Distance_Km: 42,
      Contract_Rate_INR: 6400,
      Billed_Amount_INR: 6400,
      Detention_INR: 0,
      Advance_Paid_INR: 3000,
    },
    {
      LR_Number: 'LR-SAMPLE-9003',
      Trip_Date: '2026-09-17',
      Lane: 'Chennai -> Coimbatore Auto Cluster',
      Transporter: 'Kongu Heavy Carriers',
      Weight_Ton: 14.0,
      Distance_Km: 505,
      Contract_Rate_INR: 29000,
      Billed_Amount_INR: 31800,
      Detention_INR: 2400,
      Advance_Paid_INR: 15000,
    },
  ];
}

export function buildPilotP4SampleRows(): PilotP4TemplateRow[] {
  return [
    {
      Bin_ID: 'RACK-A-01',
      Part_ID: 'SKU-CAST-001',
      Part_Description: 'Machined Housing Bracket',
      Book_Qty: 48,
      Physical_Count_Qty: 42,
      Unit_Cost_INR: 8500,
    },
    {
      Bin_ID: 'RACK-B-04',
      Part_ID: 'SKU-VLV-005',
      Part_Description: 'SS 304 Ball Valve 1 Inch Industrial',
      Book_Qty: 28,
      Physical_Count_Qty: 28,
      Unit_Cost_INR: 1850,
    },
    {
      Bin_ID: 'RACK-C-09',
      Part_ID: 'SKU-BRG-002',
      Part_Description: 'Heavy Duty Tapered Roller Bearing',
      Book_Qty: 64,
      Physical_Count_Qty: 58,
      Unit_Cost_INR: 1420,
    },
  ];
}

/**
 * Returns the structured rows for the worksheet ("5_ERP_Export_&_Anonymization_Guide")
 * explaining how to export from Tally Prime, SAP, or Busy and which fields can be masked.
 */
export function buildPilotDataKitGuideRows(): PilotDataKitGuideSection[] {
  const rows: PilotDataKitGuideSection[] = [
    {
      Topic: '1. Required 5-Column Schema (P1 Core)',
      Step_Or_Rule: 'Part_ID, Part_Description, Closing_Stock_Qty, Unit_Cost_INR, Last_Movement_Date',
      Practical_Instructions:
        'Provide one row per active SKU/Part. Do not include intermediate subtotal or Grand Total rows. Optional columns: Category, Is_Reserve_Spare.',
      Anonymization_And_Safety_Notes:
        'Prepared for Step 2 Pilot Audit intake reviewed by C. Jones Snowin (joneszz2004@gmail.com).',
    },
    {
      Topic: '2. Exporting from Tally Prime / Tally.ERP 9',
      Step_Or_Rule: 'Gateway of Tally > Stock Summary > Alt+F5 (Detailed) > F12 Configure',
      Practical_Instructions:
        'Enable "Show Closing Balance = Yes", "Show Goods Outwards = Yes", and export via Alt+E to Excel (.xlsx) or CSV. Headers like Stock Item Code, Stock Item Name, Closing Balance, Closing Rate, Last Voucher Date are auto-mapped.',
      Anonymization_And_Safety_Notes:
        'Delete party/vendor ledger columns before saving; only item-level stock balance and last issue date are needed.',
    },
    {
      Topic: '3. Exporting from SAP (B1 / ECC / S4HANA)',
      Step_Or_Rule: 'Transaction MB52 (Warehouse Stock) + MC.9 / MB5B (Last Movement Date)',
      Practical_Instructions:
        'Export MATNR (Material Number), MAKTX (Description), LABST (Unrestricted Stock), VERPR (Moving Avg Price), and BUDAT (Last Movement Date). Auto-mapped by Operationalyst.',
      Anonymization_And_Safety_Notes:
        'Plant codes, vendor codes, purchasing group, and customer account numbers can be omitted completely.',
    },
    {
      Topic: '4. Exporting from Busy / Marg / Zoho / Excel',
      Step_Or_Rule: 'Inventory Summary > Closing Stock Valuation with Last Voucher Date',
      Practical_Instructions:
        'Export Item Code, Item Name, Closing Qty, Valuation Rate (INR), and Last Sale/Consumption Date in YYYY-MM-DD or DD-MMM-YYYY format.',
      Anonymization_And_Safety_Notes:
        'Ensure numeric quantities and unit costs do not contain text notes (e.g., write 120 instead of "120 Nos approx").',
    },
    {
      Topic: '5. Critical Machine / Insurance Spares Exclusion (Item 07)',
      Step_Or_Rule: 'Set Is_Reserve_Spare = TRUE or include CRITICAL SPARE / INSURANCE SPARE in Description',
      Practical_Instructions:
        'Critical breakdown and insurance spares are retained in total book valuation visibility but excluded from Dead-Stock scrap targets under Item 07.',
      Anonymization_And_Safety_Notes:
        'Prevents plant heads from being advised to liquidate essential CNC spindle or hydraulic emergency spares.',
    },
    {
      Topic: '6. Pre-Upload Browser Anonymization & 14-Day Purge Policy',
      Step_Or_Rule: '1-Click In-Browser Masking + Isolated Analytical Session',
      Practical_Instructions:
        'Use the Step-2 Upload Portal toggle to rewrite Part_Description -> MASKED-PART-001, Customer_Name -> MASKED-OEM-01, and Transporter -> CARRIER-01 before upload.',
      Anonymization_And_Safety_Notes:
        'Files are never used to train external AI models and are purged within 14 days (or within 24 hours upon emailing joneszz2004@gmail.com).',
    },
  ];

  return rows.map((r) => ({
    Topic: String(sanitizeSpreadsheetCell(r.Topic)),
    Step_Or_Rule: String(sanitizeSpreadsheetCell(r.Step_Or_Rule)),
    Practical_Instructions: String(sanitizeSpreadsheetCell(r.Practical_Instructions)),
    Anonymization_And_Safety_Notes: String(
      sanitizeSpreadsheetCell(r.Anonymization_And_Safety_Notes)
    ),
  }));
}

/**
 * Builds the complete 5-sheet structured dataset for programmatic inspection and Excel export.
 */
export function buildFiveSheetPilotDataKitDataset() {
  return {
    '1_P1_Inventory_Template': buildPilotDataKitSampleRows(),
    '2_P2_OTIF_Template': buildPilotP2SampleRows(),
    '3_P3_Freight_Template': buildPilotP3SampleRows(),
    '4_P4_Warehouse_Bin_Template': buildPilotP4SampleRows(),
    '5_ERP_Export_&_Anonymization_Guide': buildPilotDataKitGuideRows(),
  };
}

/**
 * Generates the CSV string for the 5-Column Inventory Audit Template with 5 illustrative sample rows.
 */
export function buildPilotDataKitCsvContent(): string {
  const headers = PILOT_DATA_KIT_COLUMNS.map((col) => toSafeCsvCell(col)).join(',');
  const sampleRows = buildPilotDataKitSampleRows().map((row) =>
    [
      toSafeCsvCell(row.Part_ID),
      toSafeCsvCell(row.Part_Description),
      toSafeCsvCell(row.Closing_Stock_Qty),
      toSafeCsvCell(row.Unit_Cost_INR),
      toSafeCsvCell(row.Last_Movement_Date),
    ].join(',')
  );
  return [headers, ...sampleRows].join('\n') + '\n';
}

/**
 * Builds CSV content for quarantined rows with an explicit Error_Reasons column for shop-floor remediation.
 */
export function buildQuarantinedRowsCsvContent(
  quarantinedRows: QuarantinedRowRecord[],
  pillarName: string = 'P1_Inventory'
): string {
  if (!Array.isArray(quarantinedRows) || quarantinedRows.length === 0) {
    return `"Row_Number","Pillar","Error_Reasons"\n`;
  }

  const extraColsSet = new Set<string>();
  for (const q of quarantinedRows) {
    if (q.rawRow && typeof q.rawRow === 'object') {
      for (const k of Object.keys(q.rawRow)) {
        extraColsSet.add(k);
      }
    }
  }
  const extraCols = Array.from(extraColsSet);
  const headers = ['Row_Number', 'Pillar', 'Error_Reasons', ...extraCols];

  const lines = [headers.map((h) => toSafeCsvCell(h)).join(',')];
  for (const q of quarantinedRows) {
    const cells = [
      toSafeCsvCell(q.rowNumber),
      toSafeCsvCell(pillarName),
      toSafeCsvCell(q.errorSummary),
      ...extraCols.map((col) => {
        const val = q.rawRow?.[col];
        return toSafeCsvCell(
          val === undefined || val === null ? '' : (val as string | number | boolean)
        );
      }),
    ];
    lines.push(cells.join(','));
  }

  return lines.join('\n') + '\n';
}

/**
 * Triggers a browser download of quarantined rows with their exact Error_Reasons column.
 */
export function downloadQuarantinedRowsCsv(
  quarantinedRows: QuarantinedRowRecord[],
  pillarName: string = 'P1_Inventory'
): void {
  const csv = buildQuarantinedRowsCsvContent(quarantinedRows, pillarName);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safePillar = pillarName.replace(/[^A-Za-z0-9_-]/g, '_');
  link.setAttribute(
    'download',
    `Operationalyst_Quarantined_Rejects_${safePillar}_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a pre-formatted "Step 2: Suitability Approved & Data Guide" email/WhatsApp reply for a lead.
 */
export function buildStep2SuitabilityReplyTemplate(params: {
  leadId?: string;
  fullName?: string;
  companyName?: string;
  plantLocation?: string;
  erpSystem?: string;
  uploadPortalUrl?: string;
}): string {
  const name = params.fullName?.trim() || 'Team';
  const company = params.companyName?.trim() || 'your manufacturing unit';
  const location = params.plantLocation?.trim() ? ` (${params.plantLocation.trim()})` : '';
  const leadRef = params.leadId?.trim() || 'PILOT-AUDIT';
  const erp = params.erpSystem?.trim() || 'your ERP / Stock Register';
  const portalLine = params.uploadPortalUrl?.trim()
    ? `\nDirect Token-Gated Step-2 Upload Portal: ${params.uploadPortalUrl.trim()}\n`
    : '';

  return [
    `Subject: Step 2 Suitability Approved & 5-Column Data Guide [${leadRef}] — ${company}`,
    ``,
    `Hello ${name},`,
    ``,
    `Thank you for requesting a Pilot Factory Inventory Audit for ${company}${location}. I have completed the Step 1 suitability review (Ref: ${leadRef}).`,
    ``,
    `To prepare your Executive Findings Summary and 30-minute walkthrough, we only require a 5-column export from ${erp}:`,
    `1. Part_ID (Anonymized codes such as SKU-001 are welcome)`,
    `2. Part_Description (Vendor/customer names can be omitted or masked in-browser)`,
    `3. Closing_Stock_Qty (Numeric quantity on hand)`,
    `4. Unit_Cost_INR (Standard unit rate / valuation in INR)`,
    `5. Last_Movement_Date (YYYY-MM-DD or DD-MMM-YYYY of last issue/consumption)`,
    portalLine,
    `Please upload via your Step-2 Portal link or reply with your 5-column .XLSX / .CSV export (or let me know if you would like our mutual NDA counter-signed first).`,
    ``,
    `Warm regards,`,
    `C. Jones Snowin`,
    `Founder, Operationalyst`,
    `joneszz2004@gmail.com | linkedin.com/in/c-jones-snowin`,
  ].join('\n');
}

export interface FounderFollowUpScripts {
  whatsapp15MinScript: string;
  email15MinSubject: string;
  email15MinBody: string;
  nudge48HourScript: string;
}

/**
 * Phase 10: Generates pre-filled 15-minute WhatsApp, 15-minute Email, and 48-hour Nudge scripts
 * interpolating the lead's Name, Company Name, and ERP system (Tally / SAP / Excel).
 */
export function buildFounderFollowUpScripts(params: {
  leadId?: string;
  fullName?: string;
  companyName?: string;
  plantLocation?: string;
  erpSystem?: string;
  uploadPortalUrl?: string;
}): FounderFollowUpScripts {
  const name = params.fullName?.trim() || 'Team';
  const company = params.companyName?.trim() || 'your plant';
  const erp = params.erpSystem?.trim() || 'Tally / SAP / Excel';
  const leadRef = params.leadId?.trim() || 'PILOT-AUDIT';
  const portalLine = params.uploadPortalUrl?.trim()
    ? `\nSecure Step-2 Upload Link: ${params.uploadPortalUrl.trim()}`
    : '';

  const whatsapp15MinScript = [
    `Hi ${name}, this is C. Jones Snowin (Founder, Operationalyst).`,
    `Saw your 48-Hour Pilot Audit request for ${company} (${leadRef}).`,
    `The 5-column template (Operationalyst_5_Column_Audit_Template.csv) has been downloaded to your system. Whenever your stores team pulls the ${erp} stock summary (Part_ID, Part_Description, Closing_Stock_Qty, Unit_Cost_INR, Last_Movement_Date), you can strip vendor/customer names and reply here or upload directly.${portalLine}`,
    `I will personally turn around your ranked non-moving SKU & carrying-cost report within 48 hours.`,
  ].join('\n\n');

  const email15MinSubject = `48-Hour Inventory Audit Intake (${leadRef}) — ${company} [${erp}]`;

  const email15MinBody = [
    `Subject: ${email15MinSubject}`,
    ``,
    `Hi ${name},`,
    ``,
    `Thank you for requesting the 48-Hour Factory Inventory Audit for ${company} (Ref: ${leadRef}).`,
    ``,
    `Your 5-column template (Operationalyst_5_Column_Audit_Template.csv) is ready. To run your diagnostic from ${erp}, we only need 5 columns:`,
    `• Part_ID (SKU or item code)`,
    `• Part_Description (Vendor and customer names stripped)`,
    `• Closing_Stock_Qty`,
    `• Unit_Cost_INR`,
    `• Last_Movement_Date`,
    portalLine,
    `Reply to this email with your ${erp} export (.CSV or .XLSX) or upload via the link above. Your data is reviewed strictly by me and purged within 14 days with a cryptographic Deletion Certificate (DELCERT-...).`,
    ``,
    `Best regards,`,
    `C. Jones Snowin`,
    `Founder, Operationalyst`,
    `Direct Founder Desk: joneszz2004@gmail.com`,
  ].join('\n');

  const nudge48HourScript = [
    `Hi ${name}, quick follow-up from C. Jones Snowin regarding the ${company} inventory audit.`,
    `If exporting the full plant ledger from ${erp} takes time, you can start by sending just a single category (e.g., Top 200 Raw Material or Spares SKUs).`,
    `Even a partial 5-column ${erp} export is enough to isolate your top non-moving SKUs and annual carrying-cost burn in 48 hours.${portalLine}`,
  ].join('\n\n');

  return {
    whatsapp15MinScript,
    email15MinSubject,
    email15MinBody,
    nudge48HourScript,
  };
}

/**
 * Phase 10: Builds the Express 5-Column CSV Template containing the 5 canonical headers
 * and the two canonical floor sample rows (PRG-4402-SS and BRG-6205-ZZ).
 */
export function buildExpress5ColumnAuditTemplateCsvContent(): string {
  const lines = [
    'Part_ID,Part_Description,Closing_Stock_Qty,Unit_Cost_INR,Last_Movement_Date',
    'PRG-4402-SS,CNC Machined Flange Housing,420,1850,2024-05-14',
    'BRG-6205-ZZ,Sealed Spindle Bearing Assembly,85,640,2025-01-19',
  ];
  return lines.join('\n') + '\n';
}

/**
 * Phase 10: Reusable helper that generates and downloads Operationalyst_5_Column_Audit_Template.csv
 * containing the 5 canonical headers and 2 sample rows (PRG-4402-SS and BRG-6205-ZZ),
 * and logs 'DATA_KIT_DOWNLOADED' to /api/analytics/event.
 */
export function downloadAuditTemplate(
  sourceSection: string = 'audit_template_download',
  filename: string = 'Operationalyst_5_Column_Audit_Template.csv'
): string {
  const csvContent = buildExpress5ColumnAuditTemplateCsvContent();
  try {
    trackServerFunnelEvent('DATA_KIT_DOWNLOADED', { sourceSection });
  } catch {
    // Ignore telemetry error in offline/test contexts
  }

  if (typeof document !== 'undefined' && typeof Blob !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return csvContent;
}

/**
 * Triggers a browser download of the 5-Column Blank/Sample CSV Template.
 */
export function downloadPilotDataKitCsv(
  filename: string = 'Operationalyst_5_Column_Audit_Template.csv'
): void {
  const csv = buildPilotDataKitCsvContent();
  if (typeof document !== 'undefined' && typeof Blob !== 'undefined') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Triggers a browser download of the 5-sheet .XLSX Pilot Audit Data Kit:
 * - Sheet 1: "1_P1_Inventory_Template"
 * - Sheet 2: "2_P2_OTIF_Template"
 * - Sheet 3: "3_P3_Freight_Template"
 * - Sheet 4: "4_P4_Warehouse_Bin_Template"
 * - Sheet 5: "5_ERP_Export_&_Anonymization" (Excel 31-char tab limit safe)
 */
export function downloadPilotDataKitXlsx(
  filename: string = 'Operationalyst_4_Pillar_Pilot_Data_Kit.xlsx'
): void {
  const wb = XLSX.utils.book_new();
  const kit = buildFiveSheetPilotDataKitDataset();

  const wsP1 = XLSX.utils.json_to_sheet(kit['1_P1_Inventory_Template']);
  wsP1['!cols'] = [
    { wch: 38 },
    { wch: 56 },
    { wch: 20 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsP1, '1_P1_Inventory_Template');

  const wsP2 = XLSX.utils.json_to_sheet(kit['2_P2_OTIF_Template']);
  wsP2['!cols'] = [
    { wch: 20 },
    { wch: 30 },
    { wch: 34 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsP2, '2_P2_OTIF_Template');

  const wsP3 = XLSX.utils.json_to_sheet(kit['3_P3_Freight_Template']);
  wsP3['!cols'] = [
    { wch: 20 },
    { wch: 16 },
    { wch: 32 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsP3, '3_P3_Freight_Template');

  const wsP4 = XLSX.utils.json_to_sheet(kit['4_P4_Warehouse_Bin_Template']);
  wsP4['!cols'] = [
    { wch: 18 },
    { wch: 22 },
    { wch: 36 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsP4, '4_P4_Warehouse_Bin_Template');

  const wsGuide = XLSX.utils.json_to_sheet(kit['5_ERP_Export_&_Anonymization_Guide'], {
    header: [
      'Topic',
      'Step_Or_Rule',
      'Practical_Instructions',
      'Anonymization_And_Safety_Notes',
    ],
  });
  wsGuide['!cols'] = [
    { wch: 36 },
    { wch: 48 },
    { wch: 64 },
    { wch: 64 },
  ];
  // Excel tab names are capped at 31 characters by SheetJS
  XLSX.utils.book_append_sheet(wb, wsGuide, '5_ERP_Export_&_Anonymization');

  XLSX.writeFile(wb, filename);
}
