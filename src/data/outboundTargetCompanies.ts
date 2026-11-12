/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { syncRecordToCloud } from '../utils/cloudPersistenceStore.ts';

export type OutboundClusterName =
  | 'Ambattur Industrial Estate'
  | 'Guindy, Perungudi & Thirumudivakkam'
  | 'Sriperumbudur, Oragadam & Maraimalai Nagar'
  | 'SIPCOT Hosur Phase I & II';

export type OutboundTargetStatus =
  | 'NOT_CONTACTED'
  | 'LINKEDIN_SENT'
  | 'TEASER_OFFERED'
  | 'CSV_RECEIVED'
  | 'UTR_PENDING'
  | 'PAID_14999';

export interface OutboundTargetCompany {
  id: string;
  companyName: string;
  cluster: OutboundClusterName;
  segment: string;
  targetBuyerRole: string;
  contactName: string;
  phoneOrWhatsapp: string;
  email: string;
  status: OutboundTargetStatus;
  notes: string;
  lastFollowUpAt: string;
}

export const OUTBOUND_CLUSTERS: OutboundClusterName[] = [
  'Ambattur Industrial Estate',
  'Guindy, Perungudi & Thirumudivakkam',
  'Sriperumbudur, Oragadam & Maraimalai Nagar',
  'SIPCOT Hosur Phase I & II',
];

export const OUTBOUND_STATUS_LABELS: Record<OutboundTargetStatus, string> = {
  NOT_CONTACTED: 'Not Contacted',
  LINKEDIN_SENT: 'LinkedIn Note Sent',
  TEASER_OFFERED: 'Free Teaser Offered',
  CSV_RECEIVED: '5-Column CSV Received',
  UTR_PENDING: 'UTR Payment Pending',
  PAID_14999: 'Paid ₹14,999 Audit',
};

