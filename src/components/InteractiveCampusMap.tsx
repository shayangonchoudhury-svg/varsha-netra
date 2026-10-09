import React, { useState } from 'react';
import {
  Layers,
  Waves,
  Eye,
  ArrowUpRight,
  ChevronRight,
  CloudRain,
  Compass,
  Map as MapIcon,
  Activity,
  Globe,
  Radio,
  SlidersHorizontal,
  TriangleAlert,
  ShieldAlert,
  ShieldCheck,
  Droplets,
  ArrowRight,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { CampusZone, SimulationResult, ZoneAnalysis } from '../types/hydrology';
import { RealLeafletCampusMap } from './RealLeafletCampusMap';

interface InteractiveCampusMapProps {
  zones: CampusZone[];
  simulation: SimulationResult;
  selectedZoneId: string | null;
  scenarioSource?: 'LIVE_WEATHER' | 'DEMO_PRESET' | 'CUSTOM';
  scenarioLabel?: string;
  onSelectZone: (zoneId: string) => void;
  onOpenZoneDetail: (zoneId: string) => void;
  onNavigateToActions?: () => void;
  onNavigateToImpact?: () => void;
  onNavigateToScenario?: () => void;
}

export const InteractiveCampusMap: React.FC<InteractiveCampusMapProps> = ({
  zones,
  simulation,
  selectedZoneId,
  scenarioSource = 'DEMO_PRESET',
  scenarioLabel = '72 mm Storm Scenario',
  onSelectZone,
  onOpenZoneDetail,
  onNavigateToActions,
  onNavigateToImpact,
  onNavigateToScenario,
}) => {
  const [mapMode, setMapMode] = useState<'real_map' | 'schematic_twin'>('real_map');
  const [showFlowVectors, setShowFlowVectors] = useState(true);
  const [showDrainageNetwork, setShowDrainageNetwork] = useState(true);
  const [showContours, setShowContours] = useState(true);
  const [showRainOverlay, setShowRainOverlay] = useState(true);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  // Map zone analyses by ID
  const analysisMap = new Map<string, ZoneAnalysis>();
  simulation.zones.forEach((za) => analysisMap.set(za.zoneId, za));

  const activeZone = zones.find((z) => z.id === (hoveredZoneId || selectedZoneId)) || zones[0];
  const activeAnalysis = analysisMap.get(activeZone.id);

  const isLive = scenarioSource === 'LIVE_WEATHER';
  const isCustom = scenarioSource === 'CUSTOM';

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return {
          fill: 'rgba(255, 107, 107, 0.22)',
          stroke: '#FF6B6B',
          glow: 'rgba(255, 107, 107, 0.4)',
          text: 'text-[#FF6B6B]',
          badge: 'bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]/50',
          dot: 'bg-[#FF6B6B]',
        };
      case 'MEDIUM':
        return {
          fill: 'rgba(246, 184, 75, 0.18)',
          stroke: '#F6B84B',
          glow: 'rgba(246, 184, 75, 0.35)',
          text: 'text-[#F6B84B]',
          badge: 'bg-[#F6B84B]/20 text-[#F6B84B] border-[#F6B84B]/50',
          dot: 'bg-[#F6B84B]',
        };
      case 'LOW':
      default:
        return {
          fill: 'rgba(73, 215, 208, 0.16)',
          stroke: '#49D7D0',
          glow: 'rgba(73, 215, 208, 0.35)',
          text: 'text-[#49D7D0]',
          badge: 'bg-[#49D7D0]/20 text-[#8DEBE3] border-[#49D7D0]/40',
          dot: 'bg-[#49D7D0]',
        };
    }
  };

  return (
    <div className="space-y-6 pb-16 relative z-10">

      {/* 1. DIGITAL TWIN HEADER WITH DYNAMIC ACTIVE MODEL INFO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#49D7D0]/15 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#F4FAFA] tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#49D7D0]" />
              <span>Campus Hydrology Digital Twin</span>
            </h1>

            {/* Dynamic Active Model Source Badge */}
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#49D7D0]/15 border border-[#49D7D0]/40 text-xs font-mono-num font-bold text-[#8DEBE3]">
                <Radio className="w-3.5 h-3.5 text-[#49D7D0] animate-pulse" />
                <span>LIVE WEATHER MODEL [INPUT]</span>
              </span>
            ) : isCustom ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F2A2F] border border-[#49D7D0]/40 text-xs font-mono-num font-bold text-[#8DEBE3]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#49D7D0]" />
                <span>CUSTOM SIMULATION [SIMULATED]</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F6B84B]/15 border border-[#F6B84B]/40 text-xs font-mono-num font-bold text-[#F6B84B]">
                <CloudRain className="w-3.5 h-3.5 text-[#F6B84B]" />
                <span>DEMO SCENARIO [DEMO]</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[#91A9AB] mt-1.5">
            <span className="font-mono-num font-bold text-[#49D7D0]">
              {simulation.params.rainfallMm} mm · {simulation.params.durationHours} HOUR {isLive ? 'FORECAST' : isCustom ? 'CUSTOM RUN' : 'SCENARIO'}
            </span>
            <span className="text-white/20">|</span>
            <span className="text-[#8DEBE3] font-semibold uppercase tracking-wide">
              MODELLED CAMPUS RESPONSE [MODELLED]
            </span>
            <span className="text-white/20">|</span>
            <span>OpenStreetMap real geography with deterministic hydrology overlay</span>
          </div>
        </div>

        {/* View Mode & Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">

          {/* Mode Switch: Real Map vs Digital Twin Schematic */}
          <div className="flex items-center bg-[#071316] p-1 rounded-xl border border-[#49D7D0]/30 shadow-md">
            <button
              onClick={() => setMapMode('real_map')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mapMode === 'real_map'
                  ? 'bg-gradient-to-r from-[#49D7D0] to-[#8DEBE3] text-[#071316] shadow-sm'
                  : 'text-[#91A9AB] hover:text-[#F4FAFA]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>REAL MAP</span>
            </button>
            <button
              onClick={() => setMapMode('schematic_twin')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mapMode === 'schematic_twin'
                  ? 'bg-[#0F2A2F] text-[#8DEBE3] border border-[#49D7D0]/40 shadow-sm'
                  : 'text-[#91A9AB] hover:text-[#F4FAFA]'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>DIGITAL TWIN (SVG)</span>
            </button>
          </div>

          {/* Layer Toggles */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#0B2024]/80 p-1.5 rounded-xl border border-[#49D7D0]/20 backdrop-blur-md">
            <button
              onClick={() => setShowFlowVectors(!showFlowVectors)}
              title="Toggle Modelled Surface Runoff Vectors"
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                showFlowVectors ? 'bg-[#0F2A2F] text-[#8DEBE3] border border-[#49D7D0]/40 shadow-sm' : 'text-[#91A9AB] hover:text-[#F4FAFA]'
              }`}
            >
              <Waves className="w-3.5 h-3.5 text-[#49D7D0]" />
              <span className="hidden sm:inline">Flow Vectors</span>
              <span className="sm:hidden">Flow</span>
            </button>

            <button
              onClick={() => setShowDrainageNetwork(!showDrainageNetwork)}
              title="Toggle Modelled Storm Conduits & Sluices"
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                showDrainageNetwork ? 'bg-[#0F2A2F] text-[#8DEBE3] border border-[#49D7D0]/40 shadow-sm' : 'text-[#91A9AB] hover:text-[#F4FAFA]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#49D7D0]" />
              <span className="hidden sm:inline">Storm Conduits</span>
              <span className="sm:hidden">Conduits</span>
            </button>

            <button
              onClick={() => setShowContours(!showContours)}
              title="Toggle Modelled Boundaries & Risk"
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                showContours ? 'bg-[#0F2A2F] text-[#8DEBE3] border border-[#49D7D0]/40 shadow-sm' : 'text-[#91A9AB] hover:text-[#F4FAFA]'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-[#49D7D0]" />
              <span className="hidden sm:inline">Zone Risk</span>
              <span className="sm:hidden">Risk</span>
            </button>

            <button
              onClick={() => setShowRainOverlay(!showRainOverlay)}
              title="Toggle Simulated Rain Canvas"
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                showRainOverlay ? 'bg-[#0F2A2F] text-[#8DEBE3] border border-[#49D7D0]/40 shadow-sm' : 'text-[#91A9AB] hover:text-[#F4FAFA]'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5 text-[#49D7D0]" />
              <span className="hidden sm:inline">Rainfall</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. RAINFALL STATUS STRIP & ACTIVE MODEL SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl glass-panel-subtle border border-[#49D7D0]/20 space-y-1">
          <div className="text-[11px] text-[#8DEBE3] font-semibold uppercase tracking-wider flex items-center gap-1">
            <CloudRain className="w-3.5 h-3.5 text-[#49D7D0]" />
            <span>Rain Input [INPUT]</span>
          </div>
          <div className="text-lg font-extrabold font-mono-num text-[#49D7D0]">
            {simulation.params.rainfallMm} mm
          </div>
          <div className="text-[10px] text-[#91A9AB]">Window: {simulation.params.durationHours}h</div>
        </div>

        <div className="p-3.5 rounded-2xl glass-panel-subtle border border-white/10 space-y-1">
          <div className="text-[11px] text-[#91A9AB] font-semibold uppercase tracking-wider">
            Model Source
          </div>
          <div className="text-xs font-bold text-[#F4FAFA] truncate">
            {isLive ? 'Live Weather' : isCustom ? 'Custom Simulator' : 'Demo Preset'}
          </div>
          <div className="text-[10px] text-[#8DEBE3] font-mono-num">
            {simulation.params.stormProfile.replace('_', ' ')}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl glass-panel-subtle border border-white/10 space-y-1">
          <div className="text-[11px] text-[#91A9AB] font-semibold uppercase tracking-wider">
            7 Zones Analyzed
          </div>
          <div className="flex items-center gap-2 font-mono-num font-bold text-xs pt-1">
            <span className="text-[#FF6B6B]">{simulation.highRiskCount} High</span>
            <span className="text-[#F6B84B]">{simulation.mediumRiskCount} Med</span>
            <span className="text-[#49D7D0]">{simulation.lowRiskCount} Low</span>
          </div>
          <div className="text-[10px] text-[#91A9AB]">Deterministic Scoring</div>
        </div>

        <div className="p-3.5 rounded-2xl glass-panel-subtle border border-white/10 space-y-1">
          <div className="text-[11px] text-[#91A9AB] font-semibold uppercase tracking-wider">
            Total Runoff [MODELLED]
          </div>
          <div className="text-lg font-extrabold font-mono-num text-[#F4FAFA]">
            {simulation.totalRunoffM3.toLocaleString()} m³
          </div>
          <div className="text-[10px] text-[#91A9AB]">Surface Kinematics</div>
        </div>

        <div className="p-3.5 rounded-2xl glass-panel-subtle border border-[#49D7D0]/20 space-y-1">
          <div className="text-[11px] text-[#8DEBE3] font-semibold uppercase tracking-wider">
            Captured [MODELLED]
          </div>
          <div className="text-lg font-extrabold font-mono-num text-[#8DEBE3]">
            {simulation.totalCapturedM3.toLocaleString()} m³
          </div>
          <div className="text-[10px] text-[#49D7D0]">{simulation.captureEfficiencyPct}% Efficiency</div>
        </div>

        <div className="p-3.5 rounded-2xl glass-panel-subtle border border-[#FF6B6B]/20 space-y-1">
          <div className="text-[11px] text-[#FF6B6B] font-semibold uppercase tracking-wider">
            Excess Flood [MODELLED]
          </div>
          <div className="text-lg font-extrabold font-mono-num text-[#FF6B6B]">
            {simulation.totalExcessM3.toLocaleString()} m³
          </div>
          <div className="text-[10px] text-[#91A9AB]">Standing Surface Ponding</div>
        </div>
      </div>

      {/* 3. MAIN MAP & COMMAND CENTER SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Interactive Map Canvas (8 Cols) */}
        <div className="lg:col-span-8 rounded-3xl glass-panel-elevated overflow-hidden relative shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-[#49D7D0]/25 flex flex-col">

          {mapMode === 'real_map' ? (
            /* REAL LEAFLET OPENSTREETMAP GEOGRAPHIC VISUALIZATION */
            <RealLeafletCampusMap
              zones={zones}
              simulation={simulation}
              selectedZoneId={selectedZoneId}
              scenarioSource={scenarioSource}
              scenarioLabel={scenarioLabel}
              onSelectZone={onSelectZone}
              onOpenZoneDetail={onOpenZoneDetail}
              onNavigateToActions={onNavigateToActions}
              onNavigateToImpact={onNavigateToImpact}
              showFlowVectors={showFlowVectors}
              showDrainageNetwork={showDrainageNetwork}
              showZonePolygons={showContours}
              showRainOverlay={showRainOverlay}
            />
          ) : (
            /* SCHEMATIC SVG DIGITAL TWIN FALLBACK */
            <div className="relative w-full h-[540px] sm:h-[600px] lg:h-[640px] flex flex-col justify-between">
              {/* Map Top Status Bar */}
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                <div className="bg-[#071316]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#49D7D0]/25 text-xs font-mono-num flex items-center gap-2.5 shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#49D7D0] animate-ping" />
                  <span className="text-[#91A9AB]">
                    {isLive ? 'Live Rain [INPUT]:' : 'Simulated Rain [INPUT]:'}{' '}
                    <strong className="text-[#8DEBE3]">{simulation.params.rainfallMm} mm</strong>
                  </span>
                  <span className="text-[#49D7D0]/30">|</span>
                  <span className="text-[#91A9AB]">Runoff [MODELLED]: <strong className="text-[#F4FAFA]">{simulation.totalRunoffM3.toLocaleString()} m³</strong></span>
                </div>

                <div className="hidden sm:flex items-center gap-3 bg-[#071316]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#49D7D0]/25 text-[11px] font-mono-num shadow-lg">
                  <span className="flex items-center gap-1.5 text-[#49D7D0] font-bold"><span className="w-2 h-2 rounded-full bg-[#49D7D0]" /> LOW</span>
                  <span className="flex items-center gap-1.5 text-[#F6B84B] font-bold"><span className="w-2 h-2 rounded-full bg-[#F6B84B]" /> MEDIUM</span>
                  <span className="flex items-center gap-1.5 text-[#FF6B6B] font-bold"><span className="w-2 h-2 rounded-full bg-[#FF6B6B]" /> HIGH</span>
                </div>
              </div>

              {/* SVG Vector Canvas */}
              <div className="relative w-full h-full bg-[#071316] select-none flex-1">
                {showRainOverlay && (
                  <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <pattern id="twin-rain-pattern" width="36" height="36" patternUnits="userSpaceOnUse">
                        <line x1="8" y1="0" x2="0" y2="18" stroke="#49D7D0" strokeWidth="1" strokeDasharray="2,5" />
                        <line x1="26" y1="8" x2="18" y2="28" stroke="#49D7D0" strokeWidth="1" strokeDasharray="2,5" />
                      </pattern>
                      <rect width="100%" height="100%" fill="url(#twin-rain-pattern)" className="animate-pulse" />
                    </svg>
                  </div>
                )}

                <svg
                  viewBox="0 0 800 600"
                  className="w-full h-full drop-shadow-2xl"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <marker
                      id="twin-flow-arrow"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#49D7D0" />
                    </marker>
                    <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  <g opacity="0.12" stroke="#49D7D0" strokeWidth="0.7" strokeDasharray="4,6">
                    <line x1="0" y1="150" x2="800" y2="150" />
                    <line x1="0" y1="300" x2="800" y2="300" />
                    <line x1="0" y1="450" x2="800" y2="450" />
                    <line x1="200" y1="0" x2="200" y2="600" />
                    <line x1="400" y1="0" x2="400" y2="600" />
                    <line x1="600" y1="0" x2="600" y2="600" />
                  </g>

                  {showContours && (
                    <g opacity="0.22" stroke="#8DEBE3" strokeWidth="1.2" fill="none">
                      <path d="M 120 50 Q 300 20 600 30 Q 750 60 760 140" strokeDasharray="3,4" />
                      <path d="M 80 200 Q 320 180 560 210 Q 760 250 780 340" />
                      <path d="M 50 320 Q 280 340 500 360 Q 700 380 780 440" strokeDasharray="5,5" />
                      <ellipse cx="400" cy="480" rx="160" ry="70" stroke="#49D7D0" strokeWidth="1.8" strokeDasharray="3,3" />
                    </g>
                  )}

                  {showDrainageNetwork && (
                    <g stroke="#91A9AB" strokeWidth="2.5" fill="none" opacity="0.5">
                      <path d="M 260 150 L 370 240" strokeDasharray="6,4" />
                      <path d="M 580 80 L 650 200" strokeDasharray="6,4" />
                      <path d="M 420 320 L 400 440" stroke="#49D7D0" strokeWidth="3" />
                      <path d="M 640 280 L 460 450" stroke="#49D7D0" strokeWidth="3" />
                      <path d="M 180 410 L 320 460" stroke="#FF6B6B" strokeWidth="3" strokeDasharray="4,2" />
                      <path d="M 620 440 L 480 480" stroke="#F6B84B" strokeWidth="3" />
                    </g>
                  )}

                  {showFlowVectors && (
                    <g stroke="#49D7D0" strokeWidth="2.5" fill="none" className="animate-flow-stream" markerEnd="url(#twin-flow-arrow)">
                      <path d="M 260 140 Q 340 180 380 250" strokeDasharray="6,6" />
                      <path d="M 410 270 Q 420 360 400 440" strokeDasharray="6,6" />
                      <path d="M 650 220 Q 560 320 460 450" strokeDasharray="6,6" />
                      <path d="M 140 390 Q 230 420 320 460" strokeDasharray="6,6" />
                      <path d="M 630 440 Q 550 465 480 480" strokeDasharray="6,6" />
                      <path d="M 580 65 Q 620 120 640 190" strokeDasharray="6,6" />
                    </g>
                  )}

                  {zones.map((zone) => {
                    const analysis = analysisMap.get(zone.id);
                    const risk = analysis ? analysis.riskLevel : 'LOW';
                    const colors = getRiskColor(risk);
                    const isSelected = selectedZoneId === zone.id;
                    const isHovered = hoveredZoneId === zone.id;

                    return (
                      <g
                        key={zone.id}
                        className="cursor-pointer transition-all duration-200"
                        onClick={() => onSelectZone(zone.id)}
                        onMouseEnter={() => setHoveredZoneId(zone.id)}
                        onMouseLeave={() => setHoveredZoneId(null)}
                      >
                        <path
                          d={zone.svgPath}
                          fill={colors.fill}
                          stroke={isSelected ? '#F4FAFA' : isHovered ? colors.stroke : colors.stroke}
                          strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.5}
                          className="transition-all duration-200"
                          filter={isSelected ? 'url(#glow-filter)' : undefined}
                        />

                        <g transform={`translate(${zone.mapCoordinates.cx}, ${zone.mapCoordinates.cy})`}>
                          {risk === 'HIGH' && (
                            <circle
                              r="18"
                              fill="none"
                              stroke="#FF6B6B"
                              strokeWidth="2"
                              className="animate-ping opacity-60"
                            />
                          )}

                          <circle
                            r="13"
                            fill="#071316"
                            stroke={isSelected ? '#F4FAFA' : colors.stroke}
                            strokeWidth="2.2"
                          />

                          <text
                            textAnchor="middle"
                            dy="3.5"
                            fill="#F4FAFA"
                            fontSize="9.5"
                            fontWeight="800"
                            fontFamily="monospace"
                          >
                            {zone.code}
                          </text>
                        </g>

                        <g transform={`translate(${zone.mapCoordinates.cx}, ${zone.mapCoordinates.cy + 22})`}>
                          <rect
                            x="-65"
                            y="-8"
                            width="130"
                            height="17"
                            rx="5"
                            fill="#071316"
                            fillOpacity="0.9"
                            stroke={colors.stroke}
                            strokeWidth="0.85"
                          />
                          <text
                            textAnchor="middle"
                            dy="4.5"
                            fill="#F4FAFA"
                            fontSize="8.5"
                            fontWeight="700"
                          >
                            {zone.name.split('&')[0]} ({zone.elevationMeters}m)
                          </text>
                        </g>
                      </g>
                    );
                  })}

                  <g transform="translate(390, 480)" pointerEvents="none">
                    <circle r="36" fill="#49D7D0" fillOpacity="0.25" stroke="#49D7D0" strokeWidth="1.8" className="animate-water-pulse" />
                    <circle r="22" fill="#0B2024" fillOpacity="0.8" stroke="#8DEBE3" strokeWidth="1.2" strokeDasharray="3,3" />
                    <text textAnchor="middle" dy="-3" fill="#8DEBE3" fontSize="9" fontWeight="800">
                      CENTRAL DETENTION
                    </text>
                    <text textAnchor="middle" dy="9" fill="#49D7D0" fontSize="8" fontFamily="monospace">
                      ECO-LAKE (38.5m) [MODELLED SINK]
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          )}

          {/* Map Footer Bar (for Schematic View) */}
          {mapMode === 'schematic_twin' && (
            <div className="p-3 sm:p-3.5 bg-[#071316]/95 border-t border-[#49D7D0]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#91A9AB]">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#49D7D0] shrink-0" />
                <span>Schematic topology view · Click zone to focus diagnostics</span>
              </span>
              <button
                onClick={() => onOpenZoneDetail(activeZone.id)}
                className="text-[#49D7D0] hover:text-[#8DEBE3] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <span>Inspect {activeZone.code} Telemetry</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Selected Zone Command Center Diagnostic Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">

          <div className="rounded-3xl glass-panel-elevated p-6 space-y-5 border border-[#49D7D0]/20 shadow-xl">

            {/* Zone Header */}
            <div className="flex items-start justify-between gap-2 border-b border-[#49D7D0]/15 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold font-mono-num bg-[#071316] text-[#8DEBE3] border border-[#49D7D0]/40">
                    {activeZone.code}
                  </span>
                  <span className="text-xs text-[#91A9AB] font-mono-num">{activeZone.elevationMeters}m Elevation</span>
                </div>
                <h3 className="text-base font-bold text-[#F4FAFA] mt-1.5">
                  {activeZone.name}
                </h3>
                <div className="text-xs text-[#8DEBE3] mt-0.5 font-medium">{activeZone.subtitle}</div>
              </div>

              {activeAnalysis && (
                <span className={`text-xs font-bold font-mono-num px-2.5 py-1 rounded-lg border ${
                  activeAnalysis.riskLevel === 'HIGH' ? 'bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]/50' :
                  activeAnalysis.riskLevel === 'MEDIUM' ? 'bg-[#F6B84B]/20 text-[#F6B84B] border-[#F6B84B]/50' :
                  'bg-[#49D7D0]/20 text-[#8DEBE3] border-[#49D7D0]/50'
                }`}>
                  {activeAnalysis.riskLevel} RISK
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-[#91A9AB] leading-relaxed">
              {activeZone.description}
            </p>

            {/* Surface Composition */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[#91A9AB]">
                <span className="font-semibold text-[#F4FAFA]">Surface Composition</span>
                <span className="font-mono-num text-[#8DEBE3]">C = {activeZone.runoffCoefficient}</span>
              </div>

              <div className="h-2.5 w-full rounded-full bg-[#071316] overflow-hidden flex border border-[#49D7D0]/20">
                <div
                  title={`Roof: ${activeZone.surfaceBreakdown.roofSqM} m²`}
                  style={{ width: `${(activeZone.surfaceBreakdown.roofSqM / activeZone.totalAreaSqM) * 100}%` }}
                  className="bg-[#49D7D0] h-full"
                />
                <div
                  title={`Impervious: ${activeZone.surfaceBreakdown.imperviousPavedSqM} m²`}
                  style={{ width: `${(activeZone.surfaceBreakdown.imperviousPavedSqM / activeZone.totalAreaSqM) * 100}%` }}
                  className="bg-[#FF6B6B]/80 h-full"
                />
                <div
                  title={`Permeable: ${activeZone.surfaceBreakdown.permeableTurfSqM} m²`}
                  style={{ width: `${(activeZone.surfaceBreakdown.permeableTurfSqM / activeZone.totalAreaSqM) * 100}%` }}
                  className="bg-[#10b981] h-full"
                />
                <div
                  title={`Bio-retention: ${activeZone.surfaceBreakdown.bioRetentionSqM} m²`}
                  style={{ width: `${(activeZone.surfaceBreakdown.bioRetentionSqM / activeZone.totalAreaSqM) * 100}%` }}
                  className="bg-[#8DEBE3] h-full"
                />
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#91A9AB] pt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#49D7D0]" /> Roof {Math.round(activeZone.surfaceBreakdown.roofSqM / activeZone.totalAreaSqM * 100)}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#FF6B6B]/80" /> Paved {Math.round(activeZone.surfaceBreakdown.imperviousPavedSqM / activeZone.totalAreaSqM * 100)}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#10b981]" /> Turf {Math.round(activeZone.surfaceBreakdown.permeableTurfSqM / activeZone.totalAreaSqM * 100)}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#8DEBE3]" /> Swale {Math.round(activeZone.surfaceBreakdown.bioRetentionSqM / activeZone.totalAreaSqM * 100)}%</span>
              </div>
            </div>

            {/* Hydrological Metrics Grid with [MODELLED] Tags */}
            {activeAnalysis && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#F4FAFA] uppercase">Hydrological Telemetry</span>
                  <span className="text-[10px] text-[#8DEBE3] font-mono-num font-semibold">[MODELLED]</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#071316]/80 border border-white/5">
                    <div className="text-[11px] text-[#91A9AB]">Modeled Runoff</div>
                    <div className="text-sm font-bold font-mono-num text-[#F4FAFA] mt-0.5">
                      {activeAnalysis.runoffVolumeM3} m³
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#071316]/80 border border-white/5">
                    <div className="text-[11px] text-[#91A9AB]">Drainage Cap</div>
                    <div className="text-sm font-bold font-mono-num text-[#F4FAFA] mt-0.5">
                      {activeAnalysis.drainageCapM3Hr} m³/h
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#49D7D0]/10 border border-[#49D7D0]/30">
                    <div className="text-[11px] text-[#8DEBE3] font-semibold">Capture Potential</div>
                    <div className="text-sm font-bold font-mono-num text-[#49D7D0] mt-0.5">
                      {activeAnalysis.capturePotentialM3} m³
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30">
                    <div className="text-[11px] text-[#FF6B6B] font-semibold">Excess Overflow</div>
                    <div className="text-sm font-bold font-mono-num text-[#FF6B6B] mt-0.5">
                      {activeAnalysis.excessOverflowM3} m³
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommended Intervention Banner */}
            {activeAnalysis && (
              <div className="p-4 rounded-2xl bg-[#071316]/90 border border-[#49D7D0]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#8DEBE3] uppercase tracking-wider">
                    Recommended Action
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold font-mono-num bg-[#0F2A2F] text-[#8DEBE3] border border-[#49D7D0]/40">
                    {activeAnalysis.recommendedIntervention}
                  </span>
                </div>
                <p className="text-xs text-[#91A9AB] leading-relaxed">
                  {activeAnalysis.interventionReason}
                </p>
              </div>
            )}

            {/* Connected Action Buttons (Direct Map Navigation) */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => onOpenZoneDetail(activeZone.id)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0F2A2F] hover:bg-[#143940] border border-[#49D7D0]/30 text-xs font-bold text-[#8DEBE3] hover:text-[#F4FAFA] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>Inspect {activeZone.code} Telemetry</span>
                <ChevronRight className="w-4 h-4 text-[#49D7D0]" />
              </button>

              {onNavigateToActions && (
                <button
                  onClick={onNavigateToActions}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#071316] hover:bg-[#0B2024] border border-white/10 text-xs font-bold text-[#F4FAFA] hover:text-[#8DEBE3] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-[#FF6B6B]" />
                  <span>View Action Plan Directives →</span>
                </button>
              )}

              {onNavigateToImpact && (
                <button
                  onClick={onNavigateToImpact}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-[#91A9AB] hover:text-[#49D7D0] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Droplets className="w-3.5 h-3.5" />
                  <span>View Impact & Reserves Valuation →</span>
                </button>
              )}
            </div>

          </div>

          {/* Quick Zone Selector Strip */}
          <div className="rounded-2xl glass-panel p-4 space-y-2.5 border border-[#49D7D0]/15">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#91A9AB]">
              Campus Zone Selectors
            </span>
            <div className="grid grid-cols-2 gap-2">
              {zones.map((z) => {
                const za = analysisMap.get(z.id);
                const isCurrent = z.id === activeZone.id;
                return (
                  <button
                    key={z.id}
                    onClick={() => onSelectZone(z.id)}
                    className={`p-2.5 text-left rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? 'bg-[#0F2A2F] border-[#49D7D0] text-[#F4FAFA] font-bold shadow-[0_0_10px_rgba(73,215,208,0.2)]'
                        : 'bg-[#071316]/70 border-white/5 text-[#91A9AB] hover:text-[#F4FAFA] hover:border-[#49D7D0]/30'
                    }`}
                  >
                    <span className="truncate font-mono-num">{z.code} · {z.name.split(' ')[0]}</span>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      za?.riskLevel === 'HIGH' ? 'bg-[#FF6B6B]' :
                      za?.riskLevel === 'MEDIUM' ? 'bg-[#F6B84B]' : 'bg-[#49D7D0]'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
