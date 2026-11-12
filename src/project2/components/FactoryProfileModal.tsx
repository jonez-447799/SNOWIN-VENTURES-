import React, { useState } from 'react';
import { Building2, Check, X, Sparkles, MapPin, Layers, Phone, Mail, Award, CreditCard, ChevronRight } from 'lucide-react';
import { FactoryProfile, RulesConfig } from '../types/otif';
import { INDUSTRY_PRESETS } from '../data/initialData';

interface FactoryProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: RulesConfig;
  onUpdateRules: (newRules: RulesConfig) => void;
}

export const FactoryProfileModal: React.FC<FactoryProfileModalProps> = ({
  isOpen,
  onClose,
  rules,
  onUpdateRules,
}) => {
  const currentProfile = rules.factoryProfile || INDUSTRY_PRESETS[0].profile;

  const [formData, setFormData] = useState<FactoryProfile>({
    ...currentProfile,
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'presets' | 'pricing'>('profile');
  const [saveToast, setSaveToast] = useState(false);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof INDUSTRY_PRESETS[0]) => {
    setFormData({
      ...preset.profile,
    });
    onUpdateRules({
      ...rules,
      factoryProfile: preset.profile,
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleSave = () => {
    onUpdateRules({
      ...rules,
      factoryProfile: formData,
    });
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Factory Profile &amp; Multi-Plant White-Labeling</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {formData.planTier} Tier
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                White-label this software for any manufacturing factory, plant location, or industrial sector.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-950 flex gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Plant Profile &amp; Branding
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Industry Presets</span>
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pricing'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Commercial Pricing &amp; Plans</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {saveToast && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-xs font-mono font-bold text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Factory branding updated successfully across all dashboards!</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Company / Enterprise Name:</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-400 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Division / Plant Name:</label>
                  <input
                    type="text"
                    value={formData.plantName}
                    onChange={e => setFormData({ ...formData, plantName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-400 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>Industrial Cluster / City:</span>
                  </label>
                  <input
                    type="text"
                    value={formData.clusterLocation}
                    onChange={e => setFormData({ ...formData, clusterLocation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-400 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Manufacturing Industry Sector:</span>
                  </label>
                  <select
                    value={formData.industryType}
                    onChange={e => setFormData({ ...formData, industryType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-400 focus:outline-none font-medium"
                  >
                    <option value="Automotive">Automotive OEM Tier-1/Tier-2</option>
                    <option value="Heavy Engineering">Heavy Engineering &amp; Machinery</option>
                    <option value="FMCG Packaging">FMCG &amp; Corrugated Packaging</option>
                    <option value="Pharma & Chemicals">Pharmaceuticals &amp; Chemicals</option>
                    <option value="General Precision">Precision Aerospace &amp; CNC Machining</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Plant Head WhatsApp (For Alert Digests):</span>
                  </label>
                  <input
                    type="text"
                    value={formData.managerPhone}
                    onChange={e => setFormData({ ...formData, managerPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>Operations Email:</span>
                  </label>
                  <input
                    type="email"
                    value={formData.managerEmail}
                    onChange={e => setFormData({ ...formData, managerEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Pitching to a new manufacturing client? Select an industry below to instantly populate realistic company branding, locations, and OEM accounts for your sales meeting.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INDUSTRY_PRESETS.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleApplyPreset(p)}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-amber-500/60 transition cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                        {p.name}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                    </div>
                    <div className="text-sm font-semibold text-white">{p.profile.companyName}</div>
                    <div className="text-xs text-slate-400">{p.profile.plantName} • {p.profile.clusterLocation}</div>
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                      {p.sampleCustomers.map((cust, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                          {cust}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs text-slate-400">
                  Commercial B2B SaaS licensing tiers to pitch to plant directors and CFOs:
                </p>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500">Quick Presets:</span>
                  <button
                    onClick={() => setFormData({ ...formData, monthlyPriceStarter: 1999, monthlyPricePro: 3999, monthlyPriceEnterprise: 7999 })}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
                  >
                    Budget (₹3.9k)
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, monthlyPriceStarter: 2999, monthlyPricePro: 4999, monthlyPriceEnterprise: 9999 })}
                    className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold cursor-pointer"
                  >
                    Sweet Spot (₹4.9k)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Starter */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  formData.planTier === 'Starter'
                    ? 'border-blue-500 bg-blue-950/20'
                    : 'border-slate-800 bg-slate-950'
                }`}>
                  <div>
                    <span className="text-xs font-bold text-blue-400 uppercase">Starter Plant</span>
                    <div className="text-2xl font-black text-white mt-1">
                      ₹{(formData.monthlyPriceStarter ?? 2999).toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">/mo</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Single Plant • 3 Users</div>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <li>✓ Gate Register Engine</li>
                      <li>✓ 30-Day OTIF Sparkline</li>
                      <li>✓ CSV &amp; PDF Boardroom Export</li>
                      <li className="text-slate-500">✗ Automated WhatsApp Digests</li>
                    </ul>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono">
                      <span className="text-slate-500">Edit: ₹</span>
                      <input
                        type="number"
                        step="500"
                        value={formData.monthlyPriceStarter ?? 2999}
                        onChange={e => setFormData({ ...formData, monthlyPriceStarter: Number(e.target.value) })}
                        className="w-full bg-transparent text-white font-bold focus:outline-none"
                        title="Set Starter Monthly Price"
                      />
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, planTier: 'Starter' })}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Select Starter
                    </button>
                  </div>
                </div>

                {/* Pro Industrial */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between relative ring-1 ring-amber-500/30 ${
                  formData.planTier === 'Pro Industrial'
                    ? 'border-amber-500 bg-amber-950/20'
                    : 'border-slate-800 bg-slate-950'
                }`}>
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full uppercase">
                    Most Popular
                  </span>
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase">Pro Industrial</span>
                    <div className="text-2xl font-black text-white mt-1">
                      ₹{(formData.monthlyPricePro ?? 4999).toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">/mo</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Up to 3 Plants • Unlimited Users</div>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <li>✓ Everything in Starter</li>
                      <li>✓ Security Cabin Tablet View</li>
                      <li>✓ Automated 8 PM WhatsApp Digest</li>
                      <li>✓ Excel Drag-and-Drop Ingestion</li>
                      <li>✓ Custom SLA Critical Alerts</li>
                    </ul>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-amber-500/50 rounded-lg px-2 py-1 text-xs font-mono">
                      <span className="text-amber-400">Edit: ₹</span>
                      <input
                        type="number"
                        step="500"
                        value={formData.monthlyPricePro ?? 4999}
                        onChange={e => setFormData({ ...formData, monthlyPricePro: Number(e.target.value) })}
                        className="w-full bg-transparent text-amber-300 font-bold focus:outline-none"
                        title="Set Pro Monthly Price"
                      />
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, planTier: 'Pro Industrial' })}
                      className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Select Pro Industrial
                    </button>
                  </div>
                </div>

                {/* Enterprise */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  formData.planTier === 'Enterprise'
                    ? 'border-emerald-500 bg-emerald-950/20'
                    : 'border-slate-800 bg-slate-950'
                }`}>
                  <div>
                    <span className="text-xs font-bold text-emerald-400 uppercase">Enterprise ERP</span>
                    <div className="text-2xl font-black text-white mt-1">
                      ₹{(formData.monthlyPriceEnterprise ?? 9999).toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">/mo</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Multi-Plant Group • ERP API Sync</div>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <li>✓ Everything in Pro</li>
                      <li>✓ SAP / Tally Direct API Connector</li>
                      <li>✓ Multi-Tenant Headquarter Rollup</li>
                      <li>✓ Dedicated SLA Audit Support</li>
                    </ul>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono">
                      <span className="text-slate-500">Edit: ₹</span>
                      <input
                        type="number"
                        step="1000"
                        value={formData.monthlyPriceEnterprise ?? 9999}
                        onChange={e => setFormData({ ...formData, monthlyPriceEnterprise: Number(e.target.value) })}
                        className="w-full bg-transparent text-white font-bold focus:outline-none"
                        title="Set Enterprise Monthly Price"
                      />
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, planTier: 'Enterprise' })}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Select Enterprise
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Check className="w-4 h-4" />
            <span>Apply Factory Branding</span>
          </button>
        </div>
      </div>
    </div>
  );
};
