import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Play,
  RotateCcw,
  ArrowRight,
  TrendingDown,
  Droplets,
  Waves,
  ShieldCheck,
  TriangleAlert,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  BookOpen,
  CloudRain,
  Activity,
  Layers,
  Bot,
  BrainCircuit,
  Cpu,
  Radio,
} from 'lucide-react';
import {
  CampusZone,
  ScenarioParams,
  SimulationResult,
  ScenarioComparison,
  ExplanationResponse,
} from '../../shared/hydrology/types';
import { hydrologyService } from '../services/simulationService';

interface ScenarioLabProps {
  zones: CampusZone[];
  baselineSimulation: SimulationResult;
  currentSimulation: SimulationResult;
  comparison: ScenarioComparison;
  params: ScenarioParams;
  scenarioSource?: 'LIVE_WEATHER' | 'DEMO_PRESET' | 'CUSTOM';
  scenarioLabel?: string;
  onUpdateParams: (params: ScenarioParams) => void;
  onSimulate: (params: ScenarioParams) => void;
  onResetToBaseline: () => void;
  onOpenFormulas: () => void;
  onNavigateToActions: () => void;
  onNavigateToImpact: () => void;
}

const PIPELINE_STEPS = [
  'INITIALIZING HYDROLOGICAL MODEL',
  'PROPAGATING RAINFALL ACROSS ZONES',
  'CALCULATING RUNOFF AND STORAGE',
  'EVALUATING DRAINAGE STRESS',
  'COMPUTING INTERVENTION IMPACT',
  'SIMULATION COMPLETE',
];