const RAW_SEED_COMPANIES: Array<{
  companyName: string;
  cluster: OutboundClusterName;
  segment: string;
  targetBuyerRole: string;
  notes: string;
}> = [
  // Cluster 1 — Ambattur Industrial Estate (14 companies)
  {
    companyName: 'Autotech Industries India Pvt Ltd',
    cluster: 'Ambattur Industrial Estate',
    segment: 'Precision Stamped & Machined Auto Parts',
    targetBuyerRole: 'Managing Director / Plant Head / Materials Head',
    notes: 'Tier-1/2 auto component supplier in Ambattur; high RM/WIP SKU count.',
  },
  {
    companyName: 'Shriramm Auto Components Pvt Ltd',
    cluster: 'Ambattur Industrial Estate',
    segment: 'CNC Turned & Machined Auto Components',
    targetBuyerRole: 'Managing Director / Operations Director',
    notes: 'Ambattur precision machining unit; target >180-day slow-moving bar stock & spares.',
  },
  {
    companyName: 'SGI Automotive Pvt Ltd',
    cluster: 'Ambattur Industrial Estate',
    segment: 'Automotive Assemblies & Sub-Systems',
    targetBuyerRole: 'Plant Head / Head of Supply Chain',
    notes: 'High-mix discrete manufacturing in Ambattur Industrial Estate.',
  },
  {
    companyName: 'SVPC Automotive Pvt Ltd',
    cluster: 'Ambattur Industrial Estate',
    segment: 'Automotive Fasteners & Turned Parts',
    targetBuyerRole: 'Managing Director / Materials Manager',
    notes: 'Fastener & turned component inventory across multiple bin locations.',
  },
  {
    companyName: 'H P Valves & Fittings India Pvt Ltd',
    cluster: 'Ambattur Industrial Estate',
    segment: 'High-Pressure Industrial Valves & Instrumentation Fittings',
    targetBuyerRole: 'Managing Director / Plant Operations Head',
    notes: 'High-value stainless steel & alloy valve castings; ideal for P1 + P4 bin audit.',
  },
  {
    companyName: 'Goodrich Gasket Pvt Ltd',
    cluster: 'Ambattur Industrial Estate',
    segment: 'Industrial & Petrochemical Gaskets / Sealing Systems',
    targetBuyerRole: 'Director Operations / CFO / Materials Head',
    notes: 'Multi-grade metallic & spiral-wound gasket inventory in Ambattur.',
  },
  {
    companyName: 'Precision Machine & Auto Components Pvt Ltd',
    cluster: 'Ambattur Industrial Estate',
    segment: 'Heavy & Precision CNC Machined Castings',
    targetBuyerRole: 'Managing Director / GM Operations',
    notes: 'High unit-cost casting blanks and finished machined components.',
  },
  {
    companyName: 'Nutech CNC Pvt Ltd',
    cluster: 'Ambattur Industrial Estate',
    segment: 'Multi-Axis CNC Machining & Aerospace/Auto Parts',
    targetBuyerRole: 'Managing Director / Plant Head',
    notes: 'Multi-plant CNC machining specialist in Ambattur; high tooling & alloy stock.',
  },
  {
    companyName: 'Selva Engineering Works Pvt Ltd',
    cluster: 'Ambattur Industrial Estate',
    segment: 'Precision Engineering & Industrial Fabrication',
    targetBuyerRole: 'Managing Director / Works Manager',
    notes: 'Custom batch runs frequently leave surplus raw material and semi-finished WIP.',
  },
  {
    companyName: 'Autobahn Motor Products Pvt Ltd',
    cluster: 'Ambattur Industrial Estate',
    segment: 'Automotive Engine & Transmission Components',
    targetBuyerRole: 'Director / Head of Materials',
    notes: 'High SKU variety across OEM and aftermarket production schedules.',
  },
  {
    companyName: 'Packings & Jointings Gaskets Pvt Ltd',
    cluster: 'Ambattur Industrial Estate',
    segment: 'Automotive & Industrial Sealing Jointings',
    targetBuyerRole: 'Managing Director / Plant Manager',
    notes: 'Sheet stock, die-cut inventory, and export dispatch OTIF tracking.',
  },
  {
    companyName: 'M C Craftsman Machinery Pvt Ltd',
    cluster: 'Ambattur Industrial Estate',
    segment: 'Industrial Machinery & Precision Assemblies',
    targetBuyerRole: 'Managing Director / Operations Head',
    notes: 'Capital equipment sub-assemblies and high-value bought-out spares.',
  },
  {
    companyName: 'Sams Precision Components',
    cluster: 'Ambattur Industrial Estate',
    segment: 'CNC Turned & Ground Precision Components',
    targetBuyerRole: 'Proprietor / Managing Partner / Plant Head',
    notes: 'Fast-turnaround precision job & batch production in Ambattur.',
  },
  {
    companyName: 'PPM Precision Engineering',
    cluster: 'Ambattur Industrial Estate',
    segment: 'Precision Tooling & Machined Components',
    targetBuyerRole: 'Managing Partner / Works Head',
    notes: 'Ambattur tooling and precision component unit; strong fit for 5-column CSV audit.',
  },

  // Cluster 2 — Guindy, Perungudi & Thirumudivakkam (12 companies)
  {
    companyName: 'Super Auto Forge Limited',
    cluster: 'Guindy, Perungudi & Thirumudivakkam',
    segment: 'Cold & Warm Forged Auto Components',
    targetBuyerRole: 'VP Operations / Head of Materials / CFO',
    notes: 'Major Chennai forging leader (Guindy/Thirumudivakkam); high die & billet inventory.',
  },
  {
    companyName: 'JC Valves India Pvt Ltd',
    cluster: 'Guindy, Perungudi & Thirumudivakkam',
    segment: 'Industrial Ball, Gate & Globe Valves',
    targetBuyerRole: 'Plant Director / Supply Chain Head',
    notes: 'High-value valve bodies, trims, and actuators; ideal for P1 dead-stock recovery.',
  },
  {
    companyName: 'Samtech Engineering Services Pvt Ltd',
    cluster: 'Guindy, Perungudi & Thirumudivakkam',
    segment: 'Precision Engineering & Industrial Sub-Assemblies',
    targetBuyerRole: 'Managing Director / GM Operations',
    notes: 'Discrete engineering production in Guindy/Perungudi corridor.',
  },
  {
    companyName: 'Phoenix Medical Systems Pvt Ltd',
    cluster: 'Guindy, Perungudi & Thirumudivakkam',
    segment: 'Medical Equipment & Neonatal Care Devices',
    targetBuyerRole: 'Managing Director / Head of Manufacturing & SCM',
    notes: 'High-BOM electronic & mechanical sub-assemblies in Thirumudivakkam.',
  },
  {
    companyName: 'Ultramax Hydrojet Pvt Ltd',
    cluster: 'Guindy, Perungudi & Thirumudivakkam',
    segment: 'High-Pressure Hydrojetting & Pumping Systems',
    targetBuyerRole: 'Managing Director / Operations Head',
    notes: 'High-value pump spares, valves, and assembly inventory.',
  },
  {
    companyName: 'Technico Laboratory Products Pvt Ltd',
    cluster: 'Guindy, Perungudi & Thirumudivakkam',
    segment: 'Scientific & Industrial Laboratory Equipment',
    targetBuyerRole: 'Managing Director / Plant Manager',
    notes: 'Sheet metal, thermal controllers, and instrumentation inventory.',
  },
  {
    companyName: 'Srimukha Precision Technologies Pvt Ltd',
    cluster: 'Guindy, Perungudi & Thirumudivakkam',
    segment: 'Precision Aerospace, Defense & Industrial Machining',
    targetBuyerRole: 'Managing Director / Head of Operations',
    notes: 'High-cost specialty alloys and precision machined lots.',
  },
  {
    companyName: 'TMX Precision Tooling India Pvt Ltd',
    cluster: 'Guindy, Perungudi & Thirumudivakkam',
    segment: 'Precision Workholding & Machine Tool Accessories',
    targetBuyerRole: 'Director / Plant Head',
    notes: 'Export-grade tooling SKUs requiring tight bin accuracy and aging visibility.',
  },
  {
    companyName: 'Integral Precision Pvt Ltd',
    cluster: 'Guindy, Perungudi & Thirumudivakkam',
    segment: 'Precision Machined Automotive & Hydraulic Parts',
    targetBuyerRole: 'Managing Director / Materials Manager',
    notes: 'Thirumudivakkam industrial estate unit; Tally/ERP inventory export ready.',
  },
  {
    companyName: 'GK Sons Engineering Enterprises Pvt Ltd',
    cluster: 'Guindy, Perungudi & Thirumudivakkam',
    segment: 'Heavy & Medium Precision CNC Engineering',
    targetBuyerRole: 'Managing Director / Executive Director',
    notes: 'High-value machined fabrications and long-lead raw castings.',
  },
  {
    companyName: 'Aalta Tools And Design Pvt Ltd',
    cluster: 'Guindy, Perungudi & Thirumudivakkam',
    segment: 'Press Tools, Moulds, Jigs & Fixtures',
    targetBuyerRole: 'Managing Director / Tool Room Head',
    notes: 'Tool steel blocks, die sets, and precision component inventory.',
  },
  {
    companyName: 'Prakash Process Pumps',
    cluster: 'Guindy, Perungudi & Thirumudivakkam',
    segment: 'Industrial Chemical & Process Pumps',
    targetBuyerRole: 'Managing Partner / Plant Head',
    notes: 'Impeller castings, shafts, mechanical seals, and casing stock.',
  },

  // Cluster 3 — Sriperumbudur, Oragadam & Maraimalai Nagar (12 companies)
  {
    companyName: 'Besmak India Pvt Ltd',
    cluster: 'Sriperumbudur, Oragadam & Maraimalai Nagar',
    segment: 'Automotive Wiring Harness Connectors & Terminals',
    targetBuyerRole: 'Managing Director / Plant Head / SCM Head',
    notes: 'High-volume injection moulded & stamped terminal SKUs in Sriperumbudur/Oragadam.',
  },
  {
    companyName: 'Wolverine Automotive',
    cluster: 'Sriperumbudur, Oragadam & Maraimalai Nagar',
    segment: 'Automotive NVH, Brakes & Stamped Shims',
    targetBuyerRole: 'Plant Head / Materials Controller',
    notes: 'Specialty coated coils and high-mix OEM dispatch schedules.',
  },
  {
    companyName: 'Integral Component Manufacturers Pvt Ltd',
    cluster: 'Sriperumbudur, Oragadam & Maraimalai Nagar',
    segment: 'Sheet Metal Stampings & Welded Assemblies',
    targetBuyerRole: 'Managing Director / GM Operations',
    notes: 'Maraimalai Nagar / Sriperumbudur OEM supplier; P1 + P2 gate OTIF focus.',
  },
  {
    companyName: 'Automotive Components Technology India Pvt Ltd',
    cluster: 'Sriperumbudur, Oragadam & Maraimalai Nagar',
    segment: 'Automotive Precision Stamped & Tubular Assemblies',
    targetBuyerRole: 'Plant Director / Head of Materials',
    notes: 'Tier-1/2 OEM supplier in Sriperumbudur corridor.',
  },
  {
    companyName: 'Bontaz Automotive India Pvt Ltd',
    cluster: 'Sriperumbudur, Oragadam & Maraimalai Nagar',
    segment: 'Automotive Hydraulic & Engine Cooling Valves/Nozzles',
    targetBuyerRole: 'Plant Manager / Supply Chain Manager',
    notes: 'Precision powertrain fluid sub-assemblies in Sriperumbudur/Oragadam.',
  },
  {
    companyName: 'ATV Precision Components Pvt Ltd',
    cluster: 'Sriperumbudur, Oragadam & Maraimalai Nagar',
    segment: 'Precision Turned & Cold-Formed Auto Parts',
    targetBuyerRole: 'Managing Director / Plant Head',
    notes: 'High-volume automotive fastener and shaft inventory.',
  },
  {
    companyName: 'Emerald Forge Pvt Ltd',
    cluster: 'Sriperumbudur, Oragadam & Maraimalai Nagar',
    segment: 'Closed-Die Hot Forged Auto & Industrial Parts',
    targetBuyerRole: 'Managing Director / Works Head',
    notes: 'Forging billets, flash scrap, and heat-treated WIP batches.',
  },
  {
    companyName: 'Chennai Auto Forgings Pvt Ltd',
    cluster: 'Sriperumbudur, Oragadam & Maraimalai Nagar',
    segment: 'Automotive & Tractor Steel Forgings',
    targetBuyerRole: 'Managing Director / Materials Manager',
    notes: 'Steel bar stock, forging dies, and finished goods dispatch audit.',
  },
  {
    companyName: 'Southern Cold Forging Pvt Ltd',
    cluster: 'Sriperumbudur, Oragadam & Maraimalai Nagar',
    segment: 'Cold Extruded & Forged Precision Shafts/Gears',
    targetBuyerRole: 'Managing Director / Plant Operations Head',
    notes: 'Cold-heading wire coils, phosphate-coated blanks, and finished SKUs.',
  },
  {
    companyName: 'Sae Han Stamping Pvt Ltd',
    cluster: 'Sriperumbudur, Oragadam & Maraimalai Nagar',
    segment: 'Automotive Body-in-White & Press Stamping',
    targetBuyerRole: 'Plant Head / Production & Materials Head',
    notes: 'High-tonnage coil slitting, blanks, and JIT OEM gate dispatches.',
  },
  {
    companyName: 'Flametech Madras Pvt Ltd',
    cluster: 'Sriperumbudur, Oragadam & Maraimalai Nagar',
    segment: 'Thermal Processing, Flame Hardening & Machined Parts',
    targetBuyerRole: 'Managing Director / Plant Head',
    notes: 'Metallurgical processing & precision engineering in Chennai corridor.',
  },
  {
    companyName: 'Minami Metals Pvt Ltd',
    cluster: 'Sriperumbudur, Oragadam & Maraimalai Nagar',
    segment: 'Specialty Metal Processing & Automotive Stampings',
    targetBuyerRole: 'Director / Head of Supply Chain',
    notes: 'Steel coil inventory, offcuts, and multi-shift OEM deliveries.',
  },

  // Cluster 4 — SIPCOT Hosur Phase I & II (12 companies)
  {
    companyName: 'VJS Auto Components Pvt Ltd',
    cluster: 'SIPCOT Hosur Phase I & II',
    segment: 'Two-Wheeler & Commercial Vehicle Machined Parts',
    targetBuyerRole: 'Managing Director / Plant Head',
    notes: 'SIPCOT Hosur auto ancillaries supplying major 2W/CV OEMs.',
  },
  {
    companyName: 'Supreme Auto Comp India Pvt Ltd',
    cluster: 'SIPCOT Hosur Phase I & II',
    segment: 'Precision Sheet Metal & Tubular Auto Assemblies',
    targetBuyerRole: 'Managing Director / GM Operations',
    notes: 'High-velocity Hosur plant with frequent engineering change revisions.',
  },
  {
    companyName: 'Sunchirin Autoparts India Pvt Ltd',
    cluster: 'SIPCOT Hosur Phase I & II',
    segment: 'Automotive Air Conditioning Hoses, Tubes & Fittings',
    targetBuyerRole: 'Plant Head / Materials & Logistics Manager',
    notes: 'SIPCOT Hosur fluid-carrying assemblies; high fitting & tube SKU count.',
  },
  {
    companyName: 'Kems Shakti Precision Castings Pvt Ltd',
    cluster: 'SIPCOT Hosur Phase I & II',
    segment: 'Investment & Precision Alloy Steel Castings',
    targetBuyerRole: 'Managing Director / Foundry & Machining Head',
    notes: 'High-value alloy castings in Hosur; strong fit for P1 + P4 bin variance.',
  },
  {
    companyName: 'Hywell Forging Pvt Ltd',
    cluster: 'SIPCOT Hosur Phase I & II',
    segment: 'Closed-Die Steel Forgings & Machined Flanges',
    targetBuyerRole: 'Managing Director / Plant Head',
    notes: 'Forging raw stock and machined flange batches in SIPCOT Hosur.',
  },
  {
    companyName: 'Amsteel Casting Pvt Ltd',
    cluster: 'SIPCOT Hosur Phase I & II',
    segment: 'Steel & SG Iron Industrial Castings',
    targetBuyerRole: 'Managing Director / Operations Director',
    notes: 'Hosur foundry & machining unit; pattern and slow-moving casting audit.',
  },
  {
    companyName: 'J S Auto Cast Foundry India Pvt Ltd',
    cluster: 'SIPCOT Hosur Phase I & II',
    segment: 'Ductile Iron & Grey Iron Machined Castings',
    targetBuyerRole: 'VP Operations / Head of Materials',
    notes: 'High-tonnage casting & CNC machining exports; P1 + P3 freight leakage fit.',
  },
  {
    companyName: 'Southern India Steelcast Pvt Ltd',
    cluster: 'SIPCOT Hosur Phase I & II',
    segment: 'Alloy Steel & Industrial Valve/Pump Castings',
    targetBuyerRole: 'Managing Director / Plant Manager',
    notes: 'Hosur industrial casting unit with multi-stage heat-treat WIP.',
  },
  {
    companyName: 'Cascy Forge India Pvt Ltd',
    cluster: 'SIPCOT Hosur Phase I & II',
    segment: 'Automotive & Industrial Forged Components',
    targetBuyerRole: 'Managing Director / Head of Operations',
    notes: 'SIPCOT Hosur forging unit; billet aging and dispatch OTIF opportunity.',
  },
  {
    companyName: 'Inforge Pvt Ltd',
    cluster: 'SIPCOT Hosur Phase I & II',
    segment: 'Precision Hot & Warm Forged Engineering Parts',
    targetBuyerRole: 'Managing Director / Materials Head',
    notes: 'Forged rings, gears, and transmission blanks in Hosur.',
  },
  {
    companyName: 'Acrex Engineering Pvt Ltd',
    cluster: 'SIPCOT Hosur Phase I & II',
    segment: 'Precision CNC Machining & Sub-Assemblies',
    targetBuyerRole: 'Managing Director / Works Manager',
    notes: 'High-precision CNC batch production in SIPCOT Hosur.',
  },
  {
    companyName: 'Innotrans Systems India Pvt Ltd',
    cluster: 'SIPCOT Hosur Phase I & II',
    segment: 'Railway, Transit & Industrial Engineering Systems',
    targetBuyerRole: 'Managing Director / Head of Supply Chain',
    notes: 'Project-based and batch manufacturing in Hosur; surplus project stock focus.',
  },
];

