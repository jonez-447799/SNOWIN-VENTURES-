import React, { useState, useRef } from 'react';
import { StockItem, RulesConfig, StockCategory } from '../types';
import { normalizeDateString } from '../utils/calculations';
import { 
  Upload, 
  FileCode, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Download, 
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react';

interface TallyImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: RulesConfig;
  onImport: (items: StockItem[]) => void;
}

export const TallyImporterModal: React.FC<TallyImporterModalProps> = ({
  isOpen,
  onClose,
  rules,
  onImport,
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'paste'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<StockItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Clean numeric string from Tally (e.g. "25 Nos" -> 25, "1,850.00/Nos" -> 1850)
  const parseCleanNumber = (val: string | null | undefined): number => {
    if (!val) return 0;
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Helper to infer category
  const inferCategory = (catStr: string | null | undefined): StockCategory => {
    if (!catStr) return 'Raw Material';
    const lower = catStr.toLowerCase();
    if (lower.includes('finish') || lower.includes('fg') || lower.includes('product')) return 'Finished Goods';
    if (lower.includes('spare') || lower.includes('part') || lower.includes('mro')) return 'Spares';
    if (lower.includes('consum') || lower.includes('oil') || lower.includes('chemical') || lower.includes('paint')) return 'Consumable';
    return 'Raw Material';
  };

  // Parse Tally XML or generic XML
  const parseXmlContent = (xmlStr: string): StockItem[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
    
    // Check for parse errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('XML parsing syntax error. Ensure the file is well-formed Tally XML.');
    }

    // Look for STOCKITEM nodes (Tally standard) or general item nodes
    let itemNodes = Array.from(xmlDoc.querySelectorAll('STOCKITEM, StockItem, stockitem, Item, item, ROW, row'));
    if (itemNodes.length === 0) {
      // Look for any elements that have children with NAME and CLOSINGBALANCE
      const allElements = Array.from(xmlDoc.querySelectorAll('*'));
      itemNodes = allElements.filter(el => 
        el.querySelector('NAME, Name, ITEMNAME, ItemName') && 
        (el.querySelector('CLOSINGBALANCE, ClosingBalance, QTY, Qty, BilledQty') || el.querySelector('CLOSINGVALUE, ClosingValue'))
      );
    }

    if (itemNodes.length === 0) {
      throw new Error('No stock items detected in XML. Expected <STOCKITEM> or tags containing <NAME> and <CLOSINGBALANCE>.');
    }

    const items: StockItem[] = [];
    itemNodes.forEach((node, idx) => {
      const getTagText = (tags: string[]): string => {
        for (const t of tags) {
          const el = node.querySelector(t);
          if (el && el.textContent) return el.textContent.trim();
        }
        return '';
      };

      const name = getTagText(['NAME', 'Name', 'ITEMNAME', 'ItemName', 'DSPSTKNAME', 'STOCKITEMNAME']) || `Imported Item ${idx + 1}`;
      const code = getTagText(['PARTNO', 'PartNo', 'ITEMCODE', 'ItemCode', 'GUID', 'CODE']) || `SKU-${String(idx + 1).padStart(3, '0')}`;
      const categoryRaw = getTagText(['PARENT', 'Parent', 'CATEGORY', 'Category', 'STOCKGROUP', 'StockGroup']);
      const qtyRaw = getTagText(['CLOSINGBALANCE', 'ClosingBalance', 'ACTUALQTY', 'ActualQty', 'BILLEDQTY', 'BilledQty', 'QTY', 'Qty']);
      const rateRaw = getTagText(['CLOSINGRATE', 'ClosingRate', 'RATE', 'Rate', 'STDRATE', 'StdRate']);
      const dateRaw = getTagText(['LASTSALEDATE', 'LastSaleDate', 'LASTPURCHASEDATE', 'LastPurchaseDate', 'DATE', 'Date', 'LASTVCHDATE']);

      const qty = parseCleanNumber(qtyRaw) || 1;
      const rate = parseCleanNumber(rateRaw) || 100;
      const normalizedDate = dateRaw ? normalizeDateString(dateRaw) : rules.asOfDate;

      items.push({
        id: `tally-${Date.now().toString(36)}-${idx}`,
        itemCode: code,
        itemName: name,
        category: inferCategory(categoryRaw),
        qtyOnHand: qty,
        costRate: rate,
        lastMovement: normalizedDate || rules.asOfDate,
      });
    });

    return items;
  };

  // Parse CSV, TSV or Delimited Text
  const parseDelimitedContent = (text: string): StockItem[] => {
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) throw new Error('File is empty.');

    const items: StockItem[] = [];

    lines.forEach((line, index) => {
      // Check if header row
      if (index === 0 && (
        line.toLowerCase().includes('item') || 
        line.toLowerCase().includes('name') || 
        line.toLowerCase().includes('qty') ||
        line.toLowerCase().includes('rate')
      )) {
        return;
      }

      // Detect delimiter
      const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : line.includes('|') ? '|' : ',';
      const parts = line.split(delimiter).map(p => p.trim().replace(/^"|"$/g, ''));

      if (parts.length >= 2) {
        let code = `SKU-${String(index + 1).padStart(3, '0')}`;
        let name = parts[0];
        let category: StockCategory = 'Raw Material';
        let qty = 1;
        let rate = 100;
        let date = rules.asOfDate;

        if (parts.length >= 6) {
          code = parts[0] || code;
          name = parts[1] || name;
          category = inferCategory(parts[2]);
          qty = parseCleanNumber(parts[3]);
          rate = parseCleanNumber(parts[4]);
          date = normalizeDateString(parts[5]);
        } else if (parts.length >= 4) {
          name = parts[0];
          category = inferCategory(parts[1]);
          qty = parseCleanNumber(parts[2]);
          rate = parseCleanNumber(parts[3]);
          if (parts[4]) date = normalizeDateString(parts[4]);
        } else {
          name = parts[0];
          qty = parseCleanNumber(parts[1]);
          if (parts[2]) rate = parseCleanNumber(parts[2]);
        }

        items.push({
          id: `imp-${Date.now().toString(36)}-${index}`,
          itemCode: code,
          itemName: name,
          category,
          qtyOnHand: qty,
          costRate: rate,
          lastMovement: date || rules.asOfDate,
        });
      }
    });

    if (items.length === 0) {
      throw new Error('Could not parse rows. Ensure columns: Code, Name, Category, Qty, Rate, Date');
    }

    return items;
  };

  const processContent = (content: string, name?: string) => {
    setErrorMessage(null);
    try {
      let items: StockItem[] = [];
      const trimmed = content.trim();
      if (trimmed.startsWith('<') || (name && name.endsWith('.xml'))) {
        items = parseXmlContent(trimmed);
      } else {
        items = parseDelimitedContent(trimmed);
      }

      if (items.length > 0) {
        setParsedPreview(items);
        if (name) setFileName(name);
      } else {
        setErrorMessage('No valid items found in content.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse file content.');
      setParsedPreview([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        processContent(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          processContent(text, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const downloadSampleXml = () => {
    const sampleXml = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <DATA>
      <COLLECTION>
        <STOCKITEM NAME="SS Flange 150NB">
          <NAME>SS Flange 150NB</NAME>
          <PARTNO>FG-FLG-150</PARTNO>
          <PARENT>Finished Goods</PARENT>
          <BASEUNITS>Nos</BASEUNITS>
          <CLOSINGBALANCE>25 Nos</CLOSINGBALANCE>
          <CLOSINGRATE>1850.00/Nos</CLOSINGRATE>
          <CLOSINGVALUE>46250.00</CLOSINGVALUE>
          <LASTSALEDATE>20260211</LASTSALEDATE>
        </STOCKITEM>
        <STOCKITEM NAME="Copper Pipe 15mm">
          <NAME>Copper Pipe 15mm</NAME>
          <PARTNO>RM-COP-15</PARTNO>
          <PARENT>Raw Material</PARENT>
          <BASEUNITS>Mtr</BASEUNITS>
          <CLOSINGBALANCE>60 Mtr</CLOSINGBALANCE>
          <CLOSINGRATE>410.00/Mtr</CLOSINGRATE>
          <CLOSINGVALUE>24600.00</CLOSINGVALUE>
          <LASTSALEDATE>20260402</LASTSALEDATE>
        </STOCKITEM>
        <STOCKITEM NAME="Epoxy Grey 20L">
          <NAME>Epoxy Grey 20L</NAME>
          <PARTNO>CS-EPX-20L</PARTNO>
          <PARENT>Consumable</PARENT>
          <BASEUNITS>Can</BASEUNITS>
          <CLOSINGBALANCE>8 Can</CLOSINGBALANCE>
          <CLOSINGRATE>3800.00/Can</CLOSINGRATE>
          <CLOSINGVALUE>30400.00</CLOSINGVALUE>
          <LASTSALEDATE>20251119</LASTSALEDATE>
        </STOCKITEM>
        <STOCKITEM NAME="CNC Carbide Inserts TNMG">
          <NAME>CNC Carbide Inserts TNMG</NAME>
          <PARTNO>SP-CRB-16</PARTNO>
          <PARENT>Spares</PARENT>
          <BASEUNITS>Box</BASEUNITS>
          <CLOSINGBALANCE>12 Box</CLOSINGBALANCE>
          <CLOSINGRATE>2200.00/Box</CLOSINGRATE>
          <CLOSINGVALUE>26400.00</CLOSINGVALUE>
          <LASTSALEDATE>20260105</LASTSALEDATE>
        </STOCKITEM>
      </COLLECTION>
    </DATA>
  </BODY>
</ENVELOPE>`;

    const blob = new Blob([sampleXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_tally_inventory_export.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;
    onImport(parsedPreview);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>Universal Tally ERP &amp; Excel Importer</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  TallyPrime / ERP 9 / CSV
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Drop your raw Tally XML export or paste CSV/TSV columns directly. Auto-cleans units and formats dates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Mode Switcher & Sample Download */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveMode('upload')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  activeMode === 'upload'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Tally XML / CSV
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('paste')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  activeMode === 'paste'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Paste Text / Clipboard
              </button>
            </div>

            <button
              type="button"
              onClick={downloadSampleXml}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1.5 px-3 py-1.5 rounded border border-emerald-500/30 bg-emerald-500/5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Sample Tally XML
            </button>
          </div>

          {/* Upload Dropzone */}
          {activeMode === 'upload' ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-neutral-300 dark:border-neutral-700 hover:border-emerald-500/60 bg-neutral-50/50 dark:bg-neutral-800/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml,.csv,.tsv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Click to select or drag and drop your Tally XML or CSV file
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Supports direct export from TallyPrime: <code className="bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 rounded font-mono">Alt + E &gt; XML (Data Interchange)</code>
                  </p>
                </div>
                {fileName && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Loaded: {fileName}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                <span>Paste Tabular Data or XML</span>
                <span className="text-[11px] text-neutral-400 font-normal">
                  Format: Item Name [Tab/Comma] Category [Tab/Comma] Qty [Tab/Comma] Rate [Tab/Comma] Last Date
                </span>
              </label>
              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  if (e.target.value.trim().length > 10) {
                    processContent(e.target.value, 'pasted-text');
                  }
                }}
                rows={6}
                placeholder="Paste XML or lines like:&#10;SS flange 150NB, Finished Goods, 25, 1850, 2026-02-11&#10;Copper pipe 15mm, Raw Material, 60, 410, 2026-04-02"
                className="w-full text-xs font-mono p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Parsed Live Preview Table */}
          {parsedPreview.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Preview: {parsedPreview.length} Items Successfully Parsed
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Showing first {Math.min(5, parsedPreview.length)} of {parsedPreview.length} items
                </span>
              </div>

              <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    <tr>
                      <th className="p-2">Code</th>
                      <th className="p-2">Item Name</th>
                      <th className="p-2">Category</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Rate (₹)</th>
                      <th className="p-2">Last Movement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {parsedPreview.slice(0, 5).map((item, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <td className="p-2 text-amber-600 dark:text-amber-400">{item.itemCode}</td>
                        <td className="p-2 font-medium text-neutral-900 dark:text-neutral-100">{item.itemName}</td>
                        <td className="p-2">{item.category}</td>
                        <td className="p-2 text-right">{item.qtyOnHand}</td>
                        <td className="p-2 text-right">₹{item.costRate.toLocaleString('en-IN')}</td>
                        <td className="p-2">{item.lastMovement}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            As-of Audit Baseline: <strong className="text-neutral-800 dark:text-neutral-200">{rules.asOfDate}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parsedPreview.length === 0}
              onClick={handleConfirmImport}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${
                parsedPreview.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <span>Load {parsedPreview.length > 0 ? `${parsedPreview.length} Items into Engine` : 'Items'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
