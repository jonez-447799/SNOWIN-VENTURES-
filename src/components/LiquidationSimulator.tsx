import React, { useState } from 'react';
import { StockItem, RulesConfig, CurrencyCode, StockCategory } from '../types';
import { 
  simulateLiquidationScenario, 
  formatCurrency, 
  formatIndianLakhsCrores, 
  evaluateStockEngine 
} from '../utils/calculations';
import { 
  DollarSign, 
  TrendingUp, 
  Flame, 
  Zap, 
  Percent, 
  Sliders, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  RotateCcw, 
  AlertTriangle,
  Send,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2
} from 'lucide-react';

interface LiquidationSimulatorProps {
  items: StockItem[];
  rules: RulesConfig;
  currency: CurrencyCode;
  onNavigateToStock: () => void;
}

export const LiquidationSimulator: React.FC<LiquidationSimulatorProps> = ({
  items,
  rules,
  currency,
  onNavigateToStock,
}) => {
  // Global Discount %
  const [globalDiscount, setGlobalDiscount] = useState<number>(30);
  
  // Category-specific overrides toggle
  const [useCategoryTuning, setUseCategoryTuning] = useState<boolean>(false);
  const [categoryDiscounts, setCategoryDiscounts] = useState<Record<StockCategory, number>>({
    'Raw Material': 15,
    'Finished Goods': 35,
    'Spares': 40,
    'Consumable': 50,
  });

  const [copiedTender, setCopiedTender] = useState<boolean>(false);

  // Evaluate engine & simulate
  const evaluatedItems = evaluateStockEngine(items, rules);
  const deadItems = evaluatedItems.filter((i) => i.status === 'Dead');

  const scenario = simulateLiquidationScenario(
    items,
    rules,
    globalDiscount,
    useCategoryTuning ? categoryDiscounts : undefined
  );

  const handleCategoryDiscountChange = (cat: StockCategory, val: number) => {
    setCategoryDiscounts((prev) => ({
      ...prev,
      [cat]: Math.min(90, Math.max(0, val)),
    }));
  };

  const handleResetDiscounts = () => {
    setGlobalDiscount(30);
    setUseCategoryTuning(false);
    setCategoryDiscounts({
      'Raw Material': 15,
      'Finished Goods': 35,
      'Spares': 40,
      'Consumable': 50,
    });
  };

  // WhatsApp bulk liquidation quotation pitch
  const bulkTenderText = `*FACTORY DEAD INVENTORY - BULK LIQUIDATION OFFER*
As-of Date: ${rules.asOfDate}
Location: Ambattur Industrial Estate

We are clearing idle factory inventory on immediate payment basis (Lot Sale).

• *Total Book Valuation:* ${formatCurrency(scenario.totalDeadBookValue, currency)}
• *Target Clearance Value:* ${formatCurrency(scenario.cashRecovered, currency)} (Avg ${scenario.discountPercent}% off)
• *Total Available Lots:* ${deadItems.length} SKUs

*Itemized Clearance Lots:*
${deadItems
  .slice(0, 8)
  .map(
    (item, idx) =>
      `${idx + 1}. ${item.itemName} (${item.category}) - Qty: ${item.qtyOnHand} @ ₹${item.costRate}/unit (Idle ${item.daysIdle}d)`
  )
  .join('\n')}
${deadItems.length > 8 ? `...and ${deadItems.length - 8} more SKUs.` : ''}

Terms: Ex-Works factory floor. Immediate inspection & clearance.
Please DM or call to submit your lot offer.`;

  const copyTender = () => {
    navigator.clipboard.writeText(bulkTenderText);
    setCopiedTender(true);
    setTimeout(() => setCopiedTender(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Hero Card */}
      <div className="p-6 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-neutral-900/40 to-neutral-900 border text-neutral-100 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Simulation Engine
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  As of {rules.asOfDate}
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-white mt-1">
                Dead Stock Cash Flow &amp; Working Capital Recovery Simulator
              </h1>
              <p className="text-xs text-neutral-300 mt-1 max-w-2xl leading-relaxed">
                Factory owners often hold dead inventory because they hate taking an accounting haircut. 
                This simulator demonstrates how a planned markdown unleashes immediate liquidity, eliminates your 
                <strong> {rules.holdingCostPercent}% annual holding burn</strong>, and pays for itself within months when redeployed into fast-moving Class-A materials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetDiscounts}
              className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Sliders
            </button>
            <button
              onClick={copyTender}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all"
            >
              {copiedTender ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
              <span>{copiedTender ? 'Copied Tender!' : 'Copy WhatsApp Tender'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Result Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Dead Inventory Trapped */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-medium">Trapped Dead Cash (Books)</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 font-mono">
              {formatCurrency(scenario.totalDeadBookValue, currency)}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">
              {deadItems.length} SKUs idle &ge; {rules.deadThresholdDays} days
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-red-600 dark:text-red-400 font-medium">
            100% of Dead Inventory Pile
          </div>
        </div>

        {/* Metric 2: Instant Cash Unlocked */}
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs">
            <span className="font-bold">Immediate Cash Inflow</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
              {formatCurrency(scenario.cashRecovered, currency)}
            </div>
            <div className="text-xs text-emerald-800 dark:text-emerald-400/80 mt-0.5">
              Liquidated at {100 - scenario.discountPercent}% of book rate
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
            <span>+ Working capital available in 14 days</span>
          </div>
        </div>

        {/* Metric 3: Holding Burn Eliminated */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs">
            <span className="font-bold">Annual Burn Eliminated</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 font-mono">
              {formatCurrency(scenario.annualHoldingBurnEliminated, currency)}
            </div>
            <div className="text-xs text-amber-800 dark:text-amber-400/80 mt-0.5">
              @ {rules.holdingCostPercent}% cost of capital/storage
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
            Saved every single year going forward
          </div>
        </div>

        {/* Metric 4: Turnaround Payback Period */}
        <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-50/40 dark:bg-cyan-950/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-700 dark:text-cyan-400 text-xs">
            <span className="font-bold">Haircut Payback Velocity</span>
            <TrendingUp className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-cyan-700 dark:text-cyan-300 font-mono">
              {scenario.reinvestmentRoiMonths > 0 ? `${scenario.reinvestmentRoiMonths} mo` : 'Immediate'}
            </div>
            <div className="text-xs text-cyan-800 dark:text-cyan-400/80 mt-0.5">
              To recover {formatCurrency(scenario.haircutLoss, currency)} haircut
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-cyan-500/20 text-[11px] text-cyan-700 dark:text-cyan-300 font-semibold">
            By rotating into fast-moving Class-A items
          </div>
        </div>
      </div>

      {/* 3. Interactive Markdown Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-1 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-white dark:bg-neutral-900 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Markdown Parameters
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {globalDiscount}% Target
            </span>
          </div>

          {/* Master Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                Master Clearance Markdown
              </span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {globalDiscount}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="70"
              step="5"
              value={globalDiscount}
              onChange={(e) => setGlobalDiscount(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
              <span>0% (Full Price)</span>
              <span>25%</span>
              <span>50%</span>
              <span>70% (Scrap/Fire Sale)</span>
            </div>
          </div>

          {/* Category Tuning Toggle */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useCategoryTuning}
                  onChange={(e) => setUseCategoryTuning(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Fine-tune by Stock Category</span>
              </label>
              <span className="text-[10px] font-mono text-neutral-400">Advanced</span>
            </div>

            {useCategoryTuning && (
              <div className="mt-4 space-y-3 pl-3 border-l-2 border-amber-500/40">
                {(['Raw Material', 'Finished Goods', 'Spares', 'Consumable'] as StockCategory[]).map((cat) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-600 dark:text-neutral-400">{cat}</span>
                      <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                        {categoryDiscounts[cat]}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      step="5"
                      value={categoryDiscounts[cat]}
                      onChange={(e) => handleCategoryDiscountChange(cat, Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-1.5"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financial Recommendation Insight */}
          <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 text-xs space-y-2">
            <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Owner Financial Takeaway</span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-[11px]">
              Accepting a <strong>{formatCurrency(scenario.haircutLoss, currency)}</strong> book discount eliminates{' '}
              <strong>{formatCurrency(scenario.annualHoldingBurnEliminated, currency)}</strong> in annual holding drain every year. 
              Holding dead items for another 18 months guarantees a 100% loss due to rust, obsolescence, and bank CC interest.
            </p>
          </div>
        </div>

        {/* Itemized Clearance Table Column */}
        <div className="lg:col-span-2 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-white dark:bg-neutral-900 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Target Clearance Items ({deadItems.length} Dead SKUs)
                </h3>
              </div>
              <button
                onClick={onNavigateToStock}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>View Full Stock Sheet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300">
                  <tr>
                    <th className="p-2.5">Item Code</th>
                    <th className="p-2.5">Item Name</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-right">Idle</th>
                    <th className="p-2.5 text-right">Book Value</th>
                    <th className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">Target Recovery</th>
                    <th className="p-2.5 text-right text-red-500">Haircut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {deadItems.map((item) => {
                    const discount = useCategoryTuning
                      ? categoryDiscounts[item.category] ?? globalDiscount
                      : globalDiscount;
                    const bookVal = item.closingValue || 0;
                    const recovery = Math.round(bookVal * (1 - discount / 100));
                    const haircut = bookVal - recovery;

                    return (
                      <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                        <td className="p-2.5 text-amber-600 dark:text-amber-400 font-bold">{item.itemCode}</td>
                        <td className="p-2.5 font-medium text-neutral-900 dark:text-neutral-100">{item.itemName}</td>
                        <td className="p-2.5 text-neutral-500">{item.category}</td>
                        <td className="p-2.5 text-right text-red-600 dark:text-red-400">{item.daysIdle}d</td>
                        <td className="p-2.5 text-right text-neutral-800 dark:text-neutral-200">
                          {formatCurrency(bookVal, currency)}
                        </td>
                        <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(recovery, currency)}
                        </td>
                        <td className="p-2.5 text-right text-neutral-500">
                          -{formatCurrency(haircut, currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
            <span>Calculations based on {deadItems.length} dead items with &ge;{rules.deadThresholdDays} days idle</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              Total Target Recovery: {formatCurrency(scenario.cashRecovered, currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
