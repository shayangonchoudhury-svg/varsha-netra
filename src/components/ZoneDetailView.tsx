import React from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  CornerDownRight,
  Database,
  TriangleAlert,
  Building2,
  SlidersHorizontal,
  Layers,
  Info,
  Activity,
  Compass,
} from 'lucide-react';
import { CampusZone, ZoneAnalysis, ScenarioParams, InterventionType } from '../types/hydrology';

interface ZoneDetailViewProps {
  zone: CampusZone;
  analysis: ZoneAnalysis;
  params: ScenarioParams;
  onBackToMap: () => void;
  onNavigateToScenario: () => void;
  onSelectZone: (zoneId: string) => void;
  allZones: CampusZone[];
}

export const ZoneDetailView: React.FC<ZoneDetailViewProps> = ({
  zone,
  analysis,
  params,
  onBackToMap,
  onNavigateToScenario,
  onSelectZone,
  allZones,
}) => {
  const getInterventionIcon = (type: InterventionType) => {
    switch (type) {
      case 'PROTECT':
        return <ShieldCheck className="w-5 h-5 text-[#FF6B6B]" />;
      case 'REDIRECT':
        return <CornerDownRight className="w-5 h-5 text-[#F6B84B]" />;
      case 'STORE':
        return <Database className="w-5 h-5 text-[#49D7D0]" />;
    }
  };

  const isHighRisk = analysis.riskLevel === 'HIGH';
  const isMedRisk = analysis.riskLevel === 'MEDIUM';

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto relative z-10">

      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToMap}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#91A9AB] hover:text-[#F4FAFA] bg-[#0B2024] hover:bg-[#0F2A2F] px-4 py-2 rounded-xl border border-[#49D7D0]/20 transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-[#49D7D0]" />
          <span>Back to Digital Twin Map</span>
        </button>

        {/* Zone switcher pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-md scrollbar-none py-1">
          {allZones.map((z) => (
            <button
              key={z.id}
              onClick={() => onSelectZone(z.id)}
              className={`px-3 py-1.5 text-xs font-mono-num font-bold rounded-lg border transition-all shrink-0 cursor-pointer ${
                z.id === zone.id
                  ? 'bg-[#0F2A2F] text-[#8DEBE3] border-[#49D7D0] shadow-[0_0_10px_rgba(73,215,208,0.25)]'
                  : 'bg-[#071316]/70 text-[#91A9AB] border-white/5 hover:text-[#F4FAFA] hover:border-[#49D7D0]/30'
              }`}
            >
              {z.code}
            </button>
          ))}
        </div>
      </div>

      {/* Main Zone Hero Header */}
      <div className="rounded-3xl glass-panel-elevated p-6 sm:p-8 space-y-6 border border-[#49D7D0]/25 shadow-2xl">

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-num text-[#91A9AB]">
              <span className="px-2.5 py-0.5 rounded-md bg-[#071316] text-[#8DEBE3] font-bold border border-[#49D7D0]/30">
                {zone.code}
              </span>
              <span>Elevation: {zone.elevationMeters}m MSL</span>
              <span aria-hidden="true">·</span>
              <span>Total Area: {zone.totalAreaSqM.toLocaleString()} m²</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F4FAFA] tracking-tight mt-2">
              {zone.name}
            </h1>
            <p className="text-sm text-[#8DEBE3] mt-1 font-medium">{zone.subtitle}</p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#91A9AB]">
              Modeled Risk State
            </span>
            <span className={`text-sm font-bold font-mono-num px-3 py-1 rounded-lg border ${
              isHighRisk ? 'bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]/50' :
              isMedRisk ? 'bg-[#F6B84B]/20 text-[#F6B84B] border-[#F6B84B]/50' :
              'bg-[#49D7D0]/20 text-[#8DEBE3] border-[#49D7D0]/50'
            }`}>
              {analysis.riskLevel} RISK
            </span>
          </div>
        </div>

        <p className="text-sm text-[#91A9AB] leading-relaxed border-t border-[#49D7D0]/15 pt-4">
          {zone.description}
        </p>

        {/* 4 Primary Deterministic Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">

          <div className="p-4 rounded-2xl bg-[#071316]/90 border border-white/5">
            <div className="text-xs text-[#91A9AB]">Estimated Runoff</div>
            <div className="text-2xl font-extrabold font-mono-num text-[#F4FAFA] mt-1">
              {analysis.runoffVolumeM3} <span className="text-xs font-normal text-[#91A9AB]">m³</span>
            </div>
            <div className="text-[11px] text-[#91A9AB] font-mono-num mt-1">
              Peak: {analysis.peakRunoffRateM3Hr} m³/h
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#071316]/90 border border-white/5">
            <div className="text-xs text-[#91A9AB]">Drainage Capacity</div>
            <div className="text-2xl font-extrabold font-mono-num text-[#F4FAFA] mt-1">
              {analysis.drainageCapM3Hr} <span className="text-xs font-normal text-[#91A9AB]">m³/h</span>
            </div>
            <div className="text-[11px] text-[#91A9AB] font-mono-num mt-1">
              Stress Ratio: {analysis.drainageStressRatio}x
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#49D7D0]/10 border border-[#49D7D0]/30">
            <div className="text-xs text-[#8DEBE3] font-semibold">Capture Potential</div>
            <div className="text-2xl font-extrabold font-mono-num text-[#49D7D0] mt-1">
              {analysis.capturePotentialM3} <span className="text-xs font-normal text-[#49D7D0]/70">m³</span>
            </div>
            <div className="text-[11px] text-[#8DEBE3] font-mono-num mt-1">
              Captured: {analysis.capturedVolumeM3} m³
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30">
            <div className="text-xs text-[#FF6B6B] font-semibold">Excess / Overflow</div>
            <div className="text-2xl font-extrabold font-mono-num text-[#FF6B6B] mt-1">
              {analysis.excessOverflowM3} <span className="text-xs font-normal text-[#FF6B6B]/70">m³</span>
            </div>
            <div className="text-[11px] text-[#FF6B6B] mt-1">
              {analysis.excessOverflowM3 > 0 ? 'Ponding risk' : 'Zero excess'}
            </div>
          </div>

        </div>

      </div>

      {/* Deep Risk & Deterministic Causality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Why this zone has this risk */}
        <div className="rounded-3xl glass-panel-elevated p-6 space-y-4 border border-[#49D7D0]/20">
          <div className="flex items-center gap-2">
            <TriangleAlert className={`w-5 h-5 ${isHighRisk ? 'text-[#FF6B6B]' : isMedRisk ? 'text-[#F6B84B]' : 'text-[#49D7D0]'}`} />
            <h3 className="text-base font-bold text-[#F4FAFA]">
              Why This Zone Has {analysis.riskLevel} Risk
            </h3>
          </div>

          <div className="space-y-2.5">
            {analysis.riskFactors.map((factor, index) => (
              <div key={index} className="flex items-start gap-2.5 text-xs text-[#91A9AB] bg-[#071316]/80 p-3.5 rounded-xl border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#49D7D0] mt-1.5 shrink-0" />
                <span className="leading-relaxed text-[#F4FAFA]">{factor}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#49D7D0]/15 text-xs text-[#91A9AB] leading-relaxed flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#49D7D0] shrink-0" />
            <span>
              Deterministic Rational formula: Q = (C · I · A) / 360 with composite runoff coefficient C = {zone.runoffCoefficient}.
            </span>
          </div>
        </div>

        {/* Recommended Intervention Strategy */}
        <div className="rounded-3xl glass-panel-elevated p-6 space-y-4 border border-[#49D7D0]/30 bg-gradient-to-b from-[#0F2A2F]/60 via-[#0B2024]/80 to-[#071316]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getInterventionIcon(analysis.recommendedIntervention)}
              <h3 className="text-base font-bold text-[#F4FAFA]">
                Recommended Intervention
              </h3>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-bold font-mono-num bg-[#071316] text-[#8DEBE3] border border-[#49D7D0]/40">
              {analysis.recommendedIntervention}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#071316]/90 border border-white/5 space-y-1.5">
            <div className="text-xs font-bold text-[#8DEBE3]">Engineering Protocol Reason:</div>
            <p className="text-xs text-[#91A9AB] leading-relaxed">
              {analysis.interventionReason}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#071316]/90 border border-white/5 space-y-1.5">
            <div className="text-xs font-bold text-[#49D7D0]">Expected Modeled Impact:</div>
            <p className="text-xs text-[#91A9AB] leading-relaxed">
              {analysis.expectedModeledImpact}
            </p>
          </div>

          <button
            onClick={onNavigateToScenario}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#49D7D0] to-[#8DEBE3] hover:brightness-110 text-[#071316] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#49D7D0]/20"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Simulate Upgrades for {zone.name}</span>
          </button>
        </div>

      </div>

      {/* Surface Breakdown & Co-Located Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Surface Area Breakdown */}
        <div className="rounded-3xl glass-panel-elevated p-6 space-y-4 border border-[#49D7D0]/20">
          <h3 className="text-base font-bold text-[#F4FAFA] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#49D7D0]" />
            <span>Surface Substrate Composition</span>
          </h3>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#071316] border border-white/5">
              <span className="text-[#91A9AB] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#49D7D0]" />
                Rooftops (Harvestable Yield)
              </span>
              <span className="font-mono-num font-bold text-[#F4FAFA]">
                {zone.surfaceBreakdown.roofSqM.toLocaleString()} m² ({Math.round(zone.surfaceBreakdown.roofSqM / zone.totalAreaSqM * 100)}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#071316] border border-white/5">
              <span className="text-[#91A9AB] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#FF6B6B]/80" />
                Bituminous / Impervious Roadways
              </span>
              <span className="font-mono-num font-bold text-[#F4FAFA]">
                {zone.surfaceBreakdown.imperviousPavedSqM.toLocaleString()} m² ({Math.round(zone.surfaceBreakdown.imperviousPavedSqM / zone.totalAreaSqM * 100)}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#071316] border border-white/5">
              <span className="text-[#91A9AB] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
                Permeable Turf & Athletic Grounds
              </span>
              <span className="font-mono-num font-bold text-[#F4FAFA]">
                {zone.surfaceBreakdown.permeableTurfSqM.toLocaleString()} m² ({Math.round(zone.surfaceBreakdown.permeableTurfSqM / zone.totalAreaSqM * 100)}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#071316] border border-white/5">
              <span className="text-[#91A9AB] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#8DEBE3]" />
                Bio-Retention Swales & Gardens
              </span>
              <span className="font-mono-num font-bold text-[#F4FAFA]">
                {zone.surfaceBreakdown.bioRetentionSqM.toLocaleString()} m² ({Math.round(zone.surfaceBreakdown.bioRetentionSqM / zone.totalAreaSqM * 100)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Critical Co-Located Assets */}
        <div className="rounded-3xl glass-panel-elevated p-6 space-y-4 border border-[#49D7D0]/20">
          <h3 className="text-base font-bold text-[#F4FAFA] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#49D7D0]" />
            <span>Co-Located Critical Infrastructure</span>
          </h3>

          <div className="space-y-2.5">
            {zone.criticalAssets.map((asset, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#071316] border border-white/5 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-[#F4FAFA]">{asset.name}</div>
                  <div className="text-[11px] text-[#91A9AB] font-mono-num uppercase mt-0.5">
                    Category: {asset.type.replace('_', ' ')}
                  </div>
                </div>

                <span className={`text-[10px] font-bold font-mono-num px-2.5 py-0.5 rounded-md border ${
                  asset.elevationRisk === 'critical' ? 'bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]/40' :
                  asset.elevationRisk === 'moderate' ? 'bg-[#F6B84B]/20 text-[#F6B84B] border-[#F6B84B]/40' :
                  'bg-[#49D7D0]/20 text-[#49D7D0] border-[#49D7D0]/40'
                }`}>
                  {asset.elevationRisk.toUpperCase()} EXPOSURE
                </span>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-[#071316]/70 border border-white/5 text-xs text-[#91A9AB]">
            Drainage destination: <strong className="text-[#8DEBE3]">{zone.flowDestinationId ? allZones.find(z => z.id === zone.flowDestinationId)?.name : 'Terminal Detention (Eco-Lake)'}</strong>
          </div>
        </div>

      </div>

    </div>
  );
};
