import React, { useMemo } from 'react';
import {
  CloudRain,
  Droplets,
  TriangleAlert,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  Layers,
  MapPin,
  Clock,
  Waves,
  CheckCircle2,
  SlidersHorizontal,
  Compass,
  Radio,
  Sparkles,
  ArrowUpRight,
  Activity,
  Zap,
  Info,
  ChevronRight,
  Route,
  Warehouse,
  Coins,
  Building,
  Sprout,
  ShieldAlert,
} from 'lucide-react';
import {
  RainEvent,
  SimulationResult,
  ScenarioParams,
  ScenarioComparison,
  ActionItem,
  ZoneAnalysis,
} from '../types/hydrology';
import { PRESET_RAIN_SCENARIOS } from '../data/kiitCampusData';
import { WeatherIntelligencePanel } from './WeatherIntelligencePanel';
import { WeatherDerivedStormProfile } from '../types/weather';

export interface RainOverviewProps {
  rainEvent: RainEvent;
  simulation: SimulationResult;
  baselineSimulation?: SimulationResult;
  comparison: ScenarioComparison;
  actionItems: ActionItem[];
  scenarioParams: ScenarioParams;
  scenarioSource: 'LIVE_WEATHER' | 'DEMO_PRESET' | 'CUSTOM';
  scenarioLabel: string;
  onNavigate: (tab: string, selectedZoneId?: string) => void;
  onSelectPreset: (presetId: string) => void;
  onOpenFormulas: () => void;
  onModelRain: (profile: WeatherDerivedStormProfile) => void;
  activePresetId: string;
  activeLiveProfile?: WeatherDerivedStormProfile | null;
}

