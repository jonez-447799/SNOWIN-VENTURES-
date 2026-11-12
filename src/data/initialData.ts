import type { StockItem, RulesConfig } from '../types.ts';

export const DEFAULT_RULES: RulesConfig = {
  asOfDate: '2026-10-01',
  deadThresholdDays: 180,
  slowThresholdDays: 90,
  classACutoff: 80,
  classBCutoff: 95,
  holdingCostPercent: 18,
};

/**
 * Baseline 20 SKUs for the Ambattur fabrication unit sample.
 * Exact figures:
 * - Stock on books: ₹6,45,650
 * - Dead cash (idle >= 180 days): ₹2,23,110 (8 items, 34.6%)
 * - Slow cash (idle 90 - 179 days): ₹63,600 (2 items, 9.8%)
 * - 31 - 89 days: ₹71,160 (2 items, 11.0%)
 * - 0 - 30 days: ₹2,87,780 (8 items, 44.6%)
 * - Annual holding burn @ 18%: ₹40,160
 */
export const AMBATTUR_FABRICATION_SAMPLE: StockItem[] = [
  // 1. Dead item 1
  {
    id: 'sku-01',
    itemCode: 'FG-PBX-G1',
    itemName: 'Panel box gen-1',
    category: 'Finished Goods',
    qtyOnHand: 14,
    costRate: 5100,
    lastMovement: '2025-08-14', // 413 days idle
    movementDates: ['2025-04-10', '2025-06-18', '2025-08-14'],
  },
  // 2. Dead item 2 - Core Drill SKU
  {
    id: 'sku-02',
    itemCode: 'FG-FLG-150',
    itemName: 'SS flange 150NB',
    category: 'Finished Goods',
    qtyOnHand: 25,
    costRate: 1850,
    lastMovement: '2026-02-11', // 232 days idle
    movementDates: ['2025-10-18', '2025-11-25', '2025-12-14', '2026-01-19', '2026-02-11'],
  },
  // 3. Dead item 3
  {
    id: 'sku-03',
    itemCode: 'RM-COP-15',
    itemName: 'Copper pipe 15mm',
    category: 'Raw Material',
    qtyOnHand: 60,
    costRate: 410,
    lastMovement: '2026-04-02', // 182 days idle
    movementDates: ['2025-11-04', '2025-12-20', '2026-01-28', '2026-02-24', '2026-04-02'],
  },
  // 4. Dead item 4
  {
    id: 'sku-04',
    itemCode: 'CS-EPX-20L',
    itemName: 'Epoxy grey 20L',
    category: 'Consumable',
    qtyOnHand: 7,
    costRate: 2800,
    lastMovement: '2026-03-18', // 197 days idle
    movementDates: ['2025-10-22', '2025-11-19', '2025-12-30', '2026-02-05', '2026-03-18'],
  },
  // 5. Dead item 5
  {
    id: 'sku-05',
    itemCode: 'FG-GID-NS',
    itemName: 'GI duct non-std',
    category: 'Finished Goods',
    qtyOnHand: 16,
    costRate: 1100,
    lastMovement: '2025-12-01', // 304 days idle
    movementDates: ['2025-08-15', '2025-10-10', '2025-12-01'],
  },
  // 6. Dead item 6
  {
    id: 'sku-06',
    itemCode: 'SP-BRG-6308',
    itemName: 'Bearing 6308 obsolete',
    category: 'Spares',
    qtyOnHand: 30,
    costRate: 550,
    lastMovement: '2026-01-04', // 270 days idle
    movementDates: ['2025-09-12', '2025-11-15', '2026-01-04'],
  },
  // 7. Dead item 7
  {
    id: 'sku-07',
    itemCode: 'RM-VAL-1IN',
    itemName: 'Brass valve 1 inch',
    category: 'Raw Material',
    qtyOnHand: 20,
    costRate: 760,
    lastMovement: '2026-02-28', // 215 days idle
    movementDates: ['2025-10-05', '2025-12-11', '2026-02-28'],
  },
  // 8. Dead item 8
  {
    id: 'sku-08',
    itemCode: 'RM-MSA-50',
    itemName: 'MS Angle 50x50 scrap offcut',
    category: 'Raw Material',
    qtyOnHand: 26,
    costRate: 460,
    lastMovement: '2025-10-18', // 348 days idle
    movementDates: ['2025-07-20', '2025-09-02', '2025-10-18'],
  },
  // 9. Slow item 1
  {
    id: 'sku-09',
    itemCode: 'FG-EVC-PNL',
    itemName: 'EV charger panel',
    category: 'Finished Goods',
    qtyOnHand: 8,
    costRate: 4800,
    lastMovement: '2026-07-01', // 92 days idle
    movementDates: ['2025-11-14', '2025-12-22', '2026-02-10', '2026-04-18', '2026-05-25', '2026-07-01'],
  },
  // 10. Slow item 2
  {
    id: 'sku-10',
    itemCode: 'SP-HYD-050',
    itemName: 'Hydraulic hose 1/2"',
    category: 'Spares',
    qtyOnHand: 18,
    costRate: 1400,
    lastMovement: '2026-05-19', // 135 days idle
    movementDates: ['2025-10-29', '2025-12-15', '2026-02-14', '2026-03-30', '2026-05-19'],
  },
  // 11. 31-89 days item 1
  {
    id: 'sku-11',
    itemCode: 'RM-ALU-40',
    itemName: 'Aluminium section 40x40',
    category: 'Raw Material',
    qtyOnHand: 42,
    costRate: 980,
    lastMovement: '2026-08-14', // 48 days idle
    movementDates: ['2025-11-10', '2026-01-15', '2026-03-12', '2026-05-08', '2026-06-20', '2026-07-18', '2026-08-14'],
  },
  // 12. 31-89 days item 2
  {
    id: 'sku-12',
    itemCode: 'RM-BOLT-M12',
    itemName: 'Fastener hex bolt M12 high-tensile',
    category: 'Raw Material',
    qtyOnHand: 1500,
    costRate: 20,
    lastMovement: '2026-07-29', // 64 days idle
    movementDates: ['2025-12-05', '2026-02-18', '2026-04-10', '2026-06-04', '2026-07-29'],
  },
  // 13. 0-30 days item 1
  {
    id: 'sku-13',
    itemCode: 'RM-SS-304',
    itemName: 'SS 304 sheet 2mm',
    category: 'Raw Material',
    qtyOnHand: 30,
    costRate: 4750,
    lastMovement: '2026-09-18', // 13 days idle
    movementDates: ['2025-10-15', '2025-11-20', '2025-12-18', '2026-01-22', '2026-02-26', '2026-03-24', '2026-04-29', '2026-05-31', '2026-06-28', '2026-07-25', '2026-08-22', '2026-09-18'],
  },
  // 14. 0-30 days item 2
  {
    id: 'sku-14',
    itemCode: 'RM-MSP-10',
    itemName: 'MS Plate 10mm structural',
    category: 'Raw Material',
    qtyOnHand: 18,
    costRate: 4960,
    lastMovement: '2026-09-23', // 8 days idle
    movementDates: ['2025-11-12', '2025-12-16', '2026-01-18', '2026-02-20', '2026-04-05', '2026-05-18', '2026-07-02', '2026-08-15', '2026-09-23'],
  },
  // 15. 0-30 days item 3
  {
    id: 'sku-15',
    itemCode: 'CS-WLD-70S',
    itemName: 'Welding wire spool ER70S-6',
    category: 'Consumable',
    qtyOnHand: 21,
    costRate: 1000,
    lastMovement: '2026-09-11', // 20 days idle
    movementDates: ['2025-10-08', '2025-11-15', '2025-12-22', '2026-01-30', '2026-03-05', '2026-04-12', '2026-05-20', '2026-06-25', '2026-07-30', '2026-08-25', '2026-09-11'],
  },
  // 16. 0-30 days item 4
  {
    id: 'sku-16',
    itemCode: 'CS-CUT-4IN',
    itemName: 'Cutting disc 4 inch abrasive',
    category: 'Consumable',
    qtyOnHand: 300,
    costRate: 50,
    lastMovement: '2026-09-26', // 5 days idle
    movementDates: ['2025-10-20', '2025-11-28', '2025-12-28', '2026-01-25', '2026-02-28', '2026-03-30', '2026-04-28', '2026-05-27', '2026-06-29', '2026-07-28', '2026-08-29', '2026-09-26'],
  },
  // 17. 0-30 days item 5
  {
    id: 'sku-17',
    itemCode: 'RM-MSP-02',
    itemName: 'MS Pipe 2 inch B-class',
    category: 'Raw Material',
    qtyOnHand: 14,
    costRate: 700,
    lastMovement: '2026-09-15', // 16 days idle
    movementDates: ['2025-11-05', '2026-01-10', '2026-03-15', '2026-05-12', '2026-07-10', '2026-09-15'],
  },
  // 18. 0-30 days item 6
  {
    id: 'sku-18',
    itemCode: 'CS-GRD-7IN',
    itemName: 'Grinding wheel 7 inch',
    category: 'Consumable',
    qtyOnHand: 30,
    costRate: 150,
    lastMovement: '2026-09-20', // 11 days idle
    movementDates: ['2025-12-10', '2026-02-14', '2026-04-20', '2026-06-18', '2026-08-14', '2026-09-20'],
  },
  // 19. 0-30 days item 7
  {
    id: 'sku-19',
    itemCode: 'CS-ZNC-SPY',
    itemName: 'Zinc cold galvanize spray 500ml',
    category: 'Consumable',
    qtyOnHand: 8,
    costRate: 400,
    lastMovement: '2026-09-24', // 7 days idle
    movementDates: ['2026-01-08', '2026-03-12', '2026-05-22', '2026-07-15', '2026-09-24'],
  },
  // 20. 0-30 days item 8
  {
    id: 'sku-20',
    itemCode: 'CS-TEF-ROL',
    itemName: 'Teflon thread seal tape 12mm',
    category: 'Consumable',
    qtyOnHand: 100,
    costRate: 25,
    lastMovement: '2026-09-28', // 3 days idle
    movementDates: ['2025-10-18', '2025-12-14', '2026-02-10', '2026-04-14', '2026-06-12', '2026-08-08', '2026-09-28'],
  },
];

