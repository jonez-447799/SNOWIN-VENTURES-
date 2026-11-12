import React, { useState, useEffect, useMemo } from 'react';
import { Header, AppTab } from './components/Header';
import { OwnerReportView } from './components/OwnerReportView';
import { TripsSheetView } from './components/TripsSheetView';
import { LaneAnalysisView } from './components/LaneAnalysisView';
import { CarrierScorecardView } from './components/CarrierScorecardView';
import { PrintDossier } from './components/PrintDossier';
import { RulesModal } from './components/RulesModal';
import { AddTripModal } from './components/AddTripModal';
import { AlertsBanner } from './components/AlertsBanner';
import { SmartIngestionView } from './components/SmartIngestionView';
import { GainShareProposalView } from './components/GainShareProposalView';
import { CommercialMonetizationView } from './components/CommercialMonetizationView';
import { TransporterObjectionView } from './components/TransporterObjectionView';
import { BatchReconcilerView } from './components/BatchReconcilerView';
import { ProfitProtectionEngineV2 } from './components/ProfitProtectionEngineV2';
import { INITIAL_TRIPS, DEFAULT_RULES, SCALE_PROFILES } from './data/defaultData';
import { calculateAuditMetrics } from './utils/auditCalculations';
import { Trip, RulesConfig, ScaleProfile } from './types/freight';
import {
  PlantId,
  getActivePlantIdFromStorage,
  readPlantDatasetFromBrowser,
  writePlantDatasetToBrowser,
} from '../data/multiPlantBaselines';