export const INITIAL_OUTBOUND_TARGET_COMPANIES: OutboundTargetCompany[] =
  RAW_SEED_COMPANIES.map((item, idx) => ({
    id: `TARGET-${String(idx + 1).padStart(3, '0')}`,
    companyName: item.companyName,
    cluster: item.cluster,
    segment: item.segment,
    targetBuyerRole: item.targetBuyerRole,
    contactName: '',
    phoneOrWhatsapp: '',
    email: '',
    status: 'NOT_CONTACTED',
    notes: item.notes,
    lastFollowUpAt: '',
  }));

/**
 * Computes the 1-indexed Daily 10-Plant Batch (Day 1 = 1..10, Day 2 = 11..20, ..., Day 5 = 41..50+).
 */
export function getTargetCompanyDayBatch(indexZeroBased: number): 1 | 2 | 3 | 4 | 5 {
  const bucket = Math.floor(Math.max(0, indexZeroBased) / 10) + 1;
  if (bucket <= 1) return 1;
  if (bucket === 2) return 2;
  if (bucket === 3) return 3;
  if (bucket === 4) return 4;
  return 5;
}

/**
 * Builds the 1-Click Google/LinkedIn X-Ray search URL for finding the MD / Plant Head / CFO / Materials Head:
 * `"<Company Name>" ("Managing Director" OR "Plant Head" OR "Operations" OR "Materials" OR "CFO") site:linkedin.com/in/`
 */