export const VOCABULARY_WORDS = [
  {
    term: 'Inventory / Stock',
    short: 'Goods already paid for and not yet sold or used.',
    explanation: 'Whatever is sitting on the shelf is cash that cannot pay wages, power bills, or steel suppliers. It is already spent.',
    factoryContext: 'Tally tells the owner his total stock balance. It does NOT tell him which lines have been quiet for six months.',
  },
  {
    term: 'SKU (Stock Keeping Unit)',
    short: 'One specific item with its own name and part code.',
    explanation: 'A 10mm bolt and a 12mm bolt are two different SKUs. Each row in this engine is exactly one SKU.',
    factoryContext: 'Ambattur fabrication units typically have 150 to 800 active SKUs across raw metal, hardware, and paint.',
  },
  {
    term: 'Working Capital',
    short: 'Money tied inside the daily running of the business.',
    explanation: 'Working capital = Stock + Customer receivables (uncollected bills) - Supplier payables. You are directly freeing up the stock portion.',
    factoryContext: 'Every rupee trapped in a dead flange is a rupee the owner had to borrow from an Overdraft (OD) facility at 11-14% interest.',
  },
  {
    term: 'Stockout',
    short: 'The customer wants the item, but the shelf is empty.',
    explanation: 'Factories often suffer from both diseases at once: dead flanges rusting in the back corner, but no SS 304 sheet when a paying job arrives.',
    factoryContext: 'Mention stockouts once in the meeting so the owner knows you understand manufacturing balance, not just clearing shelves.',
  },
  {
    term: 'Tally Stock Summary & Ageing Analysis',
    short: 'The standard desktop accounting report and its age breakdown.',
    explanation: 'You are not replacing Tally. You are taking its exported Stock Summary and last voucher dates, and converting them into a 1-page executive action sheet.',
    factoryContext: 'Most factory owners have never opened Tally Ageing Analysis because it requires multi-column F12 configuration and does not sort by cash value.',
  },
  {
    term: 'OTIF (On Time In Full)',
    short: 'Dispatch delivery accuracy metric.',
    explanation: 'Did the customer get everything ordered on the promised date? This belongs to Project 2 (Dispatch & Production). Do not mention it in the dead stock meeting.',
    factoryContext: 'Keep this first conversation focused 100% on locked rupees.',
  },
];

