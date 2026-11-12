import type { StockItem, RulesConfig } from '../types.ts';
import { AMBATTUR_FABRICATION_SAMPLE, DEFAULT_RULES } from './initialData.ts';

export interface TrialDataset {
  id: string;
  name: string;
  location: string;
  industry: string;
  description: string;
  skuCount: number;
  highlightStat: string;
  rules: RulesConfig;
  items: StockItem[];
}

/**
 * 1. Sriperumbudur Auto-Ancillary Machining Unit
 * High-value CNC machined parts, customized OEM components with dead stock from model phase-outs.
 */
export const SRIPERUMBUDUR_AUTO_SAMPLE: StockItem[] = [
  {
    id: 'auto-01',
    itemCode: 'FG-TRN-HSG',
    itemName: 'CNC Transmission Housing Machined',
    category: 'Finished Goods',
    qtyOnHand: 42,
    costRate: 6800,
    lastMovement: '2025-07-15', // 443 days idle
    movementDates: ['2025-03-10', '2025-05-22', '2025-07-15'],
  },
  {
    id: 'auto-02',
    itemCode: 'RM-ALU-ADC12',
    itemName: 'ADC12 Aluminium Die Cast Billets',
    category: 'Raw Material',
    qtyOnHand: 180,
    costRate: 850,
    lastMovement: '2025-09-04', // 392 days idle
    movementDates: ['2025-04-18', '2025-06-12', '2025-09-04'],
  },
  {
    id: 'auto-03',
    itemCode: 'SP-CRB-TNMG',
    itemName: 'Custom Kennametal Carbide Tool Inserts',
    category: 'Spares',
    qtyOnHand: 28,
    costRate: 2450,
    lastMovement: '2025-11-12', // 323 days idle
    movementDates: ['2025-06-01', '2025-08-14', '2025-11-12'],
  },
  {
    id: 'auto-04',
    itemCode: 'FG-SHAFT-SPL',
    itemName: 'Spline Shaft 45mm Hardened',
    category: 'Finished Goods',
    qtyOnHand: 35,
    costRate: 3100,
    lastMovement: '2026-01-20', // 254 days idle
    movementDates: ['2025-08-10', '2025-10-15', '2026-01-20'],
  },
  {
    id: 'auto-05',
    itemCode: 'CS-CUT-OIL',
    itemName: 'Water Soluble Synthetic Cutting Fluid (210L Barrel)',
    category: 'Consumable',
    qtyOnHand: 4,
    costRate: 14500,
    lastMovement: '2026-02-18', // 225 days idle
    movementDates: ['2025-09-12', '2025-11-20', '2026-02-18'],
  },
  {
    id: 'auto-06',
    itemCode: 'RM-EN8-ROD',
    itemName: 'EN8 Carbon Steel Rod 65mm Dia',
    category: 'Raw Material',
    qtyOnHand: 55,
    costRate: 980,
    lastMovement: '2026-03-10', // 205 days idle
    movementDates: ['2025-11-05', '2026-01-14', '2026-03-10'],
  },
  {
    id: 'auto-07',
    itemCode: 'SP-HYD-SEAL',
    itemName: 'Hydraulic Cylinder Polyurethane Seal Kits',
    category: 'Spares',
    qtyOnHand: 15,
    costRate: 1800,
    lastMovement: '2026-03-28', // 187 days idle
    movementDates: ['2025-12-01', '2026-02-10', '2026-03-28'],
  },
  // Slow moving (90 - 179 days)
  {
    id: 'auto-08',
    itemCode: 'FG-BRAKE-DRM',
    itemName: 'Cast Iron Brake Drum Finished',
    category: 'Finished Goods',
    qtyOnHand: 40,
    costRate: 2200,
    lastMovement: '2026-05-15', // 139 days idle
    movementDates: ['2026-01-10', '2026-03-12', '2026-05-15'],
  },
  {
    id: 'auto-09',
    itemCode: 'RM-SS410-SHT',
    itemName: 'SS 410 Sheet 3mm Hot Rolled',
    category: 'Raw Material',
    qtyOnHand: 25,
    costRate: 3600,
    lastMovement: '2026-06-20', // 103 days idle
    movementDates: ['2026-02-15', '2026-04-18', '2026-06-20'],
  },
  // Moving fast (0 - 89 days)
  {
    id: 'auto-10',
    itemCode: 'FG-PIN-PIST',
    itemName: 'High Precision Gudgeon Piston Pins',
    category: 'Finished Goods',
    qtyOnHand: 120,
    costRate: 750,
    lastMovement: '2026-09-24', // 7 days idle
    movementDates: ['2026-06-10', '2026-07-15', '2026-08-20', '2026-09-24'],
  },
  {
    id: 'auto-11',
    itemCode: 'RM-ALU-6061',
    itemName: 'Aluminium 6061 T6 Round Bar 50mm',
    category: 'Raw Material',
    qtyOnHand: 90,
    costRate: 1450,
    lastMovement: '2026-09-28', // 3 days idle
    movementDates: ['2026-07-01', '2026-08-14', '2026-09-28'],
  },
  {
    id: 'auto-12',
    itemCode: 'CS-DEGR-25L',
    itemName: 'Industrial Ultrasonic Degreasing Chemical 25L',
    category: 'Consumable',
    qtyOnHand: 18,
    costRate: 1650,
    lastMovement: '2026-09-15', // 16 days idle
    movementDates: ['2026-06-12', '2026-08-05', '2026-09-15'],
  },
  {
    id: 'auto-13',
    itemCode: 'SP-COLLET-ER32',
    itemName: 'ER32 CNC Spring Collets Precision',
    category: 'Spares',
    qtyOnHand: 24,
    costRate: 1200,
    lastMovement: '2026-09-02', // 29 days idle
    movementDates: ['2026-05-18', '2026-07-22', '2026-09-02'],
  },
  {
    id: 'auto-14',
    itemCode: 'FG-HUB-WHL',
    itemName: 'Front Wheel Hub Forged & Machined',
    category: 'Finished Goods',
    qtyOnHand: 65,
    costRate: 2850,
    lastMovement: '2026-09-26', // 5 days idle
    movementDates: ['2026-07-10', '2026-08-18', '2026-09-26'],
  },
  {
    id: 'auto-15',
    itemCode: 'RM-BRASS-HEX',
    itemName: 'Free Cutting Brass Hex Rod 22mm',
    category: 'Raw Material',
    qtyOnHand: 70,
    costRate: 1950,
    lastMovement: '2026-08-28', // 34 days idle
    movementDates: ['2026-06-15', '2026-07-25', '2026-08-28'],
  },
];

