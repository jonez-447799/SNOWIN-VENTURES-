import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Navigation, 
  Filter,
  Search,
  Compass,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { FleetVehicle, Language } from '../types';
import { SAMPLE_FLEET_VEHICLES } from '../data/sampleData';
import { TRANSLATIONS } from '../utils/translations';

interface FleetMonitorProps {
  language: Language;
  isDarkMode: boolean;
}

export const FleetMonitor: React.FC<FleetMonitorProps> = ({
  language,
  isDarkMode,
}) => {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>(SAMPLE_FLEET_VEHICLES);
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(SAMPLE_FLEET_VEHICLES[0]);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Delayed' | 'In Transit'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const t = TRANSLATIONS[language];

  const filtered = vehicles.filter((v) => {
    const matchesFilter = filterStatus === 'All' || v.status === filterStatus;
    const matchesQuery = 
      v.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.destination.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-500" />
            <span>{t.fleetMonitor} — Ambattur Industrial Corridors</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Real-time lane monitoring for Sriperumbudur, Oragadam, Ennore Port, and Hosur dispatches.
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search truck, driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                isDarkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
              }`}
            />
          </div>

          <div className={`flex items-center p-1 rounded-lg border text-xs ${
            isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-300'
          }`}>
            {(['All', 'Delayed', 'In Transit'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  filterStatus === status
                    ? isDarkMode
                      ? 'bg-neutral-800 text-amber-400 shadow-sm'
                      : 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vehicles List (Thumb-friendly mobile cards) */}
        <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map((v) => {
            const isSelected = selectedVehicle?.id === v.id;
            const isDelayed = v.status === 'Delayed';

            return (
              <div
                key={v.id}
                onClick={() => setSelectedVehicle(v)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? isDarkMode
                      ? 'border-amber-500 bg-amber-500/5 shadow-md'
                      : 'border-amber-500 bg-amber-50 shadow-md'
                    : isDarkMode
                      ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                      : 'bg-white border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Truck className={`w-4 h-4 ${isDelayed ? 'text-rose-400' : 'text-emerald-400'}`} />
                    <span className="font-mono font-bold text-xs sm:text-sm text-neutral-100">
                      {v.vehicleNo}
                    </span>
                  </div>
                  
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                    isDelayed 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {v.status}
                  </span>
                </div>

                <div className="text-xs text-neutral-300 font-medium mb-1 truncate">
                  {v.currentRoute}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mt-2 pt-2 border-t border-neutral-800">
                  <div>Driver: {v.driverName}</div>
                  <div className={isDelayed ? 'text-rose-400 font-bold' : 'text-neutral-400'}>
                    ETA: {v.eta} {isDelayed && `(+${v.delayMinutes}m)`}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${isDelayed ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${v.progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Route Telemetry & Interactive Visual Radar */}
        <div className={`lg:col-span-2 rounded-xl border p-4 sm:p-5 flex flex-col justify-between ${
          isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
        }`}>
          {selectedVehicle ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold font-mono text-neutral-100">
                      {selectedVehicle.vehicleNo}
                    </span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                      selectedVehicle.status === 'Delayed' 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {selectedVehicle.status}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {selectedVehicle.currentRoute}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedVehicle.driverPhone}`}
                    className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold flex items-center gap-1.5 text-neutral-200 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Call Driver</span>
                  </a>
                  <a
                    href={`https://wa.me/${selectedVehicle.driverPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold flex items-center gap-1.5 text-white transition-colors"
                  >
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Visual Corridor Radar Map Representation */}
              <div className={`rounded-xl p-4 sm:p-6 border relative overflow-hidden ${
                isDarkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-100 border-slate-300'
              }`}>
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-neutral-200">Origin: {selectedVehicle.origin}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-200">Dest: {selectedVehicle.destination}</span>
                    <MapPin className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>

                {/* Road Corridor Visual */}
                <div className="relative my-8">
                  <div className="h-3 w-full bg-neutral-800 rounded-full border border-neutral-700 relative overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${selectedVehicle.status === 'Delayed' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${selectedVehicle.progressPercent}%` }}
                    />
                  </div>

                  {/* Truck Marker Indicator */}
                  <div 
                    className="absolute -top-3.5 transform -translate-x-1/2 transition-all flex flex-col items-center"
                    style={{ left: `${selectedVehicle.progressPercent}%` }}
                  >
                    <div className="w-9 h-9 rounded-full bg-amber-500 border-2 border-neutral-950 flex items-center justify-center text-neutral-950 shadow-lg animate-bounce">
                      <Truck className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold mt-1 bg-neutral-900/90 text-amber-400 px-1.5 py-0.5 rounded border border-neutral-700">
                      {selectedVehicle.speedKmH} km/h
                    </span>
                  </div>
                </div>

                {/* Corridor Waypoints */}
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-3 border-t border-neutral-800">
                  <span>Ambattur Gate 1</span>
                  <span>Poonamallee Bypass</span>
                  <span>Koyambedu Toll</span>
                  <span>Sriperumbudur / Port</span>
                </div>
              </div>

              {/* Telemetry Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/50">
                  <div className="text-neutral-500 text-[10px]">CURRENT SPEED</div>
                  <div className="text-base font-bold text-neutral-200 mt-1">{selectedVehicle.speedKmH} km/h</div>
                </div>
                <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/50">
                  <div className="text-neutral-500 text-[10px]">PROMISED CLOCK</div>
                  <div className="text-base font-bold text-neutral-200 mt-1">{selectedVehicle.promisedEta}</div>
                </div>
                <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/50">
                  <div className="text-neutral-500 text-[10px]">ESTIMATED ARRIVAL</div>
                  <div className={`text-base font-bold mt-1 ${selectedVehicle.delayMinutes > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedVehicle.eta}
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/50">
                  <div className="text-neutral-500 text-[10px]">GPS TELEMETRY</div>
                  <div className="text-xs text-neutral-300 mt-1">{selectedVehicle.latitude.toFixed(4)}, {selectedVehicle.longitude.toFixed(4)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-neutral-500 text-xs">
              Select a vehicle to inspect live telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
