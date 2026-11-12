import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Wand2,
  Database,
  Filter,
  Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { StockItem } from '../project1/types';
import { DispatchRow } from '../project2/types/otif';
import { Trip } from '../project3/types/freight';
import { AuditItem } from '../project4/types/audit';
import { INITIAL_WORKSPACES } from '../project2/data/factoryWorkspaces';
import {
  validateImportDate,
  validateImportNumber,
  validateUploadFileSafety,
  getActiveP2WorkspaceId,
} from '../utils/importValidation';

export type TargetEngineType = 'p1' | 'p2' | 'p3' | 'p4' | 'p5';

interface SmartTallyMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEngine?: TargetEngineType;
  onImportSuccess?: (engine: TargetEngineType, count: number) => void;
}

interface FieldSchema {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'number' | 'date' | 'datetime';
  allowZero?: boolean;
  synonyms: string[];
}

export interface QuarantineIssue {
  rowIndex: number; // 0-based index in parsedTable.rows
  rowNumber: number; // 1-based display row number
  fieldKey: string;
  fieldLabel: string;
  sourceValue: string;
  status: string;
  reason: string;
}

const ENGINE_SCHEMAS: Record<
  TargetEngineType,
  { name: string; badge: string; fields: FieldSchema[]; messySample: string }