export const ScenarioLab: React.FC<ScenarioLabProps> = ({
  zones,
  baselineSimulation,
  currentSimulation,
  comparison,
  params,
  scenarioSource = 'DEMO_PRESET',
  scenarioLabel = '72 mm Storm Scenario',
  onUpdateParams,
  onSimulate,
  onResetToBaseline,
  onOpenFormulas,
  onNavigateToActions,
  onNavigateToImpact,
}) => {
  const [localParams, setLocalParams] = useState<ScenarioParams>({ ...params });
  const [isSimulating, setIsSimulating] = useState(false);
  const [pipelineIndex, setPipelineIndex] = useState(0);

  // Synchronize localParams whenever params prop updates from outside (e.g. Live Weather or Presets)
  useEffect(() => {
    setLocalParams({ ...params });
  }, [params]);

  // AI Explanation (Amazon Bedrock Layer)
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [showExplanationPanel, setShowExplanationPanel] = useState(false);

  const handleSliderChange = (field: keyof ScenarioParams, value: any) => {
    const updated = { ...localParams, [field]: value };
    setLocalParams(updated);
    onUpdateParams(updated);
  };

  const handleToggleIntervention = (zoneId: string) => {
    const active = [...localParams.activeInterventions];
    const index = active.indexOf(zoneId);
    if (index > -1) {
      active.splice(index, 1);
    } else {
      active.push(zoneId);
    }
    const updated = { ...localParams, activeInterventions: active };
    setLocalParams(updated);
    onUpdateParams(updated);
  };

  const handleTriggerSimulate = () => {
    setIsSimulating(true);
    setPipelineIndex(0);
    setExplanation(null);

    // Subtle simulation status sequence across 1.3s
    const stepDuration = 220;
    PIPELINE_STEPS.forEach((_, idx) => {
      setTimeout(() => {
        setPipelineIndex(idx);
      }, idx * stepDuration);
    });

    setTimeout(() => {
      onSimulate(localParams);
      setIsSimulating(false);
    }, PIPELINE_STEPS.length * stepDuration);
  };

  const handleFetchExplanation = async () => {
    setIsLoadingExplanation(true);
    setShowExplanationPanel(true);
    try {
      const res = await hydrologyService.explainWithBedrock(currentSimulation);
      setExplanation(res);
    } catch (e) {
      // fallback
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  const { baseline, simulated, deltas, impact } = comparison;

  return (
    <div className="space-y-8 pb-16 relative z-10">

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#49D7D0]/15 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F4FAFA] tracking-tight flex items-center gap-2.5">
              <SlidersHorizontal className="w-5 h-5 text-[#49D7D0]" />
              <span>Storm Simulator</span>
            </h1>

            {scenarioSource === 'LIVE_WEATHER' ? (
              <span className="text-xs font-mono-num font-bold text-[#8DEBE3] bg-[#49D7D0]/15 px-3 py-1 rounded-full border border-[#49D7D0]/40 shadow-inner flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-[#49D7D0] animate-pulse" />
                <span>LIVE WEATHER INPUT</span>
              </span>
            ) : scenarioSource === 'CUSTOM' ? (
              <span className="text-xs font-mono-num font-bold text-[#8DEBE3] bg-[#0F2A2F] px-3 py-1 rounded-full border border-[#49D7D0]/30 shadow-inner flex items-center gap-1.5">
                <span>CUSTOM WHAT-IF LAB</span>
              </span>
            ) : (
              <span className="text-xs font-mono-num font-bold text-[#F6B84B] bg-[#F6B84B]/15 px-3 py-1 rounded-full border border-[#F6B84B]/40 shadow-inner flex items-center gap-1.5">
                <span>DEMO SCENARIO INPUT</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#91A9AB] mt-1">
            Simulate how campus flood risks and water capture volumes shift under variable precipitation and storage interventions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenFormulas}
            className="px-3.5 py-2 text-xs font-semibold text-[#91A9AB] hover:text-[#F4FAFA] bg-[#0B2024] border border-[#49D7D0]/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer hover:bg-[#0F2A2F]"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#49D7D0]" />
            <span>Hydrology Equations</span>
          </button>

          <button
            onClick={() => {
              onResetToBaseline();
              setLocalParams({
                rainfallMm: 72,
                durationHours: 18,
                storageCapacityMultiplier: 1.0,
                captureUpgradePercent: 0,
                stormProfile: 'monsoon_steady',
                activeInterventions: [],
              });
              setExplanation(null);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-[#91A9AB] hover:text-[#F4FAFA] bg-[#0B2024] hover:bg-[#0F2A2F] border border-[#49D7D0]/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Interactive Controls & Simulation Dispatch Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Scenario Parameters Control Deck (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 rounded-3xl glass-panel-elevated p-6 border border-[#49D7D0]/25 shadow-2xl">

          <div className="flex items-center justify-between border-b border-[#49D7D0]/15 pb-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F4FAFA] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#49D7D0]" />
              <span>Input Simulation Variables</span>
            </span>
            <span className="text-[11px] font-mono-num text-[#8DEBE3]">
              Deterministic
            </span>
          </div>

          {/* Slider 1: Rainfall Amount */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-[#F4FAFA] flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-[#49D7D0]" />
                <span>Precipitation Depth</span>
              </label>
              <span className="font-mono-num font-extrabold text-[#49D7D0] text-sm bg-[#071316] px-2.5 py-0.5 rounded-md border border-[#49D7D0]/40">
                {localParams.rainfallMm} mm
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="240"
              step="1"
              value={localParams.rainfallMm}
              onChange={(e) => handleSliderChange('rainfallMm', Number(e.target.value))}
              className="w-full accent-[#49D7D0] h-2 bg-[#071316] rounded-lg cursor-pointer border border-[#49D7D0]/20"
            />
            <div className="flex justify-between text-[11px] text-[#91A9AB] font-mono-num">
              <span>15 mm (Shower)</span>
              <span className="text-[#8DEBE3]">72 mm (Monsoon)</span>
              <span>240 mm (Extreme)</span>
            </div>
          </div>

          {/* Slider 2: Storage Capacity Multiplier */}
          <div className="space-y-2.5 pt-3 border-t border-[#49D7D0]/15">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-[#F4FAFA]">
                <span>Cistern & Retention Storage</span>
              </label>
              <span className="font-mono-num font-extrabold text-[#8DEBE3] text-sm bg-[#071316] px-2.5 py-0.5 rounded-md border border-[#49D7D0]/40">
                +{Math.round((localParams.storageCapacityMultiplier - 1) * 100)}% ({localParams.storageCapacityMultiplier}x)
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="2.5"
              step="0.05"
              value={localParams.storageCapacityMultiplier}
              onChange={(e) => handleSliderChange('storageCapacityMultiplier', Number(e.target.value))}
              className="w-full accent-[#8DEBE3] h-2 bg-[#071316] rounded-lg cursor-pointer border border-[#49D7D0]/20"
            />
            <div className="flex justify-between text-[11px] text-[#91A9AB] font-mono-num">
              <span>1.0x (Baseline)</span>
              <span>1.5x (+50% Tankage)</span>
              <span>2.5x (Max Capacity)</span>
            </div>
          </div>

          {/* Slider 3: Capture / Infiltration Upgrades */}
          <div className="space-y-2.5 pt-3 border-t border-[#49D7D0]/15">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-[#F4FAFA]">
                <span>Infiltration / Swale Retrofit</span>
              </label>
              <span className="font-mono-num font-extrabold text-[#6AA9FF] text-sm bg-[#071316] px-2.5 py-0.5 rounded-md border border-[#6AA9FF]/40">
                +{localParams.captureUpgradePercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={localParams.captureUpgradePercent}
              onChange={(e) => handleSliderChange('captureUpgradePercent', Number(e.target.value))}
              className="w-full accent-[#6AA9FF] h-2 bg-[#071316] rounded-lg cursor-pointer border border-[#49D7D0]/20"
            />
            <div className="flex justify-between text-[11px] text-[#91A9AB] font-mono-num">
              <span>0% (As-is)</span>
              <span>+40% (Permeable)</span>
              <span>+80% (Eco Swales)</span>
            </div>
          </div>

          {/* Storm Profile Selector */}
          <div className="space-y-2.5 pt-3 border-t border-[#49D7D0]/15">
            <label className="text-xs font-bold text-[#F4FAFA] block">
              Temporal Rain Distribution Profile
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'monsoon_steady', label: 'Monsoon Steady (18h)' },
                { id: 'tropical_downpour', label: 'Tropical Downpour (8h)' },
                { id: 'cloudburst', label: 'Cloudburst Flash (4h)' },
                { id: 'cyclonic_surge', label: 'Cyclonic Surge (24h)' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSliderChange('stormProfile', p.id)}
                  className={`px-3 py-2 text-xs text-left rounded-xl border transition-all cursor-pointer ${
                    localParams.stormProfile === p.id
                      ? 'bg-[#0F2A2F] text-[#8DEBE3] border-[#49D7D0] font-bold shadow-[0_0_10px_rgba(73,215,208,0.2)]'
                      : 'bg-[#071316]/70 text-[#91A9AB] border-white/5 hover:text-[#F4FAFA] hover:border-[#49D7D0]/30'
                  }`}
                >
                  <div className="line-clamp-1">{p.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Targeted Zone Interventions Toggles */}
          <div className="space-y-2.5 pt-3 border-t border-[#49D7D0]/15">
            <label className="text-xs font-bold text-[#F4FAFA] block">
              Targeted Physical Zone Interventions
            </label>
            <div className="space-y-1.5">
              {zones.slice(0, 4).map((zone) => {
                const isActive = localParams.activeInterventions.includes(zone.id);
                return (
                  <button
                    key={zone.id}
                    onClick={() => handleToggleIntervention(zone.id)}
                    className={`w-full p-2.5 rounded-xl border text-xs text-left flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0F2A2F] border-[#49D7D0] text-[#8DEBE3]'
                        : 'bg-[#071316]/70 border-white/5 text-[#91A9AB] hover:text-[#F4FAFA]'
                    }`}
                  >
                    <span className="truncate">{zone.code} · {zone.name}</span>
                    <span className={`text-[10px] font-mono-num font-bold px-2 py-0.5 rounded-md ${
                      isActive ? 'bg-[#49D7D0] text-[#071316]' : 'bg-[#0B2024] text-[#91A9AB]'
                    }`}>
                      {isActive ? 'STAGED' : 'OFF'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prominent SIMULATE Button with Pipeline Progress Indicator */}
          <div className="space-y-2 pt-3">
            <button
              onClick={handleTriggerSimulate}
              disabled={isSimulating}
              className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(73,215,208,0.35)] transition-all transform active:scale-[0.99] cursor-pointer ${
                isSimulating
                  ? 'bg-[#0F2A2F] text-[#49D7D0] border border-[#49D7D0]/50'
                  : 'bg-gradient-to-r from-[#49D7D0] via-[#8DEBE3] to-[#49D7D0] hover:brightness-110 text-[#071316]'
              }`}
            >
              {isSimulating ? (
                <>
                  <Waves className="w-5 h-5 animate-spin text-[#49D7D0]" />
                  <span>CALCULATING HYDROLOGY...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-[#071316]" />
                  <span>SIMULATE</span>
                </>
              )}
            </button>

            {/* Pipeline Stage Feedback */}
            {isSimulating && (
              <div className="p-3 rounded-xl bg-[#071316] border border-[#49D7D0]/30 text-center space-y-1.5 animate-pulse">
                <div className="text-[11px] font-mono-num text-[#49D7D0] font-bold">
                  {PIPELINE_STEPS[pipelineIndex]}
                </div>
                <div className="h-1.5 w-full bg-[#0B2024] rounded-full overflow-hidden">
                  <div
                    className="bg-[#49D7D0] h-full transition-all duration-200"
                    style={{ width: `${((pipelineIndex + 1) / PIPELINE_STEPS.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* BEFORE vs AFTER Clear Comparison (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Main Comparison Card */}
          <div className="rounded-3xl glass-panel-elevated p-6 space-y-6 border border-[#49D7D0]/25 shadow-2xl">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#49D7D0]/15 pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#F4FAFA] tracking-tight">
                  Deterministic BASELINE vs INTERVENTION
                </h2>
                <p className="text-xs text-[#91A9AB]">
                  Direct hydrological delta against baseline ({baseline.params.rainfallMm}mm / {baseline.params.durationHours}h)
                </p>
              </div>

              <button
                onClick={handleFetchExplanation}
                disabled={isLoadingExplanation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F2A2F] hover:bg-[#143940] border border-[#49D7D0]/40 text-xs font-bold text-[#8DEBE3] transition-all cursor-pointer shrink-0 shadow-sm"
              >
                <BrainCircuit className="w-3.5 h-3.5 text-[#49D7D0]" />
                <span>{isLoadingExplanation ? 'Synthesizing...' : 'Bedrock AI Brief'}</span>
              </button>
            </div>

            {/* AI Explanation Accordion / Panel */}
            {showExplanationPanel && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0F2A2F]/90 to-[#071316] border border-[#49D7D0]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#8DEBE3]">
                    <Bot className="w-4 h-4 text-[#49D7D0]" />
                    <span>Amazon Bedrock Environmental Explanation</span>
                  </div>
                  <span className="text-[10px] font-mono-num text-[#91A9AB] bg-[#071316] px-2 py-0.5 rounded border border-white/5">
                    {explanation?.generatedBy || 'Natural Language Synthesis'}
                  </span>
                </div>

                <div className="text-xs text-[#F4FAFA] leading-relaxed">
                  {explanation ? (
                    <div className="space-y-2">
                      <p>{explanation.executiveSummary}</p>
                      <div className="p-2.5 rounded-lg bg-[#071316]/80 border border-white/5 text-[11px] text-[#8DEBE3]">
                        <strong>Tactical Priority:</strong> {explanation.actionPrioritiesSummary}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[#91A9AB] animate-pulse">
                      Synthesizing plain-language engineering dispatch narrative from authoritative hydrology results...
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-[#91A9AB]/80 pt-1 border-t border-white/5 italic">
                  * Principle: AI explains the model; it does not calculate or modify physical flood numbers.
                </div>
              </div>
            )}

            {/* Side-by-side Before vs After Panels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* BASELINE */}
              <div className="rounded-2xl bg-[#071316]/90 border border-white/10 p-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#91A9AB]">
                    BASELINE (As-Is)
                  </span>
                  <span className="text-[11px] font-mono-num text-[#91A9AB]">{baseline.params.rainfallMm} mm Storm</span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#91A9AB]">Campus Risk:</span>
                    <span className={`font-bold font-mono-num px-2.5 py-0.5 rounded text-[11px] border ${
                      baseline.overallRisk === 'HIGH' ? 'bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]/40' :
                      baseline.overallRisk === 'MEDIUM' ? 'bg-[#F6B84B]/20 text-[#F6B84B] border-[#F6B84B]/40' :
                      'bg-[#49D7D0]/20 text-[#49D7D0] border-[#49D7D0]/40'
                    }`}>
                      {baseline.overallRisk}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono-num">
                    <span className="text-[#91A9AB]">Total Runoff:</span>
                    <span className="text-[#F4FAFA] font-bold">{baseline.totalRunoffM3.toLocaleString()} m³</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono-num">
                    <span className="text-[#91A9AB]">Captured Water:</span>
                    <span className="text-[#49D7D0] font-bold">{baseline.totalCapturedM3.toLocaleString()} m³</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono-num">
                    <span className="text-[#91A9AB]">Excess / Flood Risk:</span>
                    <span className="text-[#FF6B6B] font-bold">{baseline.totalExcessM3.toLocaleString()} m³</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono-num pt-2 border-t border-white/5">
                    <span className="text-[#91A9AB]">High-Risk Zones:</span>
                    <span className="text-[#FF6B6B] font-bold">{baseline.highRiskCount} Zones</span>
                  </div>
                </div>
              </div>

              {/* INTERVENTION (Simulated Scenario) */}
              <div className="rounded-2xl bg-gradient-to-b from-[#0F2A2F]/90 via-[#071316]/95 to-[#071316] border border-[#49D7D0]/50 p-5 space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#49D7D0]/20 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8DEBE3] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#49D7D0]" />
                    <span>INTERVENTION</span>
                  </span>
                  <span className="text-[11px] font-mono-num text-[#49D7D0] font-bold">
                    {localParams.rainfallMm} mm
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8DEBE3]">Campus Risk:</span>
                    <span className={`font-bold font-mono-num px-2.5 py-0.5 rounded text-[11px] border ${
                      simulated.overallRisk === 'HIGH' ? 'bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]/40' :
                      simulated.overallRisk === 'MEDIUM' ? 'bg-[#F6B84B]/20 text-[#F6B84B] border-[#F6B84B]/40' :
                      'bg-[#49D7D0]/20 text-[#8DEBE3] border-[#49D7D0]/50'
                    }`}>
                      {simulated.overallRisk}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono-num">
                    <span className="text-[#8DEBE3]">Total Runoff:</span>
                    <span className="text-[#F4FAFA] font-bold">{simulated.totalRunoffM3.toLocaleString()} m³</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono-num">
                    <span className="text-[#8DEBE3]">Captured Water:</span>
                    <span className="text-[#49D7D0] font-bold flex items-center gap-1">
                      {simulated.totalCapturedM3.toLocaleString()} m³
                      {deltas.capturedVolumeM3Delta > 0 && (
                        <span className="text-[10px] text-[#8DEBE3] font-normal">
                          (+{deltas.capturedVolumeM3Delta} m³)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono-num">
                    <span className="text-[#8DEBE3]">Excess / Flood Risk:</span>
                    <span className="text-[#FF6B6B] font-bold flex items-center gap-1">
                      {simulated.totalExcessM3.toLocaleString()} m³
                      {deltas.excessOverflowM3Delta > 0 && (
                        <span className="text-[10px] text-[#49D7D0] font-normal">
                          (-{deltas.excessOverflowM3Delta} m³)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono-num pt-2 border-t border-[#49D7D0]/20">
                    <span className="text-[#8DEBE3]">High-Risk Zones:</span>
                    <span className="text-[#49D7D0] font-bold">
                      {simulated.highRiskCount} Zones ({deltas.highRiskZonesReduced > 0 ? `${deltas.highRiskZonesReduced} Mitigated` : '0 change'})
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Impact Metric Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">

              <div className="p-3.5 rounded-xl bg-[#071316] border border-[#49D7D0]/15">
                <div className="text-[11px] text-[#91A9AB]">Capture Delta</div>
                <div className="text-base font-extrabold font-mono-num text-[#49D7D0] mt-0.5">
                  {deltas.capturedVolumeM3Delta >= 0 ? `+${deltas.capturedVolumeM3Delta}` : deltas.capturedVolumeM3Delta} m³
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#071316] border border-[#49D7D0]/15">
                <div className="text-[11px] text-[#91A9AB]">Excess Drop</div>
                <div className="text-base font-extrabold font-mono-num text-[#8DEBE3] mt-0.5">
                  {impact.excessReductionPct}%
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#071316] border border-[#49D7D0]/15">
                <div className="text-[11px] text-[#91A9AB]">Gross Harvest</div>
                <div className="text-base font-extrabold font-mono-num text-[#F4FAFA] mt-0.5">
                  {(simulated.totalCapturedM3 * 1000).toLocaleString()} L
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#071316] border border-[#49D7D0]/15">
                <div className="text-[11px] text-[#91A9AB]">Utility Autonomy</div>
                <div className="text-base font-extrabold font-mono-num text-[#49D7D0] mt-0.5">
                  {impact.campusDaysSupplyEquivalent} Days
                </div>
              </div>

            </div>

          </div>

          {/* Zone-by-Zone Differential Table */}
          <div className="rounded-3xl glass-panel-elevated p-6 space-y-4 border border-[#49D7D0]/20 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F4FAFA]">
                Zone-by-Zone Hydrological Transitions
              </h3>
              <span className="text-xs text-[#91A9AB] font-mono-num">
                {simulated.zones.length} Zones
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#49D7D0]/15 text-[#91A9AB] font-semibold">
                    <th className="pb-2.5">Zone</th>
                    <th className="pb-2.5">Baseline</th>
                    <th className="pb-2.5">Scenario</th>
                    <th className="pb-2.5 text-right">Runoff</th>
                    <th className="pb-2.5 text-right">Captured</th>
                    <th className="pb-2.5 text-right">Excess</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#49D7D0]/10 font-mono-num">
                  {simulated.zones.map((za) => {
                    const baseZa = baseline.zones.find((b) => b.zoneId === za.zoneId);
                    const isImproved = baseZa && (
                      (baseZa.riskLevel === 'HIGH' && za.riskLevel !== 'HIGH') ||
                      (baseZa.riskLevel === 'MEDIUM' && za.riskLevel === 'LOW')
                    );

                    return (
                      <tr key={za.zoneId} className="hover:bg-[#071316]/60 transition-colors">
                        <td className="py-3 font-semibold text-[#F4FAFA]">
                          {za.zoneCode} · {za.zoneName.split(' ')[0]}
                        </td>

                        <td className="py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            baseZa?.riskLevel === 'HIGH' ? 'text-[#FF6B6B]' :
                            baseZa?.riskLevel === 'MEDIUM' ? 'text-[#F6B84B]' : 'text-[#49D7D0]'
                          }`}>
                            {baseZa?.riskLevel}
                          </span>
                        </td>

                        <td className="py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            za.riskLevel === 'HIGH' ? 'bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]/40' :
                            za.riskLevel === 'MEDIUM' ? 'bg-[#F6B84B]/20 text-[#F6B84B] border-[#F6B84B]/40' :
                            'bg-[#49D7D0]/20 text-[#8DEBE3] border-[#49D7D0]/40'
                          }`}>
                            {za.riskLevel} {isImproved && '✓'}
                          </span>
                        </td>

                        <td className="py-3 text-right text-[#91A9AB]">
                          {za.runoffVolumeM3} m³
                        </td>

                        <td className="py-3 text-right text-[#49D7D0] font-bold">
                          {za.capturedVolumeM3} m³
                        </td>

                        <td className="py-3 text-right text-[#FF6B6B]">
                          {za.excessOverflowM3} m³
                        </td>

                        <td className="py-3 text-right">
                          <span className="text-[11px] font-bold text-[#8DEBE3]">
                            {za.recommendedIntervention}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions Routing */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#49D7D0]/15">
              <button
                onClick={onNavigateToActions}
                className="px-4 py-2.5 text-xs font-bold text-[#F4FAFA] hover:text-[#8DEBE3] glass-panel hover:bg-[#0F2A2F] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Generated Action Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onNavigateToImpact}
                className="px-4 py-2.5 text-xs font-bold text-[#071316] bg-gradient-to-r from-[#49D7D0] to-[#8DEBE3] hover:brightness-110 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-[#49D7D0]/20 cursor-pointer"
              >
                <span>Full Impact Metrics</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