/**
 * 2. Coimbatore Textile Machinery & Foundry Spares
 * Heavy MRO Spares, Castings, Electrical Motors, Bearings.
 */
export const COIMBATORE_TEXTILE_SAMPLE: StockItem[] = [
  {
    id: 'tex-01',
    itemCode: 'FG-SPIN-GBX',
    itemName: 'Spinning Frame Differential Gearbox',
    category: 'Finished Goods',
    qtyOnHand: 6,
    costRate: 34000,
    lastMovement: '2025-06-10', // 478 days idle
    movementDates: ['2025-02-14', '2025-04-20', '2025-06-10'],
  },
  {
    id: 'tex-02',
    itemCode: 'SP-SKF-BEAR',
    itemName: 'SKF Spherical Roller Bearings 22218 EK',
    category: 'Spares',
    qtyOnHand: 18,
    costRate: 5200,
    lastMovement: '2025-10-05', // 361 days idle
    movementDates: ['2025-05-12', '2025-07-19', '2025-10-05'],
  },
  {
    id: 'tex-03',
    itemCode: 'RM-CI-CAST',
    itemName: 'Grade FG 260 Cast Iron Machine Bed Castings',
    category: 'Raw Material',
    qtyOnHand: 12,
    costRate: 9800,
    lastMovement: '2026-01-15', // 259 days idle
    movementDates: ['2025-08-14', '2025-10-30', '2026-01-15'],
  },
  {
    id: 'tex-04',
    itemCode: 'SP-MTR-7HP',
    itemName: 'Siemens 7.5 HP 3-Phase Induction Motor 1440 RPM',
    category: 'Spares',
    qtyOnHand: 4,
    costRate: 24500,
    lastMovement: '2026-02-20', // 223 days idle
    movementDates: ['2025-09-05', '2025-11-18', '2026-02-20'],
  },
  {
    id: 'tex-05',
    itemCode: 'CS-LUB-SYN',
    itemName: 'Klüber High Speed Synthetic Spindle Grease 1Kg',
    category: 'Consumable',
    qtyOnHand: 15,
    costRate: 2900,
    lastMovement: '2026-03-12', // 203 days idle
    movementDates: ['2025-10-10', '2025-12-22', '2026-03-12'],
  },
  // Slow items
  {
    id: 'tex-06',
    itemCode: 'SP-BELT-TIM',
    itemName: 'Optibelt High Torque Timing Belts 8M',
    category: 'Spares',
    qtyOnHand: 35,
    costRate: 1450,
    lastMovement: '2026-05-02', // 152 days idle
    movementDates: ['2026-01-08', '2026-03-10', '2026-05-02'],
  },
  {
    id: 'tex-07',
    itemCode: 'RM-EN19-ROD',
    itemName: 'Alloy Steel EN19 Ground Shaft Rod 50mm',
    category: 'Raw Material',
    qtyOnHand: 40,
    costRate: 1850,
    lastMovement: '2026-06-14', // 109 days idle
    movementDates: ['2026-02-14', '2026-04-10', '2026-06-14'],
  },
  // Moving items
  {
    id: 'tex-08',
    itemCode: 'FG-ROTOR-SPN',
    itemName: 'Open End Spinning Ceramic Coated Rotors',
    category: 'Finished Goods',
    qtyOnHand: 150,
    costRate: 950,
    lastMovement: '2026-09-25', // 6 days idle
    movementDates: ['2026-07-04', '2026-08-18', '2026-09-25'],
  },
  {
    id: 'tex-09',
    itemCode: 'RM-CRCA-18G',
    itemName: 'CRCA Cold Rolled Sheet 1.2mm (18 Gauge)',
    category: 'Raw Material',
    qtyOnHand: 60,
    costRate: 2400,
    lastMovement: '2026-09-20', // 11 days idle
    movementDates: ['2026-06-15', '2026-08-02', '2026-09-20'],
  },
  {
    id: 'tex-10',
    itemCode: 'CS-EMULS-OIL',
    itemName: 'Spindle Flushing & Lubrication Oil 20L',
    category: 'Consumable',
    qtyOnHand: 12,
    costRate: 3100,
    lastMovement: '2026-09-28', // 3 days idle
    movementDates: ['2026-07-12', '2026-08-25', '2026-09-28'],
  },
];