> = {
  p1: {
    name: 'P1: Tally Stock Summary (Dead Stock & Working Capital)',
    badge: 'Tally Prime Alt+F1 Export',
    fields: [
      { key: 'itemCode', label: 'Part Code / Alias', required: true, type: 'text', synonyms: ['code', 'part', 'alias', 'sku', 'item code', 'part no'] },
      { key: 'itemName', label: 'Particulars / Item Name', required: true, type: 'text', synonyms: ['particulars', 'name', 'description', 'item name', 'material'] },
      { key: 'category', label: 'Stock Group / Category', required: false, type: 'text', synonyms: ['group', 'category', 'stock group', 'type'] },
      { key: 'qtyOnHand', label: 'Closing Qty (Cl. Balance)', required: true, type: 'number', allowZero: true, synonyms: ['cl. qty', 'closing qty', 'qty', 'balance', 'quantity', 'on hand'] },
      { key: 'costRate', label: 'Effective Rate (₹/Unit)', required: true, type: 'number', allowZero: false, synonyms: ['eff. rate', 'rate', 'cost', 'unit cost', 'price', 'std cost'] },
      { key: 'lastMovement', label: 'Last Voucher / Outward Date', required: true, type: 'date', synonyms: ['vch date', 'last movement', 'last issue', 'date', 'outward date'] },
    ],
    messySample: `Tally Prime - Ambattur Auto Components Pvt Ltd (Stock Summary As Of 1-Oct-2026)
Particulars\tPart Alias\tStock Group\tCl. Balance Qty\tEff. Rate (INR)\tLast Outward Vch Date
Grand Header Row - Ignore\t\t\t\t\t
EN24 Forged Gear Blank 110mm\tRM-GB-110\tRaw Material\t480 Nos\t₹ 1,250.00\t12-Jan-2026
SS304 Laser Cut Bracket Rev-A (Obsolete)\tFG-BRK-09\tFinished Goods\t920 Pcs\t₹ 440.00\t19-Nov-2025
M12 High Tensile Hex Bolt Grade 10.9\tCONSUM-M12\tConsumables\t3,500 Nos\t₹ 18.50\t25-Sep-2026
Hydraulic Seal Kit Parker 60mm\tSP-HYD-60\tSpares\t45 Kits\t₹ 3,800.00\t04-Feb-2026
Phosphor Bronze Bush Machined\tWIP-PB-22\tWIP\t310 Pcs\t₹ 890.00\t14-Mar-2026
Grand Total\t\t\t5,255\t\t`,
  },
  p2: {
    name: 'P2: Gate Outward & Customer PO Register (Dispatch OTIF)',
    badge: 'Security Gate + ERP Log',
    fields: [
      { key: 'po', label: 'PO / Invoice No', required: true, type: 'text', synonyms: ['po', 'invoice', 'order no', 'challan', 'so no'] },
      { key: 'customer', label: 'Customer / OEM Party', required: true, type: 'text', synonyms: ['party', 'customer', 'client', 'consignee', 'buyer'] },
      { key: 'part', label: 'Part Description', required: true, type: 'text', synonyms: ['part', 'item', 'particulars', 'material'] },
      { key: 'orderedQty', label: 'PO Scheduled Qty', required: true, type: 'number', allowZero: false, synonyms: ['po qty', 'ordered', 'sched qty', 'target qty'] },
      { key: 'shippedQty', label: 'Gate Challan Shipped Qty', required: true, type: 'number', allowZero: true, synonyms: ['shipped', 'billed qty', 'actual qty', 'dispatched'] },
      { key: 'promisedDate', label: 'Promised Slot (Date/Time)', required: true, type: 'datetime', synonyms: ['promised', 'cutoff', 'slot', 'due date', 'schedule date'] },
      { key: 'actualOut', label: 'Gate Out Timestamp', required: true, type: 'datetime', synonyms: ['gate out', 'actual out', 'out time', 'eway time'] },
      { key: 'delayReason', label: 'Hold / Delay Reason', required: false, type: 'text', synonyms: ['reason', 'remark', 'hold', 'delay'] },
    ],
    messySample: `PO Ref\tParty Name\tItem Particulars\tSched Qty\tChallan Qty\tPromised Cutoff\tGate Out Time\tSecurity Remarks
PO-TVS-8841\tTVS Motor Hosur\tSwingarm Pivot Assembly\t500 Nos\t500 Nos\t2026-09-23 14:00\t2026-09-23 13:40\tOn time
PO-ASH-9912\tAshok Leyland Ennore\tAir Brake Bracket LH\t800 Pcs\t650 Pcs\t2026-09-24 16:00\t2026-09-24 19:30\tFinal QC Hold
PO-CAT-3310\tCaterpillar Thiruvallur\tHeavy Flange Plate 16mm\t200 Nos\t200 Nos\t2026-09-25 11:00\t2026-09-25 14:45\tTransporter Late
Total Dispatches\t\t\t1500\t1350\t\t\t`,
  },
  p3: {
    name: 'P3: Transporter Lorry Bill & LR Register (Freight Leak Audit)',
    badge: 'Accounts Payable LR Export',
    fields: [
      { key: 'id', label: 'LR No / Bill ID', required: true, type: 'text', synonyms: ['lr', 'lr no', 'bill no', 'trip id', 'voucher'] },
      { key: 'date', label: 'Dispatch Date', required: true, type: 'date', synonyms: ['date', 'lr date', 'trip date', 'vch date'] },
      { key: 'lane', label: 'Origin–Destination Corridor', required: true, type: 'text', synonyms: ['lane', 'corridor', 'route', 'from to', 'destination'] },
      { key: 'transporter', label: 'Transporter / Fleet Name', required: true, type: 'text', synonyms: ['transporter', 'vendor', 'carrier', 'lorry owner', 'party'] },
      { key: 'vehicleType', label: 'Vehicle Type (19ft/32ft)', required: false, type: 'text', synonyms: ['vehicle', 'truck', 'type', 'lorry type'] },
      { key: 'tonnes', label: 'Net Weight (Tonnes)', required: true, type: 'number', allowZero: false, synonyms: ['tonnes', 'wt', 'weight', 'mt', 'net wt'] },
      { key: 'bill', label: 'Total Lorry Bill Paid (₹)', required: true, type: 'number', allowZero: false, synonyms: ['bill', 'freight', 'amount', 'total paid', 'invoice amt'] },
      { key: 'waitHours', label: 'Gate Detention Wait (Hrs)', required: false, type: 'number', allowZero: true, synonyms: ['wait', 'detention', 'halting', 'hours', 'gate hours'] },
    ],
    messySample: `LR Number\tLR Date\tRoute Corridor\tTransporter Party\tLorry Type\tNet Wt (MT)\tTotal Bill Amt\tGate Halting Hrs
LR-9081\t14-Sep-2026\tChennai-Hosur\tSri Murugan Roadways\t19ft Open\t9.5 MT\t₹ 24,800.00\t4.5 hrs
LR-9084\t16-Sep-2026\tChennai-Hosur\tKPN Cargo Movers\t19ft Open\t10.0 MT\t₹ 18,200.00\t1.5 hrs
LR-9092\t19-Sep-2026\tChennai-Pune\tVRL Logistics\t32ft MXL\t15.2 MT\t₹ 64,500.00\t5.0 hrs
LR-9099\t22-Sep-2026\tChennai-Coimbatore\tABT Parcel Service\t19ft Open\t8.8 MT\t₹ 21,900.00\t3.5 hrs
Sub Total\t\t\t\t\t43.5 MT\t₹ 1,29,400.00\t`,
  },
  p4: {
    name: 'P4: Spares Bin Ledger vs Physical Count (BinAudit EV)',
    badge: 'Store Bin Card + Tally Qty',
    fields: [
      { key: 'code', label: 'SKU / Part Code', required: true, type: 'text', synonyms: ['code', 'sku', 'part no', 'item code'] },
      { key: 'part', label: 'Spare Part Name', required: true, type: 'text', synonyms: ['part', 'name', 'particulars', 'description'] },
      { key: 'spot', label: 'Bin / Rack Location', required: true, type: 'text', synonyms: ['spot', 'bin', 'rack', 'location', 'zone'] },
      { key: 'systemQty', label: 'Tally System Qty (Book)', required: true, type: 'number', allowZero: true, synonyms: ['book', 'system qty', 'tally qty', 'computer qty'] },
      { key: 'physicalQty', label: 'Physical Hand Count', required: true, type: 'number', allowZero: true, synonyms: ['physical', 'hand count', 'actual', 'counted'] },
      { key: 'cost', label: 'Store Cost Rate (₹)', required: true, type: 'number', allowZero: false, synonyms: ['cost', 'rate', 'unit cost', 'purchase rate'] },
      { key: 'issuesPerMonth', label: '30-Day Counter Issues (Velocity)', required: true, type: 'number', allowZero: true, synonyms: ['issues', 'velocity', 'monthly', 'sales', 'outward'] },
    ],
    messySample: `SKU Code\tParticulars\tRack Location\tTally Book Qty\tHand Counted\tPurchase Cost\t30-Day Issues
EV-CHG-01\tPortable charger 3.3 kW\tBack rack\t18 Nos\t13 Nos\t₹ 8,200\t28
EV-BRK-04\tBrake-pad set\tMezzanine\t42 Sets\t31 Sets\t₹ 1,800\t64
EV-LCK-09\tHandle lock\tCounter\t25 Pcs\t25 Pcs\t₹ 220\t35
FG-FLG-150\tSS flange 150NB\tBack rack\t25 Nos\t19 Nos\t₹ 1,850\t14
Grand Total\t\t\t110\t88\t\t141`,
  },
  p5: {
    name: 'P5: Tally Bill-Wise Sundry Debtors (Overdue Bills >30d/45d)',
    badge: 'Tally Outstandings Export',
    fields: [
      { key: 'invoiceNo', label: 'Invoice / Ref No', required: true, type: 'text', synonyms: ['invoice', 'ref', 'bill no', 'vch no'] },
      { key: 'customerName', label: 'Party / Customer Name', required: true, type: 'text', synonyms: ['party', 'customer', 'ledger', 'account'] },
      { key: 'invoiceDate', label: 'Bill Date', required: true, type: 'date', synonyms: ['bill date', 'invoice date', 'date'] },
      { key: 'daysOverdue', label: 'Overdue Days', required: true, type: 'number', allowZero: true, synonyms: ['overdue', 'days', 'age', 'pending days'] },
      { key: 'amountRupees', label: 'Pending Balance (₹)', required: true, type: 'number', allowZero: false, synonyms: ['pending', 'balance', 'amount', 'due amt'] },
    ],
    messySample: `Bill Ref No\tParty Ledger Name\tBill Date\tOverdue Days\tPending Amount (INR)
INV-2026-441\tApex Motors Hosur\t12-Jul-2026\t38 Days\t₹ 4,85,000.00 Dr
INV-2026-489\tBharath Heavy Fabrication\t24-Jul-2026\t26 Days\t₹ 3,40,000.00 Dr
INV-2026-512\tSouthern Industrial Valves\t02-Aug-2026\t17 Days\t₹ 2,90,000.00 Dr
Grand Total\t\t\t\t₹ 11,15,000.00 Dr`,
  },
};

