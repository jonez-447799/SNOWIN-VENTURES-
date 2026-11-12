import React, { useState } from 'react';
import { 
  FileText, 
  Smartphone, 
  Camera, 
  UploadCloud, 
  Check, 
  ArrowRight, 
  Sparkles, 
  AlertCircle,
  FileSpreadsheet,
  Download,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { Trip } from '../types/freight';
import { SAMPLE_OCR_TEMPLATES } from '../data/defaultData';
import { formatINR } from '../utils/auditCalculations';

interface SmartIngestionViewProps {
  onAddTrip: (trip: Trip) => void;
  onNavigateToTrips: () => void;
}

export const SmartIngestionView: React.FC<SmartIngestionViewProps> = ({
  onAddTrip,
  onNavigateToTrips
}) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'csv' | 'paste'>('whatsapp');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof SAMPLE_OCR_TEMPLATES[0] | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importedSuccessMsg, setImportedSuccessMsg] = useState<string | null>(null);
  const [pasteContent, setPasteContent] = useState<string>('');

  const handleSimulateOCR = (template: typeof SAMPLE_OCR_TEMPLATES[0]) => {
    setIsProcessing(true);
    setSelectedTemplate(template);
    setTimeout(() => {
      setIsProcessing(false);
    }, 600);
  };

  const handleCommitScannedTrip = () => {
    if (!selectedTemplate) return;

    const newTrip: Trip = {
      id: `TRIP-${Date.now().toString().slice(-4)}`,
      date: selectedTemplate.date,
      lane: selectedTemplate.lane,
      km: selectedTemplate.km,
      transporter: selectedTemplate.transporter,
      weightKg: selectedTemplate.weightKg,
      bill: selectedTemplate.bill,
      waitHours: selectedTemplate.waitHours,
      split: selectedTemplate.split,
      emptyReturn: selectedTemplate.emptyReturn,
      notes: `Extracted via OCR from ${selectedTemplate.name}`,
      sourceDoc: selectedTemplate.id
    };

    onAddTrip(newTrip);
    setImportedSuccessMsg(`Successfully imported bill from ${selectedTemplate.transporter} (${formatINR(selectedTemplate.bill)}) into audit ledger!`);
    setTimeout(() => {
      setImportedSuccessMsg(null);
    }, 4000);
  };

  const handlePasteProcess = () => {
    if (!pasteContent.trim()) return;

    const lines = pasteContent.trim().split('\n');
    let addedCount = 0;

    lines.forEach((line) => {
      // Split by tab or comma
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      if (parts.length >= 6) {
        // format: Date, Lane, Transporter, Weight, Bill, WaitHours
        const date = parts[0].trim() || '2026-10-01';
        const lane = parts[1].trim() || 'Ambattur to Oragadam';
        const transporter = parts[2].trim() || 'Murugan';
        const weightKg = Number(parts[3].replace(/[^0-9.]/g, '')) || 2500;
        const bill = Number(parts[4].replace(/[^0-9.]/g, '')) || 4000;
        const waitHours = Number(parts[5].replace(/[^0-9.]/g, '')) || 1.0;

        const newTrip: Trip = {
          id: `PASTE-${Date.now().toString().slice(-4)}-${addedCount}`,
          date,
          lane,
          km: 40,
          transporter,
          weightKg,
          bill,
          waitHours,
          split: 'No',
          emptyReturn: 'Yes',
          notes: 'Batch pasted entry'
        };

        onAddTrip(newTrip);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setImportedSuccessMsg(`Successfully batch imported ${addedCount} rows from pasted text!`);
      setPasteContent('');
    } else {
      alert('Could not parse text. Ensure format is: Date, Lane, Transporter, Weight, Bill, WaitHours (comma or tab separated).');
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Top Banner: Solving the Data Entry Trap */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="max-w-3xl space-y-2">
          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
            Solving Hardest Truth #2: The Data Entry Trap
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Smart Ingestion: WhatsApp OCR & Batch Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Factory owners and dispatch clerks will never manually type 100 messy bills every month. 
            This ingestion pipeline allows security guards to snap a photo on WhatsApp or upload paper scans, automatically extracting bills and gate hours with zero manual typing.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'whatsapp'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp Lorry Receipt OCR Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'paste'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Quick-Paste from Excel Ledger</span>
          </button>
        </div>
      </div>

      {importedSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold">{importedSuccessMsg}</span>
          </div>
          <button 
            onClick={onNavigateToTrips}
            className="text-emerald-950 font-bold underline hover:text-emerald-800"
          >
            Open Trips Sheet &rarr;
          </button>
        </div>
      )}

      {/* Tab 1: WhatsApp OCR Simulation */}
      {activeTab === 'whatsapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Simulated Phone Interface */}
          <div className="lg:col-span-5 bg-slate-900 text-white rounded-xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
                  WA
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Ambattur Gate Audit Bot</h3>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400">+91 94440 28190</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              How it works on site: Security guard snaps photo of handwritten lorry receipt or gate pass when truck leaves gate.
            </p>

            {/* Clickable Sample OCR Documents */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Click a sample document to simulate guard upload:
              </span>

              {SAMPLE_OCR_TEMPLATES.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSimulateOCR(doc)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedTemplate?.id === doc.id
                      ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-xs'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="font-semibold text-white flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      {doc.name}
                    </strong>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                      Confidence {doc.confidence}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 mt-1 line-clamp-1">
                    {doc.sampleSnippet}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Parsed Document Extraction Result */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  Extracted Bill & Gate Data
                </h3>
                {selectedTemplate && (
                  <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                    Ready for Ingestion
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Parsed by serverless OCR model directly from scanned physical paperwork.
              </p>
            </div>

            {selectedTemplate ? (
              <div className="space-y-4">
                {/* Extracted Fields Table */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Departure Date</span>
                      <strong className="font-mono text-slate-900">{selectedTemplate.date}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Lane (Route)</span>
                      <strong className="text-slate-900">{selectedTemplate.lane}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Transporter</span>
                      <strong className="text-slate-900">{selectedTemplate.transporter}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Weight (kg)</span>
                      <strong className="font-mono text-slate-900">{selectedTemplate.weightKg.toLocaleString()} kg</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Bill Paid</span>
                      <strong className="font-mono text-slate-900 font-bold">{formatINR(selectedTemplate.bill)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Gate Wait Time</span>
                      <strong className="font-mono text-slate-900">{selectedTemplate.waitHours} hrs</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-600">
                    Raw Document Text: <span className="text-slate-800 italic">"{selectedTemplate.sampleSnippet}"</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">
                    Extracted from photo: <strong>{selectedTemplate.id}</strong>
                  </span>
                  <button
                    onClick={handleCommitScannedTrip}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Commit Bill to Audit Ledger</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-10 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  Select any sample document on the left to simulate automated OCR extraction.
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Demonstrates how real handwritten challans and gate records are ingested without data entry friction.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Quick-Paste from Excel */}
      {activeTab === 'paste' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Paste Direct from Microsoft Excel or Google Sheets
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Copy rows from your accountant's spreadsheet and paste below. Expected order: Date, Lane, Transporter, Weight, Bill, WaitHours.
            </p>
          </div>

          <textarea
            rows={5}
            placeholder={`2026-10-02\tAmbattur to Oragadam\tMurugan\t2800\t4200\t0.5\n2026-10-04\tAmbattur to Sriperumbudur\tSiva Transport\t3000\t6100\t3.5`}
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            className="w-full font-mono text-xs p-3 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:outline-none"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Accepts tab-separated (from Excel copy-paste) or comma-separated values.
            </span>
            <button
              onClick={handlePasteProcess}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Parse & Append Rows
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