export const RainOverview: React.FC<RainOverviewProps> = ({
  rainEvent,
  simulation,
  baselineSimulation,
  comparison,
  actionItems,
  scenarioParams,
  scenarioSource,
  scenarioLabel,
  onNavigate,
  onSelectPreset,
  onOpenFormulas,
  onModelRain,
  activePresetId,
  activeLiveProfile,
}) => {
  const highRiskZones = useMemo(
    () => simulation.zones.filter((z) => z.riskLevel === 'HIGH'),
    [simulation.zones]
  );
  const mediumRiskZones = useMemo(
    () => simulation.zones.filter((z) => z.riskLevel === 'MEDIUM'),
    [simulation.zones]
  );
  const lowRiskZones = useMemo(
    () => simulation.zones.filter((z) => z.riskLevel === 'LOW'),
    [simulation.zones]
  );
  const attentionZoneCount = highRiskZones.length + mediumRiskZones.length;

  const isLiveMode = scenarioSource === 'LIVE_WEATHER';
  const isCustomMode = scenarioSource === 'CUSTOM';

  // Total Drained Volume derived from current simulation zones
  const totalDrainedM3 = useMemo(
    () =>
      Math.round(
        simulation.zones.reduce((sum, z) => sum + (z.drainedVolumeM3 || 0), 0) * 10
      ) / 10,
    [simulation.zones]
  );

  // Ranked Risk Zones (sorted by risk priority and excess volume)
  const rankedZones = useMemo(() => {
    return [...simulation.zones].sort((a, b) => {
      const riskWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const weightDiff = riskWeight[b.riskLevel] - riskWeight[a.riskLevel];
      if (weightDiff !== 0) return weightDiff;
      return b.excessOverflowM3 - a.excessOverflowM3;
    });
  }, [simulation.zones]);

  const topPriorityZone = rankedZones[0];

  // Top 3 Recommended Actions from authoritative Action Items
  const topActions = useMemo(() => actionItems.slice(0, 3), [actionItems]);

  // Check if a resilience plan is actively applied
  const isResilienceActive = useMemo(() => {
    return (
      scenarioParams.storageCapacityMultiplier > 1.0 ||
      scenarioParams.captureUpgradePercent > 0 ||
      scenarioParams.activeInterventions.length > 0
    );
  }, [
    scenarioParams.storageCapacityMultiplier,
    scenarioParams.captureUpgradePercent,
    scenarioParams.activeInterventions,
  ]);

  // Dynamic Hero Title and Subtitle
  const modelHeroTitle = isLiveMode
    ? 'LIVE WEATHER MODEL'
    : isCustomMode
    ? 'CUSTOM STORM MODEL'
    : 'DEMO STORM MODEL';

  const modelHeroWindow = `${simulation.params.rainfallMm} mm · ${simulation.params.durationHours} HOUR WINDOW`;

  // Action Icon Helper
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'PROTECT':
        return <ShieldCheck className="w-3.5 h-3.5 text-[#FF6B6B]" />;
      case 'REDIRECT':
        return <Route className="w-3.5 h-3.5 text-[#F6B84B]" />;
      case 'STORE':
      default:
        return <Warehouse className="w-3.5 h-3.5 text-[#49D7D0]" />;
    }
  };

  return (
    <div className="space-y-6 pb-16 relative z-10">

      {/* ========================================================================= */}
      {/* 1. HERO — WHAT IS HAPPENING? & DATA PROVENANCE */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl glass-panel-elevated p-6 sm:p-8 lg:p-10 border border-[#49D7D0]/20 shadow-2xl">

        {/* Ambient Lighting Scrim */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#49D7D0]/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-[#6AA9FF]/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 lg:gap-8">

          <div className="max-w-3xl space-y-4">

            {/* Dynamic Model Header Badges */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono-num">
              <span className="inline-flex items-center gap-1.5 text-[#8DEBE3] bg-[#071316]/90 px-3 py-1 rounded-full border border-[#49D7D0]/30 shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-[#49D7D0] animate-ping" />
                <span className="font-semibold tracking-wide uppercase">KIIT CAMPUS · DIGITAL TWIN COMMAND</span>
              </span>

              {isLiveMode ? (
                <span className="text-[#8DEBE3] font-bold flex items-center gap-1.5 bg-[#49D7D0]/15 px-2.5 py-0.5 rounded-full border border-[#49D7D0]/40 shadow-inner">
                  <Radio className="w-3.5 h-3.5 text-[#49D7D0] animate-pulse" />
                  <span>{modelHeroTitle} [INPUT]</span>
                </span>
              ) : isCustomMode ? (
                <span className="text-[#8DEBE3] font-bold flex items-center gap-1.5 bg-[#0F2A2F] px-2.5 py-0.5 rounded-full border border-[#49D7D0]/30 shadow-inner">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#49D7D0]" />
                  <span>{modelHeroTitle} [SIMULATED]</span>
                </span>
              ) : (
                <span className="text-[#F6B84B] font-bold flex items-center gap-1.5 bg-[#F6B84B]/15 px-2.5 py-0.5 rounded-full border border-[#F6B84B]/40 shadow-inner">
                  <TriangleAlert className="w-3.5 h-3.5 text-[#F6B84B]" />
                  <span>{modelHeroTitle} [DEMO PRESET]</span>
                </span>
              )}

              <span className="text-[#91A9AB] font-semibold bg-[#071316]/70 px-2.5 py-0.5 rounded-md border border-white/5">
                {modelHeroWindow}
              </span>
            </div>

            {/* Title Lockup */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F4FAFA] leading-none">
                Varsha<span className="font-bengali font-normal text-[#49D7D0] text-4xl sm:text-6xl ml-1">নেত্র</span>
              </h1>
              <p className="text-lg sm:text-xl font-light text-[#8DEBE3] tracking-wide">
                Decision Command Center · See the rain. Shape the outcome.
              </p>
            </div>

            {/* Concise Mission Prose */}
            <p className="text-xs sm:text-sm text-[#91A9AB] leading-relaxed max-w-2xl font-normal">
              A deterministic campus model that translates rainfall into runoff, risk, response, and water reserves.
            </p>

            {/* Status & Data Provenance Bar */}
            <div className="p-3 rounded-2xl bg-[#071316]/80 border border-[#49D7D0]/15 space-y-1.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[#91A9AB] font-semibold">SOURCE:</span>
                  <span className="text-[#F4FAFA] font-bold font-mono-num">
                    {isLiveMode ? 'LIVE OPEN-METEO TELEMETRY' : isCustomMode ? 'PARAMETRIC LAB' : scenarioLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[#8DEBE3] font-mono-num text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#49D7D0]" />
                  <span>MODEL STATUS: CALCULATED (DETERMINISTIC)</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#91A9AB] font-mono-num">
                <span className="text-[#8DEBE3]">[INPUT] Storm depth & duration</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#49D7D0]">[MODELLED] Runoff, storage & risk</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#F6B84B]">[ESTIMATED] Reserve days & tariff offset</span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => onNavigate('map')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#071316] bg-gradient-to-r from-[#49D7D0] via-[#8DEBE3] to-[#49D7D0] hover:brightness-110 rounded-xl shadow-[0_0_20px_rgba(73,215,208,0.4)] transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <span>INSPECT DIGITAL TWIN</span>
                <Compass className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <button
                onClick={() => onNavigate('scenario')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#F4FAFA] hover:text-[#8DEBE3] glass-panel hover:bg-[#0F2A2F] border border-[#49D7D0]/25 rounded-xl transition-all cursor-pointer"
              >
                <span>{isResilienceActive ? 'Refine Resilience Plan' : 'Test Resilience Plan'}</span>
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#49D7D0]" />
              </button>

              <button
                onClick={onOpenFormulas}
                className="text-xs text-[#91A9AB] hover:text-[#8DEBE3] underline underline-offset-4 ml-1 transition-colors cursor-pointer"
              >
                Hydrology Equations
              </button>
            </div>

          </div>

          {/* Right Side: Demo Storm Presets Selector */}
          <div className="w-full lg:w-72 rounded-2xl glass-panel p-4 space-y-2.5 shrink-0 border border-[#49D7D0]/20">
            <div className="flex items-center justify-between border-b border-[#49D7D0]/15 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F4FAFA]">Storm Presets</span>
              <span className="text-[11px] font-mono-num text-[#8DEBE3]">Deterministic</span>
            </div>

            <div className="space-y-1.5">
              {PRESET_RAIN_SCENARIOS.map((preset) => {
                const isSelected = activePresetId === preset.id && scenarioSource === 'DEMO_PRESET';
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectPreset(preset.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F2A2F] border-[#49D7D0] text-[#F4FAFA] shadow-[0_0_12px_rgba(73,215,208,0.25)]'
                        : 'bg-[#071316]/60 border-white/5 text-[#91A9AB] hover:text-[#F4FAFA] hover:border-[#49D7D0]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className={isSelected ? 'text-[#8DEBE3] font-bold' : 'text-[#F4FAFA]'}>{preset.name}</span>
                      <span className="font-mono-num font-bold text-[#49D7D0]">{preset.rainfallMm} mm</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. LIVE WEATHER INTELLIGENCE INTEGRATION LAYER */}
      {/* ========================================================================= */}
      <WeatherIntelligencePanel
        currentScenarioParams={scenarioParams}
        activeScenarioLabel={scenarioLabel}
        onModelRain={onModelRain}
        activeLiveProfile={activeLiveProfile}
        onNavigateToMap={() => onNavigate('map')}
      />

      {/* ========================================================================= */}
      {/* 3. WHAT IS HAPPENING? — 5-POINT CAMPUS RESPONSE KPIS */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-1">
          <div>
            <h2 className="text-base font-bold text-[#F4FAFA] tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#49D7D0]" />
              <span>Campus Hydrological Response</span>
            </h2>
          </div>
          <span className="text-xs text-[#8DEBE3] font-mono-num bg-[#071316] px-2.5 py-0.5 rounded-md border border-white/5">
            [MODELLED] 7 Catchment Sectors
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

          {/* KPI 1: Total Runoff */}
          <div className="p-4 rounded-2xl glass-panel border border-[#49D7D0]/20 shadow-md flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between text-xs text-[#91A9AB]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Total Runoff</span>
              <Waves className="w-4 h-4 text-[#49D7D0]" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold font-mono-num text-[#F4FAFA]">
                  {simulation.totalRunoffM3.toLocaleString()}
                </span>
                <span className="text-xs text-[#91A9AB] font-mono-num">m³</span>
              </div>
              <div className="text-[10px] text-[#91A9AB] font-mono-num truncate mt-0.5">
                {(simulation.totalRunoffM3 * 1000).toLocaleString()} L storm discharge
              </div>
            </div>
          </div>

          {/* KPI 2: Captured Water */}
          <div
            onClick={() => onNavigate('impact')}
            className="group p-4 rounded-2xl glass-panel hover:bg-[#0F2A2F]/90 border border-[#49D7D0]/25 hover:border-[#49D7D0]/60 transition-all cursor-pointer shadow-md flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between text-xs text-[#91A9AB]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Captured</span>
              <Droplets className="w-4 h-4 text-[#49D7D0]" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold font-mono-num text-[#49D7D0]">
                  {simulation.totalCapturedM3.toLocaleString()}
                </span>
                <span className="text-xs text-[#91A9AB] font-mono-num">m³</span>
              </div>
              <div className="text-[10px] text-[#8DEBE3] font-mono-num truncate mt-0.5">
                {simulation.captureEfficiencyPct}% harvest efficiency
              </div>
            </div>
          </div>

          {/* KPI 3: Drained Discharge */}
          <div className="p-4 rounded-2xl glass-panel border border-[#6AA9FF]/20 shadow-md flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between text-xs text-[#91A9AB]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Drained</span>
              <Zap className="w-4 h-4 text-[#6AA9FF]" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold font-mono-num text-[#6AA9FF]">
                  {totalDrainedM3.toLocaleString()}
                </span>
                <span className="text-xs text-[#91A9AB] font-mono-num">m³</span>
              </div>
              <div className="text-[10px] text-[#91A9AB] font-mono-num truncate mt-0.5">
                Gravity & sluice conduit flow
              </div>
            </div>
          </div>

          {/* KPI 4: Excess / Flood Risk */}
          <div className="p-4 rounded-2xl glass-panel border border-[#FF6B6B]/20 shadow-md flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between text-xs text-[#91A9AB]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Excess Flood</span>
              <TrendingDown className="w-4 h-4 text-[#FF6B6B]" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold font-mono-num text-[#FF6B6B]">
                  {simulation.totalExcessM3.toLocaleString()}
                </span>
                <span className="text-xs text-[#91A9AB] font-mono-num">m³</span>
              </div>
              <div className="text-[10px] text-[#FF6B6B] font-mono-num truncate mt-0.5">
                {simulation.totalExcessM3 > 0 ? 'Surface ponding hazard' : 'Zero surface overflow'}
              </div>
            </div>
          </div>

          {/* KPI 5: High-Risk Zones */}
          <div
            onClick={() => onNavigate('map')}
            className="group col-span-2 sm:col-span-1 p-4 rounded-2xl glass-panel hover:bg-[#0F2A2F]/90 border border-[#F6B84B]/20 hover:border-[#F6B84B]/60 transition-all cursor-pointer shadow-md flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between text-xs text-[#91A9AB]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">High-Risk Zones</span>
              <TriangleAlert className="w-4 h-4 text-[#F6B84B]" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold font-mono-num text-[#F6B84B]">
                  {simulation.highRiskCount}
                </span>
                <span className="text-xs text-[#91A9AB] font-mono-num">/ {simulation.zones.length}</span>
              </div>
              <div className="text-[10px] text-[#91A9AB] font-mono-num truncate mt-0.5">
                {simulation.mediumRiskCount} med · {simulation.lowRiskCount} low
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. TWO-COLUMN COMMAND GRID: WHERE IS THE RISK? vs WHAT CAN WE DO? */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: WHERE IS THE RISK? (6 Cols) */}
        <div className="lg:col-span-6 space-y-4 rounded-3xl glass-panel-elevated p-6 border border-[#49D7D0]/20 shadow-xl flex flex-col justify-between">

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#49D7D0]/15 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#F4FAFA] flex items-center gap-2">
                  <TriangleAlert className="w-4 h-4 text-[#F6B84B]" />
                  <span>Where is the Risk?</span>
                </h3>
                <p className="text-xs text-[#91A9AB]">Catchment vulnerability ranking</p>
              </div>

              {/* Risk count breakdown badge */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono-num">
                <span className="px-2 py-0.5 rounded bg-[#FF6B6B]/20 text-[#FF6B6B] font-bold border border-[#FF6B6B]/30">
                  {highRiskZones.length} HIGH
                </span>
                <span className="px-2 py-0.5 rounded bg-[#F6B84B]/20 text-[#F6B84B] font-bold border border-[#F6B84B]/30">
                  {mediumRiskZones.length} MED
                </span>
                <span className="px-2 py-0.5 rounded bg-[#49D7D0]/20 text-[#8DEBE3] font-bold border border-[#49D7D0]/30">
                  {lowRiskZones.length} LOW
                </span>
              </div>
            </div>

            {/* Highest Priority Zone Spotlight */}
            {topPriorityZone && (
              <div
                onClick={() => onNavigate('map', topPriorityZone.zoneId)}
                className="p-4 rounded-2xl bg-gradient-to-br from-[#0F2A2F] to-[#071316] border border-[#FF6B6B]/40 hover:border-[#FF6B6B] transition-all cursor-pointer group shadow-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-num font-bold uppercase tracking-wider text-[#FF6B6B] bg-[#FF6B6B]/15 px-2 py-0.5 rounded border border-[#FF6B6B]/30">
                    HIGHEST VULNERABILITY
                  </span>
                  <span className="text-xs font-mono-num font-bold text-[#F4FAFA]">
                    Excess: {topPriorityZone.excessOverflowM3} m³
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-[#F4FAFA] group-hover:text-[#49D7D0] transition-colors">
                    {topPriorityZone.zoneName}
                  </h4>
                  <span className="text-xs font-mono-num font-extrabold px-2 py-0.5 rounded bg-[#FF6B6B]/20 text-[#FF6B6B] border border-[#FF6B6B]/40">
                    {topPriorityZone.riskLevel} RISK
                  </span>
                </div>

                <p className="text-xs text-[#91A9AB] leading-relaxed">
                  <strong>Rationale:</strong>{' '}
                  {topPriorityZone.interventionReason ||
                    topPriorityZone.riskFactors.slice(0, 3).join(' · ') ||
                    'Drainage throughput saturated under current storm intensity'}
                </p>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-[#8DEBE3]">
                  <span className="font-semibold flex items-center gap-1.5">
                    {getActionIcon(topPriorityZone.recommendedIntervention)}
                    <span>Action: {topPriorityZone.recommendedIntervention}</span>
                  </span>
                  <span className="flex items-center gap-1 font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>Inspect in Digital Twin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            )}

            {/* Top Risk Zones Ranked List */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-bold text-[#91A9AB] uppercase tracking-wider block">
                Ranked Catchment Sectors
              </span>
              <div className="space-y-1.5">
                {rankedZones.slice(0, 4).map((zone, idx) => {
                  const isHigh = zone.riskLevel === 'HIGH';
                  const isMed = zone.riskLevel === 'MEDIUM';

                  return (
                    <div
                      key={zone.zoneId}
                      onClick={() => onNavigate('map', zone.zoneId)}
                      className="p-2.5 rounded-xl bg-[#071316]/70 border border-white/5 hover:border-[#49D7D0]/40 transition-all cursor-pointer flex items-center justify-between text-xs hover:bg-[#0F2A2F]/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono-num font-bold text-[#91A9AB] text-[11px] w-5">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <div className="font-semibold text-[#F4FAFA] truncate max-w-[170px] sm:max-w-[220px]">
                            {zone.zoneName}
                          </div>
                          <div className="text-[10px] text-[#91A9AB] font-mono-num">
                            Excess: {zone.excessOverflowM3} m³ · Runoff: {zone.runoffVolumeM3} m³
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono-num font-bold px-2 py-0.5 rounded border ${
                          isHigh ? 'bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]/40' :
                          isMed ? 'bg-[#F6B84B]/20 text-[#F6B84B] border-[#F6B84B]/40' :
                          'bg-[#49D7D0]/20 text-[#8DEBE3] border-[#49D7D0]/40'
                        }`}>
                          {zone.riskLevel}
                        </span>
                        <span className="text-[10px] font-mono-num text-[#8DEBE3] font-bold bg-[#0B2024] px-2 py-0.5 rounded border border-[#49D7D0]/20 flex items-center gap-1">
                          {getActionIcon(zone.recommendedIntervention)}
                          <span>{zone.recommendedIntervention}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5">
            <button
              onClick={() => onNavigate('map')}
              className="w-full py-2 px-4 text-xs font-bold text-[#8DEBE3] hover:text-[#F4FAFA] bg-[#0F2A2F]/60 hover:bg-[#0F2A2F] border border-[#49D7D0]/30 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>OPEN DIGITAL TWIN MAP</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: WHAT CAN WE DO? (RECOMMENDED RESPONSE) (6 Cols) */}
        <div className="lg:col-span-6 space-y-4 rounded-3xl glass-panel-elevated p-6 border border-[#49D7D0]/20 shadow-xl flex flex-col justify-between">

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#49D7D0]/15 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#F4FAFA] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#49D7D0]" />
                  <span>What Can We Do?</span>
                </h3>
                <p className="text-xs text-[#91A9AB]">Tactical response directives</p>
              </div>

              <span className="text-xs font-mono-num text-[#49D7D0] font-bold bg-[#071316] px-2.5 py-0.5 rounded-md border border-white/5">
                {actionItems.length} Directives
              </span>
            </div>

            {/* Top Action Items */}
            <div className="space-y-2.5">
              {topActions.map((action) => {
                const isP1 = action.priority === 'P1';
                const isP2 = action.priority === 'P2';

                return (
                  <div
                    key={action.id}
                    className="p-3.5 rounded-2xl bg-[#071316]/80 border border-white/10 hover:border-[#49D7D0]/40 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono-num font-extrabold px-2 py-0.5 rounded border flex items-center gap-1 ${
                          isP1 ? 'bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]/40' :
                          isP2 ? 'bg-[#F6B84B]/20 text-[#F6B84B] border-[#F6B84B]/40' :
                          'bg-[#49D7D0]/20 text-[#8DEBE3] border-[#49D7D0]/40'
                        }`}>
                          {getActionIcon(action.action)}
                          <span>{action.priority} — {action.action}</span>
                        </span>
                        <span className="text-xs font-bold text-[#F4FAFA]">
                          {action.zoneName}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono-num text-[#91A9AB] bg-[#0B2024] px-2 py-0.5 rounded border border-white/5">
                        {action.estimatedEffort}
                      </span>
                    </div>

                    <p className="text-xs text-[#91A9AB] leading-relaxed">
                      {action.reason}
                    </p>

                    <div className="text-[11px] text-[#8DEBE3] font-mono-num flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#49D7D0]" />
                      <span>Impact: {action.expectedImpact}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-white/5">
            <button
              onClick={() => onNavigate('actions')}
              className="w-full py-2 px-4 text-xs font-bold text-[#071316] bg-gradient-to-r from-[#49D7D0] to-[#8DEBE3] hover:brightness-110 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-[#49D7D0]/20 cursor-pointer"
            >
              <span>VIEW FULL ACTION PLAN ({actionItems.length} DIRECTIVES)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 5. WHAT WILL CHANGE? — RESILIENCE RESPONSE */}
      {/* ========================================================================= */}
      <section className="rounded-3xl glass-panel-elevated p-6 border border-[#49D7D0]/25 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#49D7D0]/15 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#49D7D0]" />
              <h3 className="text-base font-bold text-[#F4FAFA] tracking-tight">
                Resilience Investment Plan
              </h3>
              {isResilienceActive ? (
                <span className="text-[10px] font-mono-num font-bold bg-[#49D7D0]/20 text-[#8DEBE3] px-2.5 py-0.5 rounded-full border border-[#49D7D0]/40">
                  ACTIVE PLAN
                </span>
              ) : (
                <span className="text-[10px] font-mono-num font-semibold bg-white/5 text-[#91A9AB] px-2.5 py-0.5 rounded-full border border-white/10">
                  NO RESILIENCE PLAN APPLIED
                </span>
              )}
            </div>
            <p className="text-xs text-[#91A9AB] mt-0.5">
              Deterministic comparison against baseline infrastructure under identical storm forcing
            </p>
          </div>

          <button
            onClick={() => onNavigate('scenario')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F2A2F] hover:bg-[#143940] border border-[#49D7D0]/40 text-xs font-bold text-[#8DEBE3] transition-all cursor-pointer self-start sm:self-auto"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#49D7D0]" />
            <span>{isResilienceActive ? 'Refine in Simulator' : 'Open Simulator'}</span>
          </button>
        </div>

        {isResilienceActive ? (
          <div className="space-y-4">

            {/* Side-by-side Baseline vs Resilience Flow */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Baseline State */}
              <div className="p-4 rounded-2xl bg-[#071316]/90 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#91A9AB] border-b border-white/5 pb-1.5">
                  <span>BASELINE RESPONSE</span>
                  <span className="font-mono-num font-normal text-[11px]">As-is Infrastructure</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono-num pt-1">
                  <div>
                    <div className="text-[10px] text-[#91A9AB]">High-Risk</div>
                    <div className="text-sm font-bold text-[#FF6B6B] mt-0.5">
                      {comparison.baseline.highRiskCount} Zones
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#91A9AB]">Excess Flood</div>
                    <div className="text-sm font-bold text-[#FF6B6B] mt-0.5">
                      {comparison.baseline.totalExcessM3} m³
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#91A9AB]">Captured</div>
                    <div className="text-sm font-bold text-[#F4FAFA] mt-0.5">
                      {comparison.baseline.totalCapturedM3} m³
                    </div>
                  </div>
                </div>
              </div>

              {/* Resilience State */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0F2A2F] to-[#071316] border border-[#49D7D0]/50 space-y-2 shadow-lg">
                <div className="flex items-center justify-between text-xs font-bold text-[#8DEBE3] border-b border-[#49D7D0]/20 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#49D7D0]" />
                    <span>RESILIENCE RESPONSE</span>
                  </span>
                  <span className="font-mono-num font-bold text-[11px] text-[#49D7D0]">Simulated Upgrades</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono-num pt-1">
                  <div>
                    <div className="text-[10px] text-[#8DEBE3]">High-Risk</div>
                    <div className="text-sm font-bold text-[#49D7D0] mt-0.5">
                      {comparison.simulated.highRiskCount} Zones
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8DEBE3]">Excess Flood</div>
                    <div className="text-sm font-bold text-[#49D7D0] mt-0.5">
                      {comparison.simulated.totalExcessM3} m³
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8DEBE3]">Captured</div>
                    <div className="text-sm font-bold text-[#8DEBE3] mt-0.5">
                      {comparison.simulated.totalCapturedM3} m³
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Delta Impact Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

              <div className="p-3 rounded-xl bg-[#071316] border border-[#49D7D0]/20 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#91A9AB]">Excess Flood Drop</div>
                  <div className="text-base font-extrabold font-mono-num text-[#49D7D0] mt-0.5">
                    {comparison.impact.excessReductionPct}%
                  </div>
                </div>
                <span className="text-xs font-mono-num text-[#8DEBE3] bg-[#0F2A2F] px-2 py-0.5 rounded">
                  -{comparison.deltas.excessOverflowM3Delta} m³
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#071316] border border-[#49D7D0]/20 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#91A9AB]">Additional Capture</div>
                  <div className="text-base font-extrabold font-mono-num text-[#8DEBE3] mt-0.5">
                    +{comparison.deltas.capturedVolumeM3Delta} m³
                  </div>
                </div>
                <span className="text-xs font-mono-num text-[#49D7D0] bg-[#0F2A2F] px-2 py-0.5 rounded">
                  +{(comparison.deltas.capturedVolumeM3Delta * 1000).toLocaleString()} L
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#071316] border border-[#49D7D0]/20 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#91A9AB]">Zones Protected</div>
                  <div className="text-base font-extrabold font-mono-num text-[#F4FAFA] mt-0.5">
                    {comparison.deltas.highRiskZonesReduced} Mitigated
                  </div>
                </div>
                <span className="text-xs font-mono-num text-[#8DEBE3] bg-[#0F2A2F] px-2 py-0.5 rounded">
                  {comparison.impact.priorityZonesProtected} Secure
                </span>
              </div>

            </div>

          </div>
        ) : (
          <div className="py-3.5 px-4 rounded-2xl bg-[#071316]/60 border border-dashed border-white/10 text-center space-y-2">
            <p className="text-xs text-[#91A9AB] max-w-xl mx-auto leading-normal">
              Campus is evaluated under un-upgraded baseline conditions. Use the <strong>Resilience Simulator</strong> to model +150% storage capacity expansion, +80% permeable bioswales, and targeted zone defenses.
            </p>
            <button
              onClick={() => onNavigate('scenario')}
              className="px-3.5 py-1.5 text-xs font-bold text-[#071316] bg-gradient-to-r from-[#49D7D0] to-[#8DEBE3] hover:brightness-110 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>TEST RESILIENCE INVESTMENTS</span>
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. HOW MUCH WATER DO WE CREATE? — RAIN → RESERVE CLOSED LOOP */}
      {/* ========================================================================= */}
      <section className="rounded-3xl glass-panel-elevated p-6 border border-[#49D7D0]/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#49D7D0]/15 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#49D7D0]" />
              <h3 className="text-base font-bold text-[#F4FAFA] tracking-tight">
                Rain → Reserve Closed-Loop Impact
              </h3>
            </div>
            <p className="text-xs text-[#91A9AB] mt-0.5">
              Transforming storm runoff into institutional water independence and financial utility offsets
            </p>
          </div>

          <button
            onClick={() => onNavigate('impact')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#49D7D0] to-[#8DEBE3] hover:brightness-110 text-xs font-bold text-[#071316] transition-all cursor-pointer shadow-md shadow-[#49D7D0]/20 self-start sm:self-auto"
          >
            <span>Full Impact Report</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

          {/* Tile 1: Water Captured */}
          <div className="p-4 rounded-2xl bg-[#071316] border border-[#49D7D0]/20 space-y-0.5">
            <div className="text-[10px] text-[#91A9AB] font-semibold uppercase tracking-wider">
              Water Captured [MODELLED]
            </div>
            <div className="text-2xl font-extrabold font-mono-num text-[#49D7D0]">
              {comparison.impact.waterCapturedM3.toLocaleString()} m³
            </div>
            <div className="text-[10px] font-mono-num text-[#8DEBE3]">
              {comparison.impact.waterCapturedLiters.toLocaleString()} Liters
            </div>
          </div>

          {/* Tile 2: Supply Autonomy */}
          <div className="p-4 rounded-2xl bg-[#071316] border border-[#49D7D0]/20 space-y-0.5">
            <div className="text-[10px] text-[#91A9AB] font-semibold uppercase tracking-wider">
              Campus Autonomy [ESTIMATED]
            </div>
            <div className="text-2xl font-extrabold font-mono-num text-[#F4FAFA]">
              {comparison.impact.campusDaysSupplyEquivalent} Days
            </div>
            <div className="text-[10px] text-[#91A9AB] font-mono-num">
              Non-potable institutional demand
            </div>
          </div>

          {/* Tile 3: Groundwater Recharge */}
          <div className="p-4 rounded-2xl bg-[#071316] border border-[#49D7D0]/20 space-y-0.5">
            <div className="text-[10px] text-[#91A9AB] font-semibold uppercase tracking-wider">
              Aquifer Recharge [ESTIMATED]
            </div>
            <div className="text-2xl font-extrabold font-mono-num text-[#8DEBE3]">
              {comparison.impact.groundwaterRechargeEstimateM3.toLocaleString()} m³
            </div>
            <div className="text-[10px] text-[#91A9AB] font-mono-num">
              Sub-surface percolation
            </div>
          </div>

          {/* Tile 4: Municipal Tariff Offset */}
          <div className="p-4 rounded-2xl bg-[#071316] border border-[#49D7D0]/20 space-y-0.5">
            <div className="text-[10px] text-[#91A9AB] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-[#F6B84B]/20 text-[#F6B84B] border border-[#F6B84B]/40 font-mono-num font-bold text-[9px]">[ESTIMATED]</span>
              <span>Tariff Offset</span>
            </div>
            <div className="text-2xl font-extrabold font-mono-num text-[#F6B84B]">
              ₹{comparison.impact.municipalWaterOffsetINR.toLocaleString()}
            </div>
            <div className="text-[10px] text-[#91A9AB] font-mono-num">
              At ₹65 / kL municipal rate
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. SIGNATURE PRODUCT STATEMENT */}
      {/* ========================================================================= */}
      <footer className="text-center pt-3 pb-2 space-y-0.5 text-xs text-[#91A9AB]/70">
        <p className="font-medium tracking-wide">
          "Don't just predict the storm. Model where the water goes."
        </p>
        <p className="text-[11px] text-[#91A9AB]/50 font-mono-num">
          AI explains the model. It does not invent the risk.
        </p>
      </footer>

    </div>
  );
};