export default function App() {
  const [activePlantId, setActivePlantId] = useState<PlantId>(() => getActivePlantIdFromStorage());

  // Load from plant-isolated localStorage or active plant baseline
  const [trips, setTrips] = useState<Trip[]>(() => {
    return readPlantDatasetFromBrowser(getActivePlantIdFromStorage()).p3Trips || INITIAL_TRIPS;
  });

  const [rules, setRules] = useState<RulesConfig>(() => {
    return readPlantDatasetFromBrowser(getActivePlantIdFromStorage()).p3Rules || DEFAULT_RULES;
  });

  // Listen for plant changes in storage
  useEffect(() => {
    const handleStorage = () => {
      const currentPlant = getActivePlantIdFromStorage();
      if (currentPlant !== activePlantId) {
        setActivePlantId(currentPlant);
        const ds = readPlantDatasetFromBrowser(currentPlant);
        setTrips(ds.p3Trips);
        setRules(ds.p3Rules);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [activePlantId]);

  // Client Spend Scale Tier (Solving Hardest Truth #3)
  const [currentScale, setCurrentScale] = useState<ScaleProfile>(() => {
    try {
      const saved = localStorage.getItem('freight_audit_scale_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = SCALE_PROFILES.find(p => p.id === parsed.id);
        if (match) return match;
      }
    } catch (e) {
      console.warn('Failed to parse saved scale', e);
    }
    return SCALE_PROFILES[0];
  });

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<AppTab>('report');
  
  // Modals state
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isAddTripOpen, setIsAddTripOpen] = useState<boolean>(false);

  // Drilldown filters for Trips Sheet
  const [tripsLaneFilter, setTripsLaneFilter] = useState<string>('ALL');
  const [tripsTransporterFilter, setTripsTransporterFilter] = useState<string>('ALL');

  // Save to plant-isolated localStorage when state changes
  useEffect(() => {
    try {
      writePlantDatasetToBrowser(activePlantId, { p3Trips: trips });
    } catch (e) {
      console.warn('Failed to save trips', e);
    }
  }, [trips, activePlantId]);

  useEffect(() => {
    try {
      writePlantDatasetToBrowser(activePlantId, { p3Rules: rules });
    } catch (e) {
      console.warn('Failed to save rules', e);
    }
  }, [rules, activePlantId]);

  useEffect(() => {
    try {
      localStorage.setItem('freight_audit_scale_v1', JSON.stringify(currentScale));
    } catch (e) {
      console.warn('Failed to save scale', e);
    }
  }, [currentScale]);

  // Compute all metrics dynamically
  const auditMetrics = useMemo(() => {
    return calculateAuditMetrics(trips, rules);
  }, [trips, rules]);

  // Handlers for modifying trips
  const handleUpdateTrip = (updatedTrip: Trip) => {
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
  };

  const handleDeleteTrip = (id: string) => {
    if (confirm('Are you sure you want to remove this lorry bill record?')) {
      setTrips(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleAddTrip = (newTrip: Trip) => {
    setTrips(prev => [newTrip, ...prev]);
    if (newTrip.date) {
      setRules(prev => {
        const nextStart = prev.startDate && newTrip.date < prev.startDate ? newTrip.date : prev.startDate;
        const nextEnd = prev.endDate && newTrip.date > prev.endDate ? newTrip.date : prev.endDate;
        if (nextStart !== prev.startDate || nextEnd !== prev.endDate) {
          return { ...prev, startDate: nextStart, endDate: nextEnd };
        }
        return prev;
      });
    }
  };

  const handleResetData = () => {
    if (confirm('Reset to the sample Ambattur September 2026 dataset?')) {
      setTrips(INITIAL_TRIPS);
      setRules(DEFAULT_RULES);
      setCurrentScale(SCALE_PROFILES[0]);
      setTripsLaneFilter('ALL');
      setTripsTransporterFilter('ALL');
      localStorage.removeItem('freight_audit_trips_v1');
      localStorage.removeItem('freight_audit_rules_v1');
      localStorage.removeItem('freight_audit_scale_v1');
    }
  };

  const handleNavigateToTrips = (filter?: { lane?: string; transporter?: string }) => {
    if (filter?.lane) setTripsLaneFilter(filter.lane);
    if (filter?.transporter) setTripsTransporterFilter(filter.transporter);
    setActiveTab('trips');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Lane',
      'Km',
      'Transporter',
      'Weight_kg',
      'Bill_INR',
      'Wait_Hours',
      'Empty_Return',
      'Split_Load',
      'Rate_Per_Tonne',
      'Best_Lane_Rate',
      'Rate_Leak_INR',
      'Detention_INR',
      'Total_Leak_INR',
      'Notes'
    ];

    const rows = auditMetrics.calculatedTrips.map(t => [
      `"${t.date}"`,
      `"${t.lane}"`,
      t.km,
      `"${t.transporter}"`,
      t.weightKg,
      t.bill,
      t.waitHours,
      `"${t.emptyReturn}"`,
      `"${t.split}"`,
      Math.round(t.ratePerTonne),
      Math.round(t.bestRate),
      t.rateLeak,
      t.detention,
      t.totalLeak,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Freight_Leak_Audit_Ambattur_${rules.startDate}_${rules.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const existingLanes = useMemo(() => {
    return Array.from(new Set(trips.map(t => t.lane)));
  }, [trips]);

  const existingTransporters = useMemo(() => {
    return Array.from(new Set(trips.map(t => t.transporter)));
  }, [trips]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Header adhering to Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        rules={rules}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenAddTrip={() => setIsAddTripOpen(true)}
        onResetData={handleResetData}
        onExportCSV={handleExportCSV}
        alertCount={auditMetrics.alerts.length}
      />

      {/* Automated Anomaly & Delay Banner */}
      {activeTab !== 'dossier' && (
        <AlertsBanner
          alerts={auditMetrics.alerts}
          onSelectTrip={(tripId) => {
            const trip = trips.find(t => t.id === tripId);
            if (trip) {
              setTripsLaneFilter(trip.lane);
              setActiveTab('trips');
            }
          }}
        />
      )}

      {/* Main Viewport Content */}
      <main className="flex-1">
        {activeTab === 'report' && (
          <>
            <OwnerReportView
              totals={auditMetrics.totals}
              laneSummaries={auditMetrics.laneSummaries}
              transporterSummaries={auditMetrics.transporterSummaries}
              trips={auditMetrics.calculatedTrips}
              rules={rules}
              currentScale={currentScale}
              onChangeScale={setCurrentScale}
              onNavigateToTrips={handleNavigateToTrips}
              onNavigateToDossier={() => setActiveTab('dossier')}
              onNavigateToProposal={() => setActiveTab('proposal')}
              onNavigateToIngestion={() => setActiveTab('reconcile')}
              onNavigateToObjections={() => setActiveTab('objections')}
            />
            <ProfitProtectionEngineV2
              trips={auditMetrics.calculatedTrips}
              laneSummaries={auditMetrics.laneSummaries}
              transporterSummaries={auditMetrics.transporterSummaries}
              totalFreightPaid={auditMetrics.totals.freightPaid}
              totalLeakFound={auditMetrics.totals.totalLeak}
            />
          </>
        )}

        {activeTab === 'trips' && (
          <TripsSheetView
            trips={auditMetrics.calculatedTrips}
            rules={rules}
            onUpdateTrip={handleUpdateTrip}
            onDeleteTrip={handleDeleteTrip}
            onOpenAddTrip={() => setIsAddTripOpen(true)}
            onResetData={handleResetData}
            onExportCSV={handleExportCSV}
            initialLaneFilter={tripsLaneFilter}
            initialTransporterFilter={tripsTransporterFilter}
          />
        )}

        {activeTab === 'ingest' && (
          <SmartIngestionView
            onAddTrip={handleAddTrip}
            onNavigateToTrips={() => setActiveTab('trips')}
          />
        )}

        {activeTab === 'proposal' && (
          <CommercialMonetizationView
            totals={auditMetrics.totals}
            currentScale={currentScale}
            onChangeScale={setCurrentScale}
            rules={rules}
            trips={auditMetrics.calculatedTrips}
            onNavigateToObjections={() => setActiveTab('objections')}
            onNavigateToReconciler={() => setActiveTab('reconcile')}
          />
        )}

        {activeTab === 'objections' && (
          <TransporterObjectionView
            trips={auditMetrics.calculatedTrips}
            rules={rules}
            onNavigateToTrips={handleNavigateToTrips}
          />
        )}

        {activeTab === 'reconcile' && (
          <BatchReconcilerView
            onAddTrip={handleAddTrip}
            rules={rules}
            onNavigateToTrips={() => setActiveTab('trips')}
            existingLanes={existingLanes}
            existingTransporters={existingTransporters}
          />
        )}

        {activeTab === 'lanes' && (
          <LaneAnalysisView
            laneSummaries={auditMetrics.laneSummaries}
            trips={auditMetrics.calculatedTrips}
            onNavigateToTrips={handleNavigateToTrips}
          />
        )}

        {activeTab === 'carriers' && (
          <CarrierScorecardView
            transporters={auditMetrics.transporterSummaries}
            trips={auditMetrics.calculatedTrips}
            rules={rules}
            onNavigateToTrips={handleNavigateToTrips}
          />
        )}

        {activeTab === 'dossier' && (
          <PrintDossier
            totals={auditMetrics.totals}
            laneSummaries={auditMetrics.laneSummaries}
            transporterSummaries={auditMetrics.transporterSummaries}
            trips={auditMetrics.calculatedTrips}
            rules={rules}
            onBack={() => setActiveTab('report')}
            onExportCSV={handleExportCSV}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Freight Leak Audit</span>
            <span aria-hidden="true">·</span>
            <span>{currentScale.name}</span>
            <span aria-hidden="true">·</span>
            <span>{currentScale.monthlySpendLabel}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetData}
              className="text-slate-500 hover:text-slate-900 transition-colors"
            >
              Reset Sample
            </button>
            <span aria-hidden="true">·</span>
            <span>Detention Default: ₹{rules.detentionRatePerHour}/hr</span>
            <span aria-hidden="true">·</span>
            <span>Cutoff: ≥{rules.minWeightThresholdKg} kg</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        rules={rules}
        setRules={setRules}
        onResetData={handleResetData}
      />

      <AddTripModal
        isOpen={isAddTripOpen}
        onClose={() => setIsAddTripOpen(false)}
        onAddTrip={handleAddTrip}
        existingLanes={existingLanes}
        existingTransporters={existingTransporters}
      />
    </div>
  );
}
