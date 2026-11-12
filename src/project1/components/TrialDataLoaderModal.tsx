import React, { useState } from 'react';
import { TRIAL_DATASETS, TrialDataset } from '../data/trialDatasets';
import { StockItem, RulesConfig, CurrencyCode } from '../types';
import { formatCurrency, formatIndianLakhsCrores, generateOwnerReport } from '../utils/calculations';
import { 
  Database, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Building2, 
  Factory, 
  Layers, 
  Flame, 
  AlertTriangle,
  Download,
  Check
} from 'lucide-react';

interface TrialDataLoaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: CurrencyCode;
  activeDatasetId: string;
  onSelectDataset: (dataset: TrialDataset) => void;
}

export const TrialDataLoaderModal: React.FC<TrialDataLoaderModalProps> = ({
  isOpen,
  onClose,
  currency,
  activeDatasetId,
  onSelectDataset,
}) => {
  const [selectedId, setSelectedId] = useState<string>(activeDatasetId || 'ambattur-baseline');

  if (!isOpen) return null;

  const currentSelected = TRIAL_DATASETS.find((d) => d.id === selectedId) || TRIAL_DATASETS[0];
  const summary = generateOwnerReport(currentSelected.items, currentSelected.rules);

  const handleApply = () => {
    onSelectDataset(currentSelected);
    onClose();
  };

  const handleDownloadCsv = (dataset: TrialDataset) => {
    const headers = ['Item Code', 'Item Name', 'Category', 'Qty On Hand', 'Cost Rate', 'Last Movement Date'];
    const rows = dataset.items.map((i) => [
      `"${i.itemCode}"`,
      `"${i.itemName}"`,
      `"${i.category}"`,
      i.qtyOnHand,
      i.costRate,
      i.lastMovement,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${dataset.id}_test_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>R&amp;D Trial Data Center</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-300 dark:border-indigo-800">
                  4 Manufacturing Scenarios
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Stress-test the engine with different industry profiles: high dead cash, heavy MRO, or zero-defect clean factory.
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Scenario Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {TRIAL_DATASETS.map((dataset) => {
              const isSelected = dataset.id === selectedId;
              const isCurrentActive = dataset.id === activeDatasetId;

              return (
                <div
                  key={dataset.id}
                  onClick={() => setSelectedId(dataset.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-md'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Factory className={`w-4 h-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400'}`} />
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          {dataset.name}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        isSelected
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}>
                        {dataset.highlightStat}
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      {dataset.location}
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 line-clamp-2 leading-relaxed">
                      {dataset.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                    <span className="text-neutral-400 font-mono text-[11px]">
                      {dataset.skuCount} SKUs Tracked
                    </span>
                    {isCurrentActive && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Currently Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Dataset Live Preview & Analysis */}
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-700">
              <div>
                <div className="text-xs font-bold text-neutral-500 uppercase font-mono">
                  Scenario Engine Output Preview
                </div>
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                  {currentSelected.name} ({currentSelected.industry})
                </h3>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadCsv(currentSelected)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV ({currentSelected.skuCount} SKUs)</span>
              </button>
            </div>

            {/* Financial Output Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                <div className="text-[10px] font-bold text-neutral-400 uppercase">Stock on Books</div>
                <div className="text-base font-black font-mono mt-0.5 text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(summary.totalStockValue, currency)}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">
                  {formatIndianLakhsCrores(summary.totalStockValue)}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                <div className="text-[10px] font-bold text-red-500 uppercase">Dead Cash</div>
                <div className="text-base font-black font-mono mt-0.5 text-red-600 dark:text-red-400">
                  {formatCurrency(summary.deadCash, currency)}
                </div>
                <div className="text-[10px] text-red-500 font-mono">
                  {summary.deadCashPercent}% ({summary.deadItemCount} SKUs)
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                <div className="text-[10px] font-bold text-amber-500 uppercase">Annual Burn</div>
                <div className="text-base font-black font-mono mt-0.5 text-amber-600 dark:text-amber-400">
                  ~{formatCurrency(summary.annualHoldingBurn, currency)}
                </div>
                <div className="text-[10px] text-amber-500 font-mono">
                  @ {currentSelected.rules.holdingCostPercent}% holding rate
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                <div className="text-[10px] font-bold text-emerald-500 uppercase">Moving Cash</div>
                <div className="text-base font-black font-mono mt-0.5 text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(summary.movingCash, currency)}
                </div>
                <div className="text-[10px] text-emerald-500 font-mono">
                  {summary.movingCashPercent}% ({summary.movingItemCount} SKUs)
                </div>
              </div>
            </div>

            {/* Sample SKUs List */}
            <div>
              <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Sample SKUs in this Trial Profile:
              </div>
              <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    <tr>
                      <th className="p-2">Item Code</th>
                      <th className="p-2">Item Name</th>
                      <th className="p-2">Category</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Closing Value</th>
                      <th className="p-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {summary.topDeadItems.length > 0 ? (
                      summary.topDeadItems.slice(0, 4).map((item) => (
                        <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                          <td className="p-2 text-amber-600 dark:text-amber-400 font-bold">{item.itemCode}</td>
                          <td className="p-2 font-medium text-neutral-900 dark:text-neutral-100">{item.itemName}</td>
                          <td className="p-2 text-neutral-500">{item.category}</td>
                          <td className="p-2 text-right">{item.qtyOnHand}</td>
                          <td className="p-2 text-right">₹{item.costRate.toLocaleString('en-IN')}</td>
                          <td className="p-2 text-right font-bold">{formatCurrency(item.closingValue || 0, currency)}</td>
                          <td className="p-2 text-right text-red-500 font-bold">Dead ({item.daysIdle}d)</td>
                        </tr>
                      ))
                    ) : (
                      currentSelected.items.slice(0, 4).map((item) => (
                        <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                          <td className="p-2 text-indigo-600 dark:text-indigo-400 font-bold">{item.itemCode}</td>
                          <td className="p-2 font-medium text-neutral-900 dark:text-neutral-100">{item.itemName}</td>
                          <td className="p-2 text-neutral-500">{item.category}</td>
                          <td className="p-2 text-right">{item.qtyOnHand}</td>
                          <td className="p-2 text-right">₹{item.costRate.toLocaleString('en-IN')}</td>
                          <td className="p-2 text-right font-bold">{formatCurrency(item.qtyOnHand * item.costRate, currency)}</td>
                          <td className="p-2 text-right text-emerald-500 font-bold">Moving</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/70 flex items-center justify-between">
          <div className="text-xs text-neutral-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Selecting a profile replaces active engine memory and recalculates all dashboards instantly.</span>
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
              onClick={handleApply}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
            >
              <span>Load "{currentSelected.name}" into Engine</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