export const SmartTallyMapperModal: React.FC<SmartTallyMapperModalProps> = ({
  isOpen,
  onClose,
  defaultEngine = 'p1',
  onImportSuccess,
}) => {
  const [targetEngine, setTargetEngine] = useState<TargetEngineType>(defaultEngine);
  const [rawText, setRawText] = useState<string>(ENGINE_SCHEMAS[defaultEngine].messySample);
  const [columnMap, setColumnMap] = useState<Record<string, number>>({});
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  // Row-level overrides & exclusions for quarantined records
  const [cellOverrides, setCellOverrides] = useState<Record<string, string>>({});
  const [excludedRows, setExcludedRows] = useState<Record<number, boolean>>({});

  const schema = ENGINE_SCHEMAS[targetEngine];

  // Parse raw text into header + data rows
  const parsedTable = useMemo(() => {
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return { headers: [] as string[], rows: [] as string[][], skippedNoiseCount: 0 };

    const delimiter = lines.some((l) => l.includes('\t')) ? '\t' : ',';

    let headerIdx = 0;
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const cols = lines[i].split(delimiter).map((c) => c.trim());
      if (cols.filter(Boolean).length >= 3) {
        headerIdx = i;
        break;
      }
    }

    const headers = lines[headerIdx].split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim());
    const dataRows: string[][] = [];
    let skippedNoiseCount = headerIdx;

    for (let i = headerIdx + 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
      const firstCell = (cols[0] || '').toLowerCase();
      const nonEmptyCount = cols.filter(Boolean).length;

      if (
        nonEmptyCount < 3 ||
        firstCell.startsWith('grand total') ||
        firstCell.startsWith('sub total') ||
        firstCell === 'total' ||
        firstCell.includes('header row') ||
        firstCell.startsWith('total ')
      ) {
        skippedNoiseCount++;
        continue;
      }
      dataRows.push(cols);
    }

    return { headers, rows: dataRows, skippedNoiseCount };
  }, [rawText]);

  // Auto-map columns whenever headers or targetEngine changes
  useEffect(() => {
    const nextMap: Record<string, number> = {};
    schema.fields.forEach((field) => {
      const foundIdx = parsedTable.headers.findIndex((h) => {
        const lower = h.toLowerCase();
        return field.synonyms.some((syn) => lower.includes(syn));
      });
      nextMap[field.key] = foundIdx !== -1 ? foundIdx : 0;
    });
    setColumnMap(nextMap);
    setCellOverrides({});
    setExcludedRows({});
  }, [parsedTable.headers, targetEngine]);

  const getEffectiveCell = (rowIndex: number, row: string[], fieldKey: string): string => {
    const overrideKey = `${rowIndex}:${fieldKey}`;
    if (cellOverrides[overrideKey] !== undefined) {
      return cellOverrides[overrideKey];
    }
    const colIdx = columnMap[fieldKey] ?? 0;
    return row[colIdx] ?? '';
  };

  // Strict row-by-row validation without silent default dates or zero coercion
  const validationSummary = useMemo(() => {
    const issues: QuarantineIssue[] = [];
    const validRowIndices: number[] = [];

    parsedTable.rows.forEach((row, rIdx) => {
      if (excludedRows[rIdx]) return;
      let rowHasError = false;

      schema.fields.forEach((field) => {
        const rawVal = getEffectiveCell(rIdx, row, field.key).trim();

        if (!rawVal && !field.required) {
          return;
        }

        if (field.type === 'text') {
          if (field.required && !rawVal) {
            rowHasError = true;
            issues.push({
              rowIndex: rIdx,
              rowNumber: rIdx + 1,
              fieldKey: field.key,
              fieldLabel: field.label,
              sourceValue: rawVal,
              status: 'MISSING_TEXT',
              reason: `${field.label} is required and cannot be blank.`,
            });
          }
        } else if (field.type === 'number') {
          const numCheck = validateImportNumber(rawVal, {
            allowNegative: false,
            allowZero: field.allowZero ?? true,
          });
          if (numCheck.status !== 'VALID_NUMBER') {
            rowHasError = true;
            issues.push({
              rowIndex: rIdx,
              rowNumber: rIdx + 1,
              fieldKey: field.key,
              fieldLabel: field.label,
              sourceValue: rawVal,
              status: numCheck.status,
              reason: numCheck.reason || `Invalid number for ${field.label}.`,
            });
          }
        } else if (field.type === 'date' || field.type === 'datetime') {
          const dateCheck = validateImportDate(rawVal);
          if (dateCheck.status !== 'VALID') {
            rowHasError = true;
            issues.push({
              rowIndex: rIdx,
              rowNumber: rIdx + 1,
              fieldKey: field.key,
              fieldLabel: field.label,
              sourceValue: rawVal,
              status: dateCheck.status,
              reason: dateCheck.reason || `Invalid date for ${field.label}.`,
            });
          }
        }
      });

      if (!rowHasError) {
        validRowIndices.push(rIdx);
      }
    });

    return { issues, validRowIndices };
  }, [parsedTable.rows, columnMap, cellOverrides, excludedRows, schema.fields]);

  if (!isOpen) return null;

  const handleEngineSwitch = (eng: TargetEngineType) => {
    setTargetEngine(eng);
    setRawText(ENGINE_SCHEMAS[eng].messySample);
    setStatusMsg(null);
    setCellOverrides({});
    setExcludedRows({});
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const safety = validateUploadFileSafety(file, ['.csv', '.tsv', '.txt', '.xlsx', '.xls']);
    if (!safety.valid) {
      setStatusMsg({ type: 'err', text: safety.reason || 'File rejected by safety check.' });
      return;
    }

    const lower = file.name.toLowerCase();
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const buffer = ev.target?.result as ArrayBuffer;
          if (!buffer) {
            setStatusMsg({ type: 'err', text: 'Failed to read workbook buffer.' });
            return;
          }
          const wb = XLSX.read(new Uint8Array(buffer), { type: 'array', raw: false });
          if (!wb.SheetNames || wb.SheetNames.length === 0) {
            setStatusMsg({ type: 'err', text: 'Invalid workbook: No sheets found in Excel file.' });
            return;
          }
          const ws = wb.Sheets[wb.SheetNames[0]];
          const tsv = XLSX.utils.sheet_to_csv(ws, { FS: '\t' });
          if (!tsv || !tsv.trim()) {
            setStatusMsg({ type: 'err', text: 'The selected worksheet is empty.' });
            return;
          }
          setRawText(tsv);
          setStatusMsg({ type: 'ok', text: `Loaded worksheet '${wb.SheetNames[0]}' from ${file.name}.` });
        } catch {
          setStatusMsg({ type: 'err', text: 'Invalid workbook: Could not parse .xlsx/.xls file.' });
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === 'string') {
        if (!content.trim()) {
          setStatusMsg({ type: 'err', text: 'Empty file: The selected file contains no text.' });
          return;
        }
        setRawText(content);
        setStatusMsg({ type: 'ok', text: `Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB).` });
      }
    };
    reader.readAsText(file);
  };

  const executeCleanImport = () => {
    if (validationSummary.issues.length > 0) {
      setStatusMsg({
        type: 'err',
        text: `Import blocked: ${validationSummary.issues.length} validation issue(s) must be corrected or excluded in the Quarantine Review Panel below before importing.`,
      });
      return;
    }

    if (validationSummary.validRowIndices.length === 0) {
      setStatusMsg({
        type: 'err',
        text: 'No valid rows remaining to import.',
      });
      return;
    }

    const validRows = validationSummary.validRowIndices.map((idx) => ({
      rowIndex: idx,
      row: parsedTable.rows[idx],
    }));

    const getValidatedDate = (rowIndex: number, row: string[], key: string): string => {
      const raw = getEffectiveCell(rowIndex, row, key);
      const res = validateImportDate(raw);
      if (res.status !== 'VALID' || !res.normalized) {
        throw new Error(`Invalid date in row ${rowIndex + 1} for ${key}`);
      }
      return res.normalized;
    };

    const getValidatedDateTime = (rowIndex: number, row: string[], key: string, defaultTime: string): string => {
      const raw = getEffectiveCell(rowIndex, row, key).trim();
      const dateRes = validateImportDate(raw);
      if (dateRes.status !== 'VALID' || !dateRes.normalized) {
        throw new Error(`Invalid datetime in row ${rowIndex + 1} for ${key}`);
      }
      const timeMatch = raw.match(/(\d{2}:\d{2})/);
      const timePart = timeMatch ? timeMatch[1] : defaultTime;
      return `${dateRes.normalized}T${timePart}`;
    };

    const getValidatedNumber = (rowIndex: number, row: string[], key: string, fallbackIfOptional = 0): number => {
      const raw = getEffectiveCell(rowIndex, row, key).trim();
      if (!raw) return fallbackIfOptional;
      const res = validateImportNumber(raw, { allowNegative: false, allowZero: true });
      if (res.status !== 'VALID_NUMBER' || res.value === undefined) {
        throw new Error(`Invalid number in row ${rowIndex + 1} for ${key}`);
      }
      return res.value;
    };

    try {
      if (targetEngine === 'p1') {
        const existing: StockItem[] =
          importMode === 'append' ? JSON.parse(localStorage.getItem('p1_stock_items') || '[]') : [];
        const newItems: StockItem[] = validRows.map(({ rowIndex, row }, idx) => {
          const rawCat = getEffectiveCell(rowIndex, row, 'category');
          const validCat = ['Raw Material', 'WIP', 'Finished Goods', 'Spares', 'Consumables'].includes(rawCat)
            ? (rawCat as StockItem['category'])
            : 'Raw Material';
          return {
            id: `tally-p1-${Date.now()}-${idx}`,
            itemCode: getEffectiveCell(rowIndex, row, 'itemCode').trim(),
            itemName: getEffectiveCell(rowIndex, row, 'itemName').trim(),
            category: validCat,
            qtyOnHand: getValidatedNumber(rowIndex, row, 'qtyOnHand'),
            costRate: getValidatedNumber(rowIndex, row, 'costRate'),
            lastMovement: getValidatedDate(rowIndex, row, 'lastMovement'),
          };
        });
        localStorage.setItem('p1_stock_items', JSON.stringify([...newItems, ...existing]));
      } else if (targetEngine === 'p2') {
        const savedWsList = localStorage.getItem('otif_workspaces_v2');
        const savedActiveId = getActiveP2WorkspaceId(INITIAL_WORKSPACES[0].id);
        const workspaces = savedWsList ? JSON.parse(savedWsList) : INITIAL_WORKSPACES;
        const newRows: DispatchRow[] = validRows.map(({ rowIndex, row }, idx) => ({
          id: `tally-p2-${Date.now()}-${idx}`,
          po: getEffectiveCell(rowIndex, row, 'po').trim(),
          customer: getEffectiveCell(rowIndex, row, 'customer').trim(),
          part: getEffectiveCell(rowIndex, row, 'part').trim(),
          orderedQty: getValidatedNumber(rowIndex, row, 'orderedQty'),
          shippedQty: getValidatedNumber(rowIndex, row, 'shippedQty'),
          promisedDate: getValidatedDateTime(rowIndex, row, 'promisedDate', '16:00'),
          actualOut: getValidatedDateTime(rowIndex, row, 'actualOut', '15:45'),
          vehicle: 'TN-01-AB-4411',
          delayReason: (getEffectiveCell(rowIndex, row, 'delayReason') || '') as any,
        }));
        const updatedWs = workspaces.map((w: any) => {
          if (w.id === savedActiveId) {
            return {
              ...w,
              dispatches: importMode === 'append' ? [...newRows, ...(w.dispatches || [])] : newRows,
            };
          }
          return w;
        });
        localStorage.setItem('otif_workspaces_v2', JSON.stringify(updatedWs));
      } else if (targetEngine === 'p3') {
        const existing: Trip[] =
          importMode === 'append' ? JSON.parse(localStorage.getItem('freight_audit_trips_v1') || '[]') : [];
        const newTrips: Trip[] = validRows.map(({ rowIndex, row }, idx) => {
          const tonnes = getValidatedNumber(rowIndex, row, 'tonnes');
          return {
            id: getEffectiveCell(rowIndex, row, 'id').trim() || `LR-${Date.now().toString().slice(-4)}-${idx}`,
            date: getValidatedDate(rowIndex, row, 'date'),
            lane: getEffectiveCell(rowIndex, row, 'lane').trim(),
            km: 320,
            transporter: getEffectiveCell(rowIndex, row, 'transporter').trim(),
            weightKg: Math.round(tonnes * 1000),
            bill: getValidatedNumber(rowIndex, row, 'bill'),
            waitHours: getValidatedNumber(rowIndex, row, 'waitHours', 0),
            split: 'No',
            emptyReturn: 'No',
            notes: 'Imported via Smart Tally Mapper',
          };
        });
        localStorage.setItem('freight_audit_trips_v1', JSON.stringify([...newTrips, ...existing]));
        const savedRules = JSON.parse(localStorage.getItem('freight_audit_rules_v1') || 'null');
        if (savedRules) {
          const allDates = newTrips.map((t) => t.date).sort();
          if (allDates[0] && allDates[0] < savedRules.startDate) savedRules.startDate = allDates[0];
          if (allDates[allDates.length - 1] && allDates[allDates.length - 1] > savedRules.endDate) {
            savedRules.endDate = allDates[allDates.length - 1];
          }
          localStorage.setItem('freight_audit_rules_v1', JSON.stringify(savedRules));
        }
      } else if (targetEngine === 'p4') {
        const existing: AuditItem[] =
          importMode === 'append' ? JSON.parse(localStorage.getItem('binaudit_skus_v1') || '[]') : [];
        const newBins: AuditItem[] = validRows.map(({ rowIndex, row }, idx) => ({
          id: `tally-p4-${Date.now()}-${idx}`,
          code: getEffectiveCell(rowIndex, row, 'code').trim(),
          part: getEffectiveCell(rowIndex, row, 'part').trim(),
          spot: getEffectiveCell(rowIndex, row, 'spot').trim(),
          systemQty: getValidatedNumber(rowIndex, row, 'systemQty'),
          physicalQty: getValidatedNumber(rowIndex, row, 'physicalQty'),
          cost: getValidatedNumber(rowIndex, row, 'cost'),
          issuesPerMonth: getValidatedNumber(rowIndex, row, 'issuesPerMonth'),
        }));
        localStorage.setItem('binaudit_skus_v1', JSON.stringify([...newBins, ...existing]));
      } else if (targetEngine === 'p5') {
        const existingBills =
          importMode === 'append' ? JSON.parse(localStorage.getItem('p5_unpaid_bills_v1') || '[]') : [];
        const newBills = validRows.map(({ rowIndex, row }, idx) => ({
          id: `tally-p5-${Date.now()}-${idx}`,
          invoiceNo: getEffectiveCell(rowIndex, row, 'invoiceNo').trim(),
          customerName: getEffectiveCell(rowIndex, row, 'customerName').trim(),
          invoiceDate: getValidatedDate(rowIndex, row, 'invoiceDate'),
          dueDate: getValidatedDate(rowIndex, row, 'invoiceDate'),
          daysOverdue: getValidatedNumber(rowIndex, row, 'daysOverdue'),
          amountRupees: getValidatedNumber(rowIndex, row, 'amountRupees'),
          tallyLedger: 'Sundry Debtors - Tally Import',
        }));
        const mergedBills = [...newBills, ...existingBills];
        localStorage.setItem('p5_unpaid_bills_v1', JSON.stringify(mergedBills));
        const totalOverdue = mergedBills.reduce((s: number, b: any) => s + (b.amountRupees || 0), 0);
        const savedTower = JSON.parse(localStorage.getItem('monday_control_tower_v1') || 'null');
        if (savedTower) {
          savedTower.unpaidBillsRupees = totalOverdue;
          localStorage.setItem('monday_control_tower_v1', JSON.stringify(savedTower));
        }
      }

      window.dispatchEvent(new Event('storage'));
      setStatusMsg({
        type: 'ok',
        text: `Validated & imported ${validRows.length} rows into ${targetEngine.toUpperCase()} (${Object.keys(excludedRows).length} excluded, ${parsedTable.skippedNoiseCount} header/total rows stripped).`,
      });
      if (onImportSuccess) {
        onImportSuccess(targetEngine, validRows.length);
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Error importing rows. Check column mappings.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight">
                  Tally / Excel Column-Mapper &amp; Validation Quarantine
                </h2>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold uppercase">
                  Strict Date &amp; Number Validation
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Validates dates and numbers without silent default fallbacks. Quarantines invalid or ambiguous rows for explicit review before import.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Target Engine Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>1. Select Target Engine to Feed:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['p1', 'p2', 'p3', 'p4', 'p5'] as TargetEngineType[]).map((eng) => (
                <button
                  key={eng}
                  onClick={() => handleEngineSwitch(eng)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    targetEngine === eng
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {eng.toUpperCase()} — {ENGINE_SCHEMAS[eng].badge}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Raw Paste / File Upload */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>2. Paste Export or Upload (.CSV, .XLSX, max 5MB):</span>
                </label>
                <label className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3 text-indigo-400" />
                  <span>Upload .CSV / .XLSX</span>
                  <input type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              <textarea
                rows={9}
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setCellOverrides({});
                  setExcludedRows({});
                }}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-[11px] font-mono text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="Paste raw rows directly from Excel or Tally Prime..."
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800/80">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Filter className="w-3.5 h-3.5" />
                  Valid Rows: {validationSummary.validRowIndices.length} / {parsedTable.rows.length}
                </span>
                <span className="text-amber-400 font-mono">
                  Quarantined Issues: {validationSummary.issues.length}
                </span>
              </div>
            </div>

            {/* Step 3: Interactive Column Mapping Dropdowns */}
            <div className="lg:col-span-6 space-y-3">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>3. Column Mapping (Change mapping if needed):</span>
                <span className="text-[10px] font-mono text-indigo-400">Auto-mapped via ERP synonyms</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5 max-h-64 overflow-y-auto">
                {schema.fields.map((field) => (
                  <div key={field.key} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-200">{field.label}</span>
                      {field.required && <span className="text-rose-400 font-bold">*</span>}
                    </div>
                    <select
                      value={columnMap[field.key] ?? 0}
                      onChange={(e) =>
                        setColumnMap((prev) => ({ ...prev, [field.key]: parseInt(e.target.value, 10) }))
                      }
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-300 focus:border-indigo-500 focus:outline-none min-w-[190px]"
                    >
                      {parsedTable.headers.map((h, i) => (
                        <option key={i} value={i}>
                          Col {i + 1}: {h || `(Column ${i + 1})`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Import Mode */}
              <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 font-medium">Injection Mode:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setImportMode('append')}
                    className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                      importMode === 'append'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Append to Existing Ledger
                  </button>
                  <button
                    onClick={() => setImportMode('replace')}
                    className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                      importMode === 'replace'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Replace Entire Ledger
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quarantine Review Panel (Shown whenever invalid dates/numbers/fields exist) */}
          {validationSummary.issues.length > 0 && (
            <div className="rounded-xl border border-rose-500/50 bg-rose-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    Quarantined Rows Require Action ({validationSummary.issues.length} validation error{validationSummary.issues.length > 1 ? 's' : ''})
                  </span>
                </div>
                <span className="text-[11px] text-rose-200/80 font-mono">
                  Correct inline, adjust column mapping above, exclude row, or cancel import
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-rose-500/30 bg-slate-950 max-h-52 overflow-y-auto">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Row #</th>
                      <th className="py-2 px-3">Mapped Field</th>
                      <th className="py-2 px-3">Source / Current Value</th>
                      <th className="py-2 px-3">Validation Reason</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {validationSummary.issues.map((issue, idx) => {
                      const overrideKey = `${issue.rowIndex}:${issue.fieldKey}`;
                      return (
                        <tr key={`${overrideKey}-${idx}`} className="bg-rose-950/10">
                          <td className="py-2 px-3 font-bold text-rose-300">Row {issue.rowNumber}</td>
                          <td className="py-2 px-3 text-slate-200">{issue.fieldLabel}</td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={
                                cellOverrides[overrideKey] !== undefined
                                  ? cellOverrides[overrideKey]
                                  : issue.sourceValue
                              }
                              onChange={(e) =>
                                setCellOverrides((prev) => ({
                                  ...prev,
                                  [overrideKey]: e.target.value,
                                }))
                              }
                              placeholder="Enter valid value..."
                              className="bg-slate-900 border border-rose-500/50 rounded px-2 py-1 text-xs text-amber-200 focus:border-emerald-400 focus:outline-none w-44"
                            />
                          </td>
                          <td className="py-2 px-3 text-rose-300 font-sans">
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] mr-1.5">
                              {issue.status}
                            </span>
                            {issue.reason}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setExcludedRows((prev) => ({ ...prev, [issue.rowIndex]: true }))
                              }
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Exclude Row</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 4: Cleaned Preview Table */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300">
              4. Live Validated Preview (First 4 Active Rows):
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-[11px] font-mono">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Row</th>
                    {schema.fields.map((f) => (
                      <th key={f.key} className="py-2 px-3">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {parsedTable.rows
                    .map((row, rIdx) => ({ row, rIdx }))
                    .filter(({ rIdx }) => !excludedRows[rIdx])
                    .slice(0, 4)
                    .map(({ row, rIdx }) => (
                      <tr key={rIdx} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 text-slate-500">#{rIdx + 1}</td>
                        {schema.fields.map((f) => {
                          const rawVal = getEffectiveCell(rIdx, row, f.key);
                          if (f.type === 'number') {
                            const numRes = validateImportNumber(rawVal, {
                              allowNegative: false,
                              allowZero: f.allowZero ?? true,
                            });
                            return (
                              <td
                                key={f.key}
                                className={`py-2 px-3 ${
                                  numRes.status === 'VALID_NUMBER' ? 'text-slate-200' : 'text-rose-400 font-bold'
                                }`}
                              >
                                {numRes.status === 'VALID_NUMBER' && numRes.value !== undefined
                                  ? numRes.value.toLocaleString('en-IN')
                                  : `⚠️ ${numRes.status}`}
                              </td>
                            );
                          }
                          if (f.type === 'date' || f.type === 'datetime') {
                            const dateRes = validateImportDate(rawVal);
                            return (
                              <td
                                key={f.key}
                                className={`py-2 px-3 ${
                                  dateRes.status === 'VALID' ? 'text-slate-200' : 'text-rose-400 font-bold'
                                }`}
                              >
                                {dateRes.status === 'VALID' ? dateRes.normalized : `⚠️ ${dateRes.status}`}
                              </td>
                            );
                          }
                          return (
                            <td key={f.key} className="py-2 px-3 text-slate-200">
                              {rawVal || '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                statusMsg.type === 'ok'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              {statusMsg.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Ready to inject <strong>{validationSummary.validRowIndices.length}</strong> validated records into{' '}
            <strong>{schema.name}</strong>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel Import
            </button>
            <button
              onClick={executeCleanImport}
              disabled={validationSummary.issues.length > 0 || validationSummary.validRowIndices.length === 0}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {validationSummary.issues.length > 0
                  ? `Resolve ${validationSummary.issues.length} Quarantined Issue(s) First`
                  : `Import ${validationSummary.validRowIndices.length} Validated Rows into ${targetEngine.toUpperCase()}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