export const TALLY_EXPORT_STEPS = [
  {
    step: 1,
    title: 'Open Stock Summary in TallyPrime / Tally.ERP 9',
    keys: 'Gateway of Tally > Stock Summary (or press S)',
    detail: 'This displays the list of stock groups or primary inventory items.',
  },
  {
    step: 2,
    title: 'Switch to Detailed Item View',
    keys: 'Press Alt + F1 (or Alt + F5 in TallyPrime)',
    detail: 'Expands all groups to show individual item names and SKUs.',
  },
  {
    step: 3,
    title: 'Configure F12 to Show Rates & Last Sale / Movement',
    keys: 'Press F12 (Configure)',
    detail: 'Set "Show Closing Balance" = YES, "Show Goods Inwards" = NO, "Show Goods Outwards/Sales" = YES, "Show Value" = YES.',
  },
  {
    step: 4,
    title: 'Export to Excel / CSV',
    keys: 'Press Alt + E (Export) > Current / File > Format: Excel / CSV',
    detail: 'Select local destination folder. Ensure "Include Dependent Info" is checked if you want batch dates.',
  },
  {
    step: 5,
    title: 'Feed File into this Engine',
    keys: 'Drag & Drop into Stock Sheet or click "Import Tally File"',
    detail: 'The engine automatically detects Item Name, Qty, Cost Rate, and Last Movement date to produce the 1-page Owner Report in seconds.',
  },
];

export const WHATSAPP_PITCH_TEMPLATES = {
  initialPitch: `Sir, good morning. Tally tells you your total stock value, but it doesn't show you which lines have stopped moving in six months and how many rupees are sitting dead in them.

Send me your Tally Stock Summary (Item name, Closing qty, Rate, Last sale/issue date). 

In 48 hours, I will hand you a 1-page report showing:
1. Exact rupees locked in 180+ day dead stock
2. What that pile costs you every year in interest & shed space
3. The top 5 lines to stop buying, discount, or scrap this week

If the report doesn't reveal actionable cash to unlock, you pay nothing.`,

  followUpWithDrill: `Sir, here is a 1-page analysis of your stock file:

Of ₹{TOTAL_STOCK} sitting on your books, ₹{DEAD_CASH} ({DEAD_PCT}%) has not moved in 180 days. 
Keeping that dead pile costs you about ₹{BURN_YEAR} every year in bank interest and storage.

Top items to stop reordering immediately:
{TOP_DEAD_LIST}

Let's do a 10-minute call to review the discount/scrap plan.`,
};
