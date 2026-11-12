export type Language = 'en' | 'ta' | 'hi' | 'de' | 'es';

export type UserRole = 'owner' | 'supply_chain_head' | 'floor_dispatcher' | 'consultant';

export interface MondayTowerData {
  clientName: string;
  weekEndingDate: string; // e.g. "05 Oct 2026"
  lastUpdated: string;
  
  // 8 Yellow-Cell Inputs
  deadCashRupees: number; // ₹2,23,110 (Project 1)
  deadCashFileUnchanged: boolean;
  deadCashLastFileDate: string;
  
  stockoutRiskCount: number; // 4 SKUs (A-items with < 2 weeks)
  
  dispatchesCount: number; // 18 loads (Project 2)
  otifPassesCount: number; // 9 passes (Project 2)
  ordersLateCount: number; // 7 loads missed time (Project 2)
  
  freightPaidRupees: number; // ₹58,000 (Project 3)
  tripsCount: number; // 12 trips (Project 3)
  
  unpaidBillsRupees: number; // ₹3,40,000 (Tally outstandings > credit limit)
  normalCreditDays: number; // e.g. 30 days
  
  // Historical Comparison (Previous Monday)
  previousMonday: {
    deadCashRupees: number;
    stockoutRiskCount: number;
    ordersLateCount: number;
    dispatchesCount: number;
    freightPerTrip: number;
    otifPercent: number;
    unpaidBillsRupees: number;
  };
}

export interface SKUItem {
  id: string;
  partNumber: string;
  description: string;
  category: 'A-Item' | 'Fast Mover';
  stockOnHand: number;
  unit: string;
  dailyBurnRate: number;
  daysRemaining: number;
  supplier: string;
  leadTimeDays: number;
  urgency: 'critical' | 'warning';
}

export interface LateOrder {
  id: string;
  orderNumber: string;
  customer: string;
  destination: string;
  promisedTime: string;
  actualDepartureTime: string;
  delayMinutes: number;
  reason: string;
  carrier: string;
  vehicleNo: string;
  otifStatus: 'Time Fail' | 'Time & Qty Fail' | 'Pass';
}

export interface FreightTrip {
  id: string;
  tripNumber: string;
  date: string;
  route: string;
  carrier: string;
  truckType: string;
  costRupees: number;
  weightTons: number;
  utilizationPct: number;
}

export interface UnpaidBill {
  id: string;
  invoiceNo: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  amountRupees: number;
  daysOverdue: number;
  status: 'Critical (>60d)' | 'Overdue (31-60d)' | 'Within Credit';
  tallyLedger: string;
}

export interface DeadStockItem {
  id: string;
  partNo: string;
  description: string;
  locationBin: string;
  qty: number;
  unitCost: number;
  totalValueRupees: number;
  daysIdle: number;
  recommendation: 'Scrap' | 'Return to Vendor' | 'Discount Liquidation' | 'Rework';
}

export interface FleetVehicle {
  id: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  currentRoute: string;
  origin: string;
  destination: string;
  status: 'In Transit' | 'Delayed' | 'Loading' | 'Delivered';
  speedKmH: number;
  eta: string;
  promisedEta: string;
  delayMinutes: number;
  latitude: number;
  longitude: number;
  progressPercent: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  content: string;
  timestamp: string;
  isMe: boolean;
  status: 'sent' | 'delivered' | 'read';
  encrypted: boolean;
}

export interface ERPConnection {
  system: 'Tally Prime' | 'SAP S/4HANA' | 'Zoho Books' | 'Custom CSV';
  status: 'Connected' | 'Syncing' | 'Offline';
  lastSync: string;
  syncedRecords: number;
  endpoint: string;
}
