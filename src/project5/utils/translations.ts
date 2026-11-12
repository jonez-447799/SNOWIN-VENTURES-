import { Language } from '../types';

export interface Translations {
  appName: string;
  tagline: string;
  weekEnding: string;
  before9am: string;
  gateOpensWarning: string;
  sixNumbersHeader: string;
  sixNumbersSub: string;
  copyWhatsApp: string;
  copied: string;
  openInWhatsApp: string;
  replyPrompt: string;
  deadCash: string;
  deadCashDesc: string;
  stockoutRisk: string;
  stockoutRiskDesc: string;
  ordersLate: string;
  ordersLateDesc: string;
  freightPerTrip: string;
  freightPerTripDesc: string;
  otif: string;
  otifDesc: string;
  unpaidBills: string;
  unpaidBillsDesc: string;
  openProject: string;
  thisWeekSheet: string;
  yellowCellsExplanation: string;
  fleetMonitor: string;
  encryptedComms: string;
  erpSync: string;
  quarterlyReport: string;
  retainerModel: string;
  priceNote: string;
  cancelAnyMonth: string;
  darkWarehouseMode: string;
  dayMode: string;
  activeShipments: string;
  liveStatus: string;
  offlineMode: string;
  onlineMode: string;
  searchFilter: string;
  exportCsv: string;
  printNote: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    appName: 'CEO Monday Briefing Engine',
    tagline: 'Executive Operations Control Tower • Cash, Revenue, Profit & Inventory Decisions before 9 AM.',
    weekEnding: 'Week ending',
    before9am: 'Send before 9:00 AM',
    gateOpensWarning: 'After 9:00 AM he is on the shop floor and the note is dead.',
    sixNumbersHeader: 'The Six Monday Numbers',
    sixNumbersSub: 'One tower is one client. Six is the limit before the factory gate opens.',
    copyWhatsApp: 'Copy WhatsApp Note',
    copied: 'Copied to Clipboard!',
    openInWhatsApp: 'Send on WhatsApp',
    replyPrompt: 'Reply with the one you want opened today.',
    deadCash: 'Dead Cash',
    deadCashDesc: 'Rupees in items not moving for 180 days',
    stockoutRisk: 'Stockout Risk',
    stockoutRiskDesc: 'Important SKUs with under two weeks of shelf life left',
    ordersLate: 'Orders Late',
    ordersLateDesc: 'Loads that missed the promised dispatch time',
    freightPerTrip: 'Freight per Trip',
    freightPerTripDesc: 'Total freight paid divided by completed trips',
    otif: 'OTIF (On-Time & In-Full)',
    otifDesc: 'Passes divided by dispatches (late or short fails)',
    unpaidBills: 'Unpaid Bills',
    unpaidBillsDesc: 'Customers holding cash older than normal credit days',
    openProject: 'Open Project',
    thisWeekSheet: 'This Week Sheet (Yellow Inputs)',
    yellowCellsExplanation: 'Eight inputs behind the six lines. You type these; the tower calculates the rest.',
    fleetMonitor: 'Fleet Radar & Lanes',
    encryptedComms: 'Floor Dispatcher Chat',
    erpSync: 'ERP & Tally Sync',
    quarterlyReport: 'Quarterly Reporting',
    retainerModel: 'Monthly Retainer Habit',
    priceNote: '₹5,000 – ₹8,000 / month',
    cancelAnyMonth: 'Cancel any month. Not a software subscription, a weekly executive habit.',
    darkWarehouseMode: 'Warehouse Dark Mode',
    dayMode: 'Day Mode',
    activeShipments: 'Active Shipments',
    liveStatus: 'Live Tracking',
    offlineMode: 'Offline Cache Active',
    onlineMode: 'Connected',
    searchFilter: 'Search & filter...',
    exportCsv: 'Export CSV',
    printNote: 'Print / Save PDF',
  },
  ta: {
    appName: 'திங்கள் கட்டுப்பாட்டு கோபுரம்',
    tagline: 'காலை 9 மணிக்கு முன் வாட்ஸ்அப்பில் ஆறு எண்கள். நீங்கள் விற்கும் வழக்கம்.',
    weekEnding: 'முடிவுற்ற வாரம்',
    before9am: 'காலை 9:00 மணிக்கு முன் அனுப்பவும்',
    gateOpensWarning: '9 மணிக்கு மேல் அவர் தொழிற்சாலை தளத்தில் இருப்பார்; குறிப்பு பயனற்றதாகிவிடும்.',
    sixNumbersHeader: 'ஆறு திங்கட்கிழமை எண்கள்',
    sixNumbersSub: 'ஒரு வாடிக்கையாளருக்கு ஒரு கோபுரம் மட்டுமே. கேட் திறக்கும் முன் 6 எண்கள் மட்டுமே.',
    copyWhatsApp: 'வாட்ஸ்அப் குறிப்பை நகலெடு',
    copied: 'நகலெடுக்கப்பட்டது!',
    openInWhatsApp: 'வாட்ஸ்அப்பில் அனுப்பு',
    replyPrompt: 'இன்று நீங்கள் பார்க்க விரும்பும் திட்டத்தின் எண்ணை பதிலளிக்கவும்.',
    deadCash: 'முடங்கிய பணம் (Dead Cash)',
    deadCashDesc: '180 நாட்களாக நகரவே இல்லாத பொருட்களில் உள்ள ரூபாய்',
    stockoutRisk: 'சரக்கு தட்டுப்பாடு அபாயம்',
    stockoutRiskDesc: 'இரண்டு வாரங்களுக்குள் தீர்ந்துவிடும் முக்கிய SKUs',
    ordersLate: 'தாமதமான ஆர்டர்கள்',
    ordersLateDesc: 'குறித்த நேரத்திற்கு புறப்படாத வாகனங்கள்',
    freightPerTrip: 'ஒரு பயணத்திற்கான லாரி வாடகை',
    freightPerTripDesc: 'மொத்த லாரி வாடகை வகுத்தல் பயணங்களின் எண்ணிக்கை',
    otif: 'OTIF (சரியான நேரம் & முழு சரக்கு)',
    otifDesc: 'வெற்றிகரமான அனுப்புதல் வகுத்தல் மொத்த ஆர்டர்கள்',
    unpaidBills: 'வசூலாகாத பாக்கிகள்',
    unpaidBillsDesc: 'வழக்கமான கிரெடிட் நாட்களைத் தாண்டி வாடிக்கையாளர்களிடம் உள்ள தொகை',
    openProject: 'திட்டத்தைத் திறக்கவும்',
    thisWeekSheet: 'இந்த வார உள்ளீட்டு தாள் (மஞ்சள் கட்டங்கள்)',
    yellowCellsExplanation: 'ஆறு எண்களுக்குப் பின்னால் உள்ள எட்டு உள்ளீடுகள். நீங்கள் இவற்றை மட்டும் உள்ளிடவும்.',
    fleetMonitor: 'வாகன கண்காணிப்பு & வழித்தடம்',
    encryptedComms: 'தள மேற்பார்வையாளர் அரட்டை',
    erpSync: 'ERP & Tally ஒத்திசைவு',
    quarterlyReport: 'காலாண்டு பகுப்பாய்வு',
    retainerModel: 'மாதாந்திர கட்டண வழக்கம்',
    priceNote: 'மாதம் ₹5,000 – ₹8,000',
    cancelAnyMonth: 'எந்த மாதமும் ரத்து செய்யலாம். இது மென்பொருள் சந்தா அல்ல, வாராந்திர நிர்வாக வழக்கம்.',
    darkWarehouseMode: 'கிடங்கு இரவு முறை',
    dayMode: 'பகல் முறை',
    activeShipments: 'செயலில் உள்ள சரக்குகள்',
    liveStatus: 'நேரலை கண்காணிப்பு',
    offlineMode: 'ஆஃப்லைன் சேமிப்பு',
    onlineMode: 'இணைக்கப்பட்டது',
    searchFilter: 'தேடு & வடிகட்டு...',
    exportCsv: 'CSV ஏற்றுமதி',
    printNote: 'அச்சிடு / PDF சேமி',
  },
  hi: {
    appName: 'सोमवार कंट्रोल टॉवर',
    tagline: 'सुबह 9 बजे से पहले व्हाट्सएप पर छह नंबर। वही आदत जो आप बेचते हैं।',
    weekEnding: 'सप्ताह समाप्ति',
    before9am: 'सुबह 9:00 बजे से पहले भेजें',
    gateOpensWarning: '9 बजे के बाद वह शॉप फ्लोर पर होंगे और नोट का समय निकल जाएगा।',
    sixNumbersHeader: 'सोमवार के छह महत्वपूर्ण आंकड़े',
    sixNumbersSub: 'एक क्लाइंट के लिए एक ही टॉवर। फैक्ट्री गेट खुलने से पहले छह नंबर ही पढ़ें।',
    copyWhatsApp: 'व्हाट्सएप नोट कॉपी करें',
    copied: 'कॉपी हो गया!',
    openInWhatsApp: 'व्हाट्सएप पर भेजें',
    replyPrompt: 'आज जिसे खोलना चाहते हैं, उसका नंबर रिप्लाई करें।',
    deadCash: 'फंसा हुआ कैश (Dead Cash)',
    deadCashDesc: '180 दिनों से न बिके सामान में ब्लॉक हुए रुपये',
    stockoutRisk: 'स्टॉक खत्म होने का जोखिम',
    stockoutRiskDesc: 'दो सप्ताह से कम स्टॉक वाले महत्वपूर्ण SKU',
    ordersLate: 'देर से निकले ऑर्डर',
    ordersLateDesc: 'प्रॉमिस समय से चूकने वाले डिस्पैच',
    freightPerTrip: 'प्रति ट्रिप भाड़ा',
    freightPerTripDesc: 'कुल भाड़ा बिल भाग कुल ट्रिप्स',
    otif: 'OTIF (समय पर और पूरा सामान)',
    otifDesc: 'सफल डिस्पैच भाग कुल डिस्पैच',
    unpaidBills: 'बकाया बिल',
    unpaidBillsDesc: 'क्रेडिट दिनों के बाद भी ग्राहकों के पास रुका पैसा',
    openProject: 'प्रोजेक्ट खोलें',
    thisWeekSheet: 'इस सप्ताह की शीट (पीले इनपुट)',
    yellowCellsExplanation: 'छह पंक्तियों के पीछे आठ इनपुट। बस इन्हें भरें, गणना अपने आप होगी।',
    fleetMonitor: 'फ्लीट मॉनिटरिंग',
    encryptedComms: 'फ्लोर डिस्पैचर चैट',
    erpSync: 'ERP और Tally सिंक',
    quarterlyReport: 'त्रैमासिक रिपोर्ट',
    retainerModel: 'मासिक रिटेनर मॉडल',
    priceNote: '₹5,000 – ₹8,000 / महीना',
    cancelAnyMonth: 'किसी भी महीने कैंसिल करें। यह सॉफ्टवेयर नहीं, एक साप्ताहिक आदत है।',
    darkWarehouseMode: 'वेयरहाउस डार्क मोड',
    dayMode: 'डे मोड',
    activeShipments: 'सक्रिय वाहन',
    liveStatus: 'लाइव ट्रैकिंग',
    offlineMode: 'ऑफ़लाइन सक्रिय',
    onlineMode: 'कनेक्टेड',
    searchFilter: 'सर्च करें...',
    exportCsv: 'CSV एक्सपोर्ट',
    printNote: 'प्रिंट / PDF',
  },
  de: {
    appName: 'Montag Control Tower',
    tagline: 'Sechs Zahlen vor 9 Uhr morgens auf WhatsApp. Die Gewohnheit, die Sie verkaufen.',
    weekEnding: 'Woche endend am',
    before9am: 'Vor 9:00 Uhr senden',
    gateOpensWarning: 'Nach 9:00 Uhr ist er in der Werkshalle und die Nachricht ist verpufft.',
    sixNumbersHeader: 'Die Sechs Montags-Kennzahlen',
    sixNumbersSub: 'Ein Tower pro Kunde. Sechs ist das Limit, bevor sich das Werkstor öffnet.',
    copyWhatsApp: 'WhatsApp-Nachricht kopieren',
    copied: 'In die Zwischenablage kopiert!',
    openInWhatsApp: 'Auf WhatsApp senden',
    replyPrompt: 'Antworten Sie mit der Kennzahl, die heute geöffnet werden soll.',
    deadCash: 'Totes Kapital (Dead Cash)',
    deadCashDesc: 'Währungswert von Artikeln ohne Bewegung seit 180 Tagen',
    stockoutRisk: 'Lieferengpass-Risiko',
    stockoutRiskDesc: 'Wichtige A-Artikel mit weniger als 2 Wochen Reichweite',
    ordersLate: 'Verspätete Aufträge',
    ordersLateDesc: 'Lieferungen, die das zugesagte Zeitfenster verpasst haben',
    freightPerTrip: 'Frachtkosten pro Fahrt',
    freightPerTripDesc: 'Gesamte Frachtkosten geteilt durch Fahrten',
    otif: 'OTIF (Pünktlich & Vollständig)',
    otifDesc: 'Erfolgreiche Touren geteilt durch Gesamtauslieferungen',
    unpaidBills: 'Offene Forderungen',
    unpaidBillsDesc: 'Kundenaußenstände jenseits des regulären Zahlungsziels',
    openProject: 'Projekt öffnen',
    thisWeekSheet: 'Wochenarbeitsblatt (Gelbe Eingabefelder)',
    yellowCellsExplanation: 'Acht Eingabewerte hinter den sechs Zeilen.',
    fleetMonitor: 'Flottenüberwachung & Routen',
    encryptedComms: 'Dispatcher-Chat',
    erpSync: 'ERP & Tally Synchronisation',
    quarterlyReport: 'Quartalsbericht',
    retainerModel: 'Monatliches Retainer-Modell',
    priceNote: '5.000 – 8.000 ₹ / Monat',
    cancelAnyMonth: 'Monatlich kündbar. Keine Software-Lizenz, sondern eine Führungsroutine.',
    darkWarehouseMode: 'Lagerhaus Dunkelmodus',
    dayMode: 'Tagmodus',
    activeShipments: 'Aktive Touren',
    liveStatus: 'Live-Tracking',
    offlineMode: 'Offline-Cache aktiv',
    onlineMode: 'Verbunden',
    searchFilter: 'Suchen & filtern...',
    exportCsv: 'CSV exportieren',
    printNote: 'Drucken / PDF',
  },
  es: {
    appName: 'Torre de Control del Lunes',
    tagline: 'Seis números antes de las 9:00 por WhatsApp. El hábito que vendes.',
    weekEnding: 'Semana terminada el',
    before9am: 'Enviar antes de las 9:00 AM',
    gateOpensWarning: 'Después de las 9:00 él está en el taller y el mensaje se pierde.',
    sixNumbersHeader: 'Los Seis Números del Lunes',
    sixNumbersSub: 'Una torre es un cliente. Seis es el límite antes de que abra el portón.',
    copyWhatsApp: 'Copiar nota de WhatsApp',
    copied: '¡Copiado al portapapeles!',
    openInWhatsApp: 'Enviar por WhatsApp',
    replyPrompt: 'Responde con el número que deseas abrir hoy.',
    deadCash: 'Dinero Muerto (Dead Cash)',
    deadCashDesc: 'Rupias en artículos sin movimiento durante 180 días',
    stockoutRisk: 'Riesgo de Desabastecimiento',
    stockoutRiskDesc: 'SKUs críticos con menos de dos semanas de inventario',
    ordersLate: 'Envíos Retrasados',
    ordersLateDesc: 'Cargas que no cumplieron la hora prometida',
    freightPerTrip: 'Flete por Viaje',
    freightPerTripDesc: 'Flete total pagado dividido por viajes realizados',
    otif: 'OTIF (A tiempo y completo)',
    otifDesc: 'Envíos aprobados divididos por despachos totales',
    unpaidBills: 'Facturas por Cobrar',
    unpaidBillsDesc: 'Clientes con pagos vencidos más allá del crédito pactado',
    openProject: 'Abrir Proyecto',
    thisWeekSheet: 'Hoja de Esta Semana (Celdas Amarillas)',
    yellowCellsExplanation: 'Ocho entradas detrás de las seis líneas.',
    fleetMonitor: 'Radares de Flota y Rutas',
    encryptedComms: 'Chat de Despacho Encriptado',
    erpSync: 'Sincronización ERP y Tally',
    quarterlyReport: 'Reporte Trimestral',
    retainerModel: 'Modelo de Retainer Mensual',
    priceNote: '₹5,000 – ₹8,000 / mes',
    cancelAnyMonth: 'Cancela cualquier mes. No es un software, es un hábito ejecutivo semanal.',
    darkWarehouseMode: 'Modo Oscuro Almacén',
    dayMode: 'Modo Día',
    activeShipments: 'Envíos Activos',
    liveStatus: 'Monitoreo en Vivo',
    offlineMode: 'Caché Fuera de Línea',
    onlineMode: 'Conectado',
    searchFilter: 'Buscar y filtrar...',
    exportCsv: 'Exportar CSV',
    printNote: 'Imprimir / PDF',
  },
};