/**
 * 3. Lean JIT Benchmark Factory (Control Group)
 * 100% active, fast-moving inventory with ZERO dead items.
 * Used for R&D stress testing to prove the engine handles 0% dead stock without divide-by-zero or calculation bugs.
 */
export const LEAN_JIT_CONTROL_SAMPLE: StockItem[] = [
  {
    id: 'jit-01',
    itemCode: 'RM-ALU-FLT',
    itemName: 'Aluminium Busbar 50x10 Elect Grade',
    category: 'Raw Material',
    qtyOnHand: 40,
    costRate: 2600,
    lastMovement: '2026-09-27', // 4 days idle
    movementDates: ['2026-08-10', '2026-09-05', '2026-09-27'],
  },
  {
    id: 'jit-02',
    itemCode: 'FG-ENCL-IP65',
    itemName: 'Modular Electrical Enclosure IP65',
    category: 'Finished Goods',
    qtyOnHand: 18,
    costRate: 6400,
    lastMovement: '2026-09-25', // 6 days idle
    movementDates: ['2026-08-15', '2026-09-10', '2026-09-25'],
  },
  {
    id: 'jit-03',
    itemCode: 'RM-COP-BUS',
    itemName: 'Copper Strip 25x3 ETP Grade',
    category: 'Raw Material',
    qtyOnHand: 85,
    costRate: 1100,
    lastMovement: '2026-09-29', // 2 days idle
    movementDates: ['2026-08-01', '2026-08-28', '2026-09-29'],
  },
  {
    id: 'jit-04',
    itemCode: 'CS-POWD-RAL',
    itemName: 'Pure Polyester Powder Coat RAL 7035',
    category: 'Consumable',
    qtyOnHand: 25,
    costRate: 850,
    lastMovement: '2026-09-18', // 13 days idle
    movementDates: ['2026-07-20', '2026-08-22', '2026-09-18'],
  },
  {
    id: 'jit-05',
    itemCode: 'SP-FUSE-HRC',
    itemName: 'Bussmann HRC Fuse Links 63A',
    category: 'Spares',
    qtyOnHand: 50,
    costRate: 420,
    lastMovement: '2026-09-12', // 19 days idle
    movementDates: ['2026-07-15', '2026-08-14', '2026-09-12'],
  },
  {
    id: 'jit-06',
    itemCode: 'FG-JUNCT-BOX',
    itemName: 'Cast Aluminium Flameproof Junction Box',
    category: 'Finished Goods',
    qtyOnHand: 22,
    costRate: 3800,
    lastMovement: '2026-09-22', // 9 days idle
    movementDates: ['2026-08-05', '2026-08-30', '2026-09-22'],
  },
  {
    id: 'jit-07',
    itemCode: 'RM-SS316-ROD',
    itemName: 'SS 316 Bright Round Rod 25mm',
    category: 'Raw Material',
    qtyOnHand: 30,
    costRate: 2900,
    lastMovement: '2026-09-08', // 23 days idle
    movementDates: ['2026-07-18', '2026-08-16', '2026-09-08'],
  },
  {
    id: 'jit-08',
    itemCode: 'CS-SEAL-SIL',
    itemName: 'High Temp RTV Silicone Sealant Cartridge',
    category: 'Consumable',
    qtyOnHand: 35,
    costRate: 340,
    lastMovement: '2026-09-14', // 17 days idle
    movementDates: ['2026-07-25', '2026-08-20', '2026-09-14'],
  },
];

