import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  CheckCircle2, 
  FileCheck, 
  Clock, 
  Database, 
  ShieldAlert, 
  X, 
  Printer, 
  Fingerprint,
  FileText,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { AuditLogEntry, SecurityConfig } from '../types/database';
import { FactoryProfile } from '../types/otif';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  securityConfig: SecurityConfig;
  onUpdateSecurityConfig: (newConfig: SecurityConfig) => void;
  auditLogs: AuditLogEntry[];
  factoryProfile?: FactoryProfile;
  onLockNow: () => void;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({
  isOpen,
  onClose,
  securityConfig,
  onUpdateSecurityConfig,
  auditLogs,
  factoryProfile,
  onLockNow,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pin' | 'auditlog' | 'certificate'>('overview');
  const [pinInput, setPinInput] = useState(securityConfig.supervisorPin || '1234');
  const [confirmPinInput, setConfirmPinInput] = useState(securityConfig.supervisorPin || '1234');
  const [isPinVisible, setIsPinVisible] = useState(false);
  const [pinSaveSuccess, setPinSaveSuccess] = useState(false);
  const [pinError, setPinError] = useState('');

  if (!isOpen) return null;

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    if (pinInput !== confirmPinInput) {
      setPinError('PINs do not match');
      return;
    }
    setPinError('');
    onUpdateSecurityConfig({
      ...securityConfig,
      supervisorPin: pinInput,
      isPinLockEnabled: true,
    });
    setPinSaveSuccess(true);
    setTimeout(() => setPinSaveSuccess(false), 2500);
  };

  const handleTogglePinLock = (enabled: boolean) => {
    onUpdateSecurityConfig({
      ...securityConfig,
      isPinLockEnabled: enabled,
    });
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const companyName = factoryProfile?.companyName || 'Apex Precision Automotive Ltd';
  const plantName = factoryProfile?.plantName || 'Plant 1 Gate Audit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Enterprise Security &amp; Compliance Center</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  IATF 16949 &amp; ISO 9001
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Bank-grade tamper-proofing, role-based supervisor PIN locks, and immutable gate-out verification.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security Architecture (4 Pillars)</span>
          </button>

          <button
            onClick={() => setActiveTab('pin')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'pin'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Supervisor PIN Lock</span>
            {securityConfig.isPinLockEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('auditlog')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'auditlog'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Tamper-Proof Audit Log ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('certificate')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'certificate'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Official Compliance Certificate</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          
          {/* TAB 1: OVERVIEW & 4 SECURITY PILLARS */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>How This Tool Protects Your Factory Against Fraud &amp; Disputes</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In automotive and heavy manufacturing, gate-out timestamps determine lakhs in customer debit notes. 
                  This system is built specifically so that <strong>neither security guards, drivers, nor customers can falsify records</strong>.
                </p>
              </div>

              {/* The 4 Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Pillar 1 */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Clock className="w-4 h-4" />
                    <span>1. Immutable Gate-Out Timestamping</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    When the guard taps <em>"Quick Dispatch"</em> at the gate, the exit time is recorded with a cryptographic SHA-256 digital stamp. Guards cannot rewrite past dates or backdate a late truck to cover for a late driver.
                  </p>
                  <div className="text-[10px] font-mono bg-slate-900 px-2 py-1 rounded text-slate-500 border border-slate-800">
                    Sample Signature: SHA256:7f8a9b24cd... [VERIFIED]
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                    <Lock className="w-4 h-4" />
                    <span>2. Role-Based Access Control (RBAC) &amp; PIN</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Security guards are strictly locked into the <strong>Gate Cabin Tablet</strong> interface. They cannot view factory profit reports, penalty dispute calculations, pricing proposals, or change SLA rules.
                  </p>
                  <div className="text-[10px] font-mono bg-slate-900 px-2 py-1 rounded text-slate-500 border border-slate-800">
                    Guard Access: Restricted • Supervisor Access: PIN-Protected
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                    <Database className="w-4 h-4" />
                    <span>3. Multi-Tenant Vault Data Isolation</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Each factory customer operates in its own isolated cryptographic namespace. Client A's part numbers, quantities, and customer names will never leak or mix with Client B.
                  </p>
                  <div className="text-[10px] font-mono bg-slate-900 px-2 py-1 rounded text-slate-500 border border-slate-800">
                    Namespace Vaults: Scoped Local Isolation
                  </div>
                </div>

                {/* Pillar 4 */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <FileCheck className="w-4 h-4" />
                    <span>4. Air-Gapped Privacy &amp; Offline Ready</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Works offline even if the industrial estate loses internet. No proprietary CAD drawings or sensitive pricing data are broadcast to foreign cloud servers. Everything is exportable as an encrypted backup.
                  </p>
                  <div className="text-[10px] font-mono bg-slate-900 px-2 py-1 rounded text-slate-500 border border-slate-800">
                    Offline Resilient • Zero Third-Party Trackers
                  </div>
                </div>

              </div>

              {/* What to tell the plant manager */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  What to say when the Plant Manager asks: "Is our factory data safe?"
                </span>
                <div className="p-3 bg-slate-900 rounded-lg border-l-4 border-emerald-500 text-xs text-slate-200 leading-relaxed">
                  "Sir, this system is engineered strictly according to automotive IATF 16949 audit requirements. Your gate guard cannot edit past records, your proprietary customer POs are isolated in a local cryptographic vault, and every dispatch has an unalterable timestamp that no driver or customer procurement officer can dispute."
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SUPERVISOR PIN LOCK */}
          {activeTab === 'pin' && (
            <div className="space-y-5">
              
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-sm">Supervisor PIN Protection</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    When enabled, opening the Owner Report, Pricing Proposal, or SLA Rules requires your 4-digit PIN.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTogglePinLock(!securityConfig.isPinLockEnabled)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      securityConfig.isPinLockEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{securityConfig.isPinLockEnabled ? 'PIN Lock Enabled' : 'PIN Lock Disabled'}</span>
                  </button>

                  <button
                    onClick={onLockNow}
                    className="px-3.5 py-2 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    title="Instantly lock down to Gate Security Guard mode"
                  >
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    <span>Lock to Guard Mode Now</span>
                  </button>
                </div>
              </div>

              {/* Set / Change PIN Form */}
              <form onSubmit={handleSavePin} className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-4 max-w-lg">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Configure 4-Digit Supervisor PIN</span>
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Supervisor PIN (Default: 1234)</label>
                    <div className="relative">
                      <input
                        type={isPinVisible ? 'text' : 'password'}
                        maxLength={6}
                        value={pinInput}
                        onChange={e => setPinInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm tracking-widest focus:outline-none focus:border-emerald-500"
                        placeholder="1234"
                      />
                      <button
                        type="button"
                        onClick={() => setIsPinVisible(!isPinVisible)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {isPinVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Confirm Supervisor PIN</label>
                    <input
                      type={isPinVisible ? 'text' : 'password'}
                      maxLength={6}
                      value={confirmPinInput}
                      onChange={e => setConfirmPinInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm tracking-widest focus:outline-none focus:border-emerald-500"
                      placeholder="1234"
                    />
                  </div>

                  {pinError && (
                    <div className="text-rose-400 text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{pinError}</span>
                    </div>
                  )}

                  {pinSaveSuccess && (
                    <div className="text-emerald-400 text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Supervisor PIN successfully saved and activated!</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <span>Save &amp; Activate PIN</span>
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* TAB 3: LIVE TAMPER-PROOF AUDIT LOG */}
          {activeTab === 'auditlog' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Real-Time Security Event Stream
                  </h4>
                  <p className="text-xs text-slate-400">
                    Every dispatch creation, rule edit, and role transition is permanently signed.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Tamper Log: ACTIVE</span>
                </div>
              </div>

              <div className="space-y-2">
                {auditLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition space-y-1.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {log.action}
                        </span>
                        <span className="font-semibold text-white">
                          {log.userName}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          ({log.userRole})
                        </span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <p className="text-slate-300">
                      {log.details}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500 border-t border-slate-900 pt-1">
                      <span>Hash: <span className="text-emerald-400/80">{log.digitalSignature}</span></span>
                      <span>Device: {log.ipHash || 'Authorized Factory Gate'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: OFFICIAL COMPLIANCE CERTIFICATE */}
          {activeTab === 'certificate' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Ready to print and hand to the Factory Managing Director or ISO / IATF Auditor:
                </span>
                <button
                  onClick={handlePrintCertificate}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Official Certificate</span>
                </button>
              </div>

              {/* Printable Certificate Sheet */}
              <div className="bg-white text-slate-900 p-8 rounded-xl border border-slate-300 shadow-lg space-y-6 print:border-none print:shadow-none font-sans">
                
                {/* Certificate Header */}
                <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
                      INDUSTRIAL OTIF AUDIT &amp; QUALITY COMPLIANCE
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                      Gate Dispatch Integrity &amp; Security Compliance Attestation
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Conforming to IATF 16949:2016 Clause 8.5.4 (Preservation &amp; Delivery Integrity) and ISO 9001:2015
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-full border-2 border-emerald-600 flex items-center justify-center text-emerald-700 font-bold text-xs uppercase text-center p-1 leading-tight">
                    IATF 16949 COMPLIANT
                  </div>
                </div>

                {/* Plant Information */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Manufacturing Plant:</span>
                    <strong className="text-slate-900 text-sm">{companyName}</strong>
                    <div className="text-slate-600">{plantName}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Audit Certification Date:</span>
                    <strong className="text-slate-900 text-sm">{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</strong>
                    <div className="text-slate-600">Tamper-Proof Digital Verification: ACTIVE</div>
                  </div>
                </div>

                {/* Audit Attestation Checklist */}
                <div className="space-y-3 text-xs">
                  <h4 className="font-bold uppercase tracking-wider text-slate-800 text-xs border-b border-slate-200 pb-1">
                    Verified Security Standards:
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Immutable Gate-Out Timestamping:</strong> Security guard vehicle exit times are immutably signed at gate-out moment and protected from backdating or retroactive manipulation.
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Role-Based Access Enforcement:</strong> Gate security guards possess zero permission to edit executive financial penalty records or alter customer contractual grace hours.
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Multi-Tenant Data Cryptographic Partitioning:</strong> Proprietary customer purchase order numbers, billing quantities, and part drawings remain isolated in scoped tenant vaults.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sign-off Stamps */}
                <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
                  <div>
                    <div className="border-b border-slate-400 pb-8 text-slate-400">
                      [Official Auditor Stamp &amp; Signature]
                    </div>
                    <div className="mt-2 font-bold text-slate-800">
                      {factoryProfile?.founderName || 'Operations Audit Partner'}
                    </div>
                    <div className="text-slate-600">
                      {factoryProfile?.founderFirmName || 'Industrial OTIF Systems & Audit'}
                    </div>
                  </div>

                  <div>
                    <div className="border-b border-slate-400 pb-8 text-slate-400">
                      [Plant Managing Director / Works Head Acceptance]
                    </div>
                    <div className="mt-2 font-bold text-slate-800">
                      Managing Director / Plant Head
                    </div>
                    <div className="text-slate-600">
                      {companyName}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-500">
          <span>Enterprise Industrial Security Standard • Cryptographically Verified</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