export function buildLinkedInXRaySearchUrl(companyName: string): string {
  const cleanName = (companyName || '').trim() || 'Manufacturing';
  const query = `"${cleanName}" ("Managing Director" OR "Plant Head" OR "Operations" OR "Materials" OR "CFO") site:linkedin.com/in/`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Generates a personalized <300-character LinkedIn connection note dynamically mentioning
 * `<Company Name>` and `<Cluster>`. Guaranteed strictly < 300 characters.
 */
export function buildLinkedInConnectionNote(
  company: Pick<OutboundTargetCompany, 'companyName' | 'cluster' | 'contactName'>
): string {
  const greetingName = company.contactName?.trim()
    ? company.contactName.trim().split(/\s+/)[0]
    : 'Sir';
  const companyName = (company.companyName || 'your plant').trim();
  const cluster = (company.cluster || 'Chennai').trim();

  const fullNote = `Hi ${greetingName}, saw ${companyName}'s work in ${cluster}. Built a zero-ERP 5-col CSV tool that flags >180d dead stock & bin variance for TN plants in 60s (Free 3-SKU Teaser). Open to connect? — C. Jones Snowin`;
  if (fullNote.length < 300) {
    return fullNote;
  }

  const shortCompany = companyName.slice(0, 48).trim();
  const shortCluster = cluster.slice(0, 32).trim();
  return `Hi ${greetingName}, saw ${shortCompany} (${shortCluster}). Built a 5-col CSV audit that flags >180d dead stock & bin variance in 60s (Free 3-SKU Teaser). Open to connect? — Jones`.slice(
    0,
    295
  );
}

/**
 * Generates the WhatsApp / Direct Message Free 3-SKU Teaser pitch with live site URL.
 */
export function buildWhatsAppTeaserPitch(
  company: Pick<OutboundTargetCompany, 'companyName' | 'cluster' | 'contactName'>,
  siteUrl = 'https://operationalyst.in'
): string {
  const greeting = company.contactName?.trim()
    ? `Hi ${company.contactName.trim()},`
    : `Hello ${company.companyName.trim()} Operations Team,`;
  const cleanUrl = (siteUrl || 'https://operationalyst.in').replace(/\/+$/, '');

  return `${greeting}

I run Operationalyst (Snowin Ventures, Chennai). We help manufacturing plants in *${company.cluster}* uncover cash locked in >180-day slow/dead inventory and warehouse bin variance—without any ERP integration.

You can drop a 5-column Tally Prime / SAP / Excel stock export on our sandbox to generate an *Official 3-SKU Diagnostic Teaser Workspace for ₹0 (Free)* in 60 seconds:
${cleanUrl}

If the findings are useful for *${company.companyName}*, the full 4-Pillar Plant Audit & 6-Sheet Action Workbook unlocks for a one-time ₹14,999.

Happy to run a free 3-SKU sample check for your team today.
— C. Jones Snowin (+91 90805 40047)`;
}

/**
 * Builds `https://wa.me/<phone>?text=...` when a valid phone/WhatsApp number is saved on the CRM row.
 */
export function buildWhatsAppLaunchUrl(
  phoneOrWhatsapp: string,
  pitchText: string
): string | null {
  const digits = (phoneOrWhatsapp || '').replace(/\D+/g, '');
  if (digits.length < 10) {
    return null;
  }
  const normalizedPhone =
    digits.length === 10 ? `91${digits}` : digits.startsWith('0') ? `91${digits.slice(1)}` : digits;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(pitchText)}`;
}

/**
 * Exports the Outbound CRM table as a clean CSV string.
 */
export function exportOutboundCrmToCsv(companies: OutboundTargetCompany[]): string {
  const headers = [
    'ID',
    'Day_Batch',
    'Company_Name',
    'Cluster',
    'Segment',
    'Target_Buyer_Role',
    'Contact_Name',
    'Phone_Or_WhatsApp',
    'Email',
    'Status',
    'Last_Follow_Up_At',
    'Notes',
  ];

  const escapeCsvCell = (value: string | number | undefined | null): string => {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = companies.map((c, idx) =>
    [
      c.id,
      `Day ${getTargetCompanyDayBatch(idx)} Batch`,
      c.companyName,
      c.cluster,
      c.segment,
      c.targetBuyerRole,
      c.contactName,
      c.phoneOrWhatsapp,
      c.email,
      c.status,
      c.lastFollowUpAt,
      c.notes,
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

const DEFAULT_CRM_FILE_PATH = './data/outbound_crm.json';
const BROWSER_STORAGE_CRM_KEY = 'operationalyst_outbound_crm_v1';

const isBrowserEnv =
  typeof window !== 'undefined' && typeof window.document !== 'undefined';

function normalizeTargetCompany(
  raw: Partial<OutboundTargetCompany>,
  fallbackIndex = 0
): OutboundTargetCompany {
  const validClusters: OutboundClusterName[] = [
    'Ambattur Industrial Estate',
    'Guindy, Perungudi & Thirumudivakkam',
    'Sriperumbudur, Oragadam & Maraimalai Nagar',
    'SIPCOT Hosur Phase I & II',
  ];
  const validStatuses: OutboundTargetStatus[] = [
    'NOT_CONTACTED',
    'LINKEDIN_SENT',
    'TEASER_OFFERED',
    'CSV_RECEIVED',
    'UTR_PENDING',
    'PAID_14999',
  ];

  const cluster = validClusters.includes(raw.cluster as OutboundClusterName)
    ? (raw.cluster as OutboundClusterName)
    : 'Ambattur Industrial Estate';
  const status = validStatuses.includes(raw.status as OutboundTargetStatus)
    ? (raw.status as OutboundTargetStatus)
    : 'NOT_CONTACTED';

  return {
    id:
      typeof raw.id === 'string' && raw.id.trim()
        ? raw.id.trim()
        : `TARGET-${String(fallbackIndex + 1).padStart(3, '0')}`,
    companyName:
      typeof raw.companyName === 'string' && raw.companyName.trim()
        ? raw.companyName.trim()
        : `Target Manufacturing Unit ${fallbackIndex + 1}`,
    cluster,
    segment:
      typeof raw.segment === 'string' && raw.segment.trim()
        ? raw.segment.trim()
        : 'Discrete Manufacturing & Engineering',
    targetBuyerRole:
      typeof raw.targetBuyerRole === 'string' && raw.targetBuyerRole.trim()
        ? raw.targetBuyerRole.trim()
        : 'Managing Director / Plant Head / Materials Head',
    contactName: typeof raw.contactName === 'string' ? raw.contactName.trim() : '',
    phoneOrWhatsapp:
      typeof raw.phoneOrWhatsapp === 'string' ? raw.phoneOrWhatsapp.trim() : '',
    email: typeof raw.email === 'string' ? raw.email.trim() : '',
    status,
    notes: typeof raw.notes === 'string' ? raw.notes.trim() : '',
    lastFollowUpAt:
      typeof raw.lastFollowUpAt === 'string' ? raw.lastFollowUpAt.trim() : '',
  };
}

/**
 * Ensures all 50 pre-seeded companies are present while preserving any edits or custom added companies.
 */
export function mergeWithSeededTargets(
  storedList: Partial<OutboundTargetCompany>[] | null | undefined
): OutboundTargetCompany[] {
  if (!Array.isArray(storedList) || storedList.length === 0) {
    return INITIAL_OUTBOUND_TARGET_COMPANIES.map((c) => ({ ...c }));
  }

  const normalizedStored = storedList.map((item, idx) =>
    normalizeTargetCompany(item, idx)
  );
  const byId = new Map<string, OutboundTargetCompany>();
  const byNameLower = new Map<string, OutboundTargetCompany>();

  for (const item of normalizedStored) {
    byId.set(item.id, item);
    byNameLower.set(item.companyName.toLowerCase(), item);
  }

  const merged: OutboundTargetCompany[] = [];
  const usedIds = new Set<string>();

  for (const seed of INITIAL_OUTBOUND_TARGET_COMPANIES) {
    const existing =
      byId.get(seed.id) || byNameLower.get(seed.companyName.toLowerCase());
    if (existing) {
      merged.push({
        ...seed,
        ...existing,
        id: seed.id,
        companyName: existing.companyName || seed.companyName,
        cluster: existing.cluster || seed.cluster,
      });
      usedIds.add(existing.id);
      usedIds.add(seed.id);
    } else {
      merged.push({ ...seed });
      usedIds.add(seed.id);
    }
  }

  // Append any custom founder-added factories beyond the 50 seeds
  for (const item of normalizedStored) {
    if (
      !usedIds.has(item.id) &&
      !INITIAL_OUTBOUND_TARGET_COMPANIES.some(
        (s) => s.companyName.toLowerCase() === item.companyName.toLowerCase()
      )
    ) {
      merged.push(item);
      usedIds.add(item.id);
    }
  }

  return merged;
}

export function readOutboundCrmFromBrowser(): OutboundTargetCompany[] {
  if (!isBrowserEnv) {
    return INITIAL_OUTBOUND_TARGET_COMPANIES.map((c) => ({ ...c }));
  }
  try {
    const raw = window.localStorage.getItem(BROWSER_STORAGE_CRM_KEY);
    if (!raw) {
      return INITIAL_OUTBOUND_TARGET_COMPANIES.map((c) => ({ ...c }));
    }
    const parsed = JSON.parse(raw);
    return mergeWithSeededTargets(Array.isArray(parsed) ? parsed : parsed?.companies);
  } catch {
    return INITIAL_OUTBOUND_TARGET_COMPANIES.map((c) => ({ ...c }));
  }
}

export function saveOutboundCrmToBrowser(
  companies: OutboundTargetCompany[]
): OutboundTargetCompany[] {
  const merged = mergeWithSeededTargets(companies);
  if (isBrowserEnv) {
    try {
      window.localStorage.setItem(BROWSER_STORAGE_CRM_KEY, JSON.stringify(merged));
    } catch {
      // Ignore storage quota errors
    }
  }
  return merged;
}

export async function getOutboundCrmCompanies(
  customFilePath = DEFAULT_CRM_FILE_PATH
): Promise<OutboundTargetCompany[]> {
  if (isBrowserEnv) {
    return readOutboundCrmFromBrowser();
  }

  try {
    const fs = await import('fs/promises');
    const raw = await fs.readFile(customFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : parsed?.companies;
    return mergeWithSeededTargets(list);
  } catch {
    const initial = INITIAL_OUTBOUND_TARGET_COMPANIES.map((c) => ({ ...c }));
    await saveOutboundCrmCompanies(initial, customFilePath).catch(() => {});
    return initial;
  }
}

export async function saveOutboundCrmCompanies(
  companies: OutboundTargetCompany[],
  customFilePath = DEFAULT_CRM_FILE_PATH
): Promise<OutboundTargetCompany[]> {
  const merged = mergeWithSeededTargets(companies);
  if (isBrowserEnv) {
    return saveOutboundCrmToBrowser(merged);
  }

  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    await fs.mkdir(path.dirname(customFilePath), { recursive: true });
    await fs.writeFile(customFilePath, JSON.stringify(merged, null, 2), 'utf-8');
  } catch {
    // Fallback if read-only filesystem
  }

  if (customFilePath === DEFAULT_CRM_FILE_PATH) {
    void syncRecordToCloud('outbound_crm', 'OUTBOUND_CRM_50_TARGETS', {
      updatedAt: new Date().toISOString(),
      total: merged.length,
      companies: merged,
    }).catch(() => {});
  }

  return merged;
}

export async function updateOutboundTargetCompany(
  id: string,
  patch: Partial<Omit<OutboundTargetCompany, 'id'>>,
  customFilePath = DEFAULT_CRM_FILE_PATH
): Promise<{
  ok: boolean;
  company?: OutboundTargetCompany;
  companies: OutboundTargetCompany[];
  error?: string;
}> {
  const current = await getOutboundCrmCompanies(customFilePath);
  const idx = current.findIndex((c) => c.id === id);
  if (idx === -1) {
    return {
      ok: false,
      companies: current,
      error: `Target company ${id} not found.`,
    };
  }

  const existing = current[idx];
  const updated: OutboundTargetCompany = normalizeTargetCompany(
    {
      ...existing,
      ...patch,
      id: existing.id,
      lastFollowUpAt:
        patch.lastFollowUpAt !== undefined
          ? patch.lastFollowUpAt
          : patch.status && patch.status !== existing.status
          ? new Date().toISOString()
          : existing.lastFollowUpAt || new Date().toISOString(),
    },
    idx
  );

  const nextList = [...current];
  nextList[idx] = updated;
  const saved = await saveOutboundCrmCompanies(nextList, customFilePath);

  if (customFilePath === DEFAULT_CRM_FILE_PATH && !isBrowserEnv) {
    void syncRecordToCloud('outbound_crm', updated.id, updated).catch(() => {});
  }

  return {
    ok: true,
    company: updated,
    companies: saved,
  };
}

export async function addOutboundTargetCompany(
  input: {
    companyName: string;
    cluster: OutboundClusterName;
    segment?: string;
    targetBuyerRole?: string;
    contactName?: string;
    phoneOrWhatsapp?: string;
    email?: string;
    status?: OutboundTargetStatus;
    notes?: string;
  },
  customFilePath = DEFAULT_CRM_FILE_PATH
): Promise<{
  ok: boolean;
  company?: OutboundTargetCompany;
  companies: OutboundTargetCompany[];
  error?: string;
}> {
  const companyName = typeof input.companyName === 'string' ? input.companyName.trim() : '';
  if (companyName.length < 2) {
    const current = await getOutboundCrmCompanies(customFilePath);
    return {
      ok: false,
      companies: current,
      error: 'Company name must be at least 2 characters.',
    };
  }

  const current = await getOutboundCrmCompanies(customFilePath);
  const nextNumber = current.length + 1;
  const newCompany = normalizeTargetCompany(
    {
      id: `TARGET-${String(nextNumber).padStart(3, '0')}`,
      companyName,
      cluster: input.cluster,
      segment: input.segment || 'Discrete Manufacturing & Engineering',
      targetBuyerRole:
        input.targetBuyerRole || 'Managing Director / Plant Head / Materials Head',
      contactName: input.contactName || '',
      phoneOrWhatsapp: input.phoneOrWhatsapp || '',
      email: input.email || '',
      status: input.status || 'NOT_CONTACTED',
      notes: input.notes || '',
      lastFollowUpAt: '',
    },
    current.length
  );

  const nextList = [...current, newCompany];
  const saved = await saveOutboundCrmCompanies(nextList, customFilePath);

  if (customFilePath === DEFAULT_CRM_FILE_PATH && !isBrowserEnv) {
    void syncRecordToCloud('outbound_crm', newCompany.id, newCompany).catch(() => {});
  }

  return {
    ok: true,
    company: newCompany,
    companies: saved,
  };
}