/**
 * Registry of all available trial R&D datasets
 */
export const TRIAL_DATASETS: TrialDataset[] = [
  {
    id: 'ambattur-baseline',
    name: 'Ambattur Fabrication Unit',
    location: 'Ambattur Industrial Estate, Chennai',
    industry: 'Sheet Metal & Control Panels',
    description: 'Baseline 20-SKU manufacturing model. Exposes ₹2.23 Lakhs in dead inventory (34.6%) across copper pipes, SS flanges, and epoxy paints.',
    skuCount: 20,
    highlightStat: '₹2.23L Dead (34.6%)',
    rules: DEFAULT_RULES,
    items: AMBATTUR_FABRICATION_SAMPLE,
  },
  {
    id: 'sriperumbudur-auto',
    name: 'Sriperumbudur Auto-Ancillary Machining',
    location: 'SIPCOT Industrial Park, Sriperumbudur',
    industry: 'CNC Precision Auto Machining',
    description: 'Severe dead cash scenario due to OEM component model phase-out. Heavy trapped value in machined transmission housings and custom Kennametal carbide tooling.',
    skuCount: SRIPERUMBUDUR_AUTO_SAMPLE.length,
    highlightStat: 'High Dead Value (~41%)',
    rules: {
      ...DEFAULT_RULES,
      deadThresholdDays: 180,
      slowThresholdDays: 90,
      holdingCostPercent: 20,
    },
    items: SRIPERUMBUDUR_AUTO_SAMPLE,
  },
  {
    id: 'coimbatore-textile',
    name: 'Coimbatore Textile & Foundry Spares',
    location: 'Peenya / Coimbatore Industrial Corridor',
    industry: 'Heavy Machinery & MRO Spares',
    description: 'High MRO inventory scenario with capital trapped in spare Siemens motors, SKF spherical bearings, and cast iron machine bed castings.',
    skuCount: COIMBATORE_TEXTILE_SAMPLE.length,
    highlightStat: 'Heavy Spares & MRO',
    rules: {
      ...DEFAULT_RULES,
      deadThresholdDays: 180,
      slowThresholdDays: 90,
      holdingCostPercent: 18,
    },
    items: COIMBATORE_TEXTILE_SAMPLE,
  },
  {
    id: 'lean-jit-control',
    name: 'Lean JIT Factory (Control Group)',
    location: 'Hosur Industrial Hub',
    industry: 'Just-In-Time Electrical Systems',
    description: 'R&D Benchmark: 100% healthy, moving stock with 0 dead items. Proves system calculations under zero-defect / zero-dead inventory conditions.',
    skuCount: LEAN_JIT_CONTROL_SAMPLE.length,
    highlightStat: '0% Dead (Clean Baseline)',
    rules: {
      ...DEFAULT_RULES,
      deadThresholdDays: 180,
      slowThresholdDays: 90,
      holdingCostPercent: 15,
    },
    items: LEAN_JIT_CONTROL_SAMPLE,
  },
];
