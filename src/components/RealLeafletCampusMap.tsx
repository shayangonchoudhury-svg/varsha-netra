import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, Tooltip, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CampusZone, SimulationResult, ZoneAnalysis } from '../types/hydrology';
import {
  KIIT_CAMPUS_GEO_CENTER,
  KIIT_DEFAULT_ZOOM,
  KIIT_MIN_ZOOM,
  KIIT_MAX_ZOOM,
  KIIT_MODELLED_ZONE_GEOS,
  MODELLED_FLOW_VECTORS,
  MODELLED_STORM_CONDUITS,
  ModelledZoneGeo,
} from '../data/kiitModelledCoordinates';
import { ShieldAlert, Droplets, Info, Compass, Layers, Waves, AlertTriangle } from 'lucide-react';

interface RealLeafletCampusMapProps {
  zones: CampusZone[];
  simulation: SimulationResult;
  selectedZoneId: string | null;
  scenarioSource?: 'LIVE_WEATHER' | 'DEMO_PRESET' | 'CUSTOM';
  scenarioLabel?: string;
  onSelectZone: (zoneId: string) => void;
  onOpenZoneDetail: (zoneId: string) => void;
  onNavigateToActions?: () => void;
  onNavigateToImpact?: () => void;
  showFlowVectors: boolean;
  showDrainageNetwork: boolean;
  showZonePolygons: boolean;
  showRainOverlay: boolean;
}

// Map Controller for auto-centering, resizing, and responsive pan
const MapController: React.FC<{
  selectedGeo: ModelledZoneGeo | undefined;
}> = ({ selectedGeo }) => {
  const map = useMap();

  useEffect(() => {
  const resizeMap = () => {
    map.invalidateSize();
  };

  // Initial resize after layout settles
  const timer = window.setTimeout(resizeMap, 150);

  // Keep Leaflet synchronized with container size changes
  const container = map.getContainer().parentElement;

  const observer = new ResizeObserver(() => {
    resizeMap();
  });

  if (container) {
    observer.observe(container);
  }

  window.addEventListener('resize', resizeMap);

  return () => {
    window.clearTimeout(timer);
    observer.disconnect();
    window.removeEventListener('resize', resizeMap);
  };
}, [map]);

  useEffect(() => {
    if (selectedGeo) {
      map.panTo(selectedGeo.center, { animate: true, duration: 0.8 });
    }
  }, [selectedGeo, map]);

  return null;
};

export const RealLeafletCampusMap: React.FC<RealLeafletCampusMapProps> = ({
  zones,
  simulation,
  selectedZoneId,
  scenarioSource = 'DEMO_PRESET',
  scenarioLabel,
  onSelectZone,
  onOpenZoneDetail,
  onNavigateToActions,
  onNavigateToImpact,
  showFlowVectors,
  showDrainageNetwork,
  showZonePolygons,
  showRainOverlay,
}) => {
  const [tileMode, setTileMode] = useState<'carto_dark' | 'osm_standard'>('carto_dark');

  // Map zone analyses by ID
  const analysisMap = useMemo(() => {
    const map = new Map<string, ZoneAnalysis>();
    simulation.zones.forEach((za) => map.set(za.zoneId, za));
    return map;
  }, [simulation.zones]);

  const selectedGeo = useMemo(() => {
    if (!selectedZoneId) return undefined;
    return KIIT_MODELLED_ZONE_GEOS.find((g) => g.zoneId === selectedZoneId);
  }, [selectedZoneId]);

  // Risk styling helper
  const getRiskStyle = (risk: string, isSelected: boolean) => {
    switch (risk) {
      case 'HIGH':
        return {
          strokeColor: '#FF6B6B',
          fillColor: '#FF6B6B',
          fillOpacity: isSelected ? 0.45 : 0.25,
          weight: isSelected ? 3.5 : 2,
          badgeColor: 'border-[#FF6B6B] text-[#FF6B6B] bg-[#071316]',
          glow: 'rgba(255, 107, 107, 0.6)',
        };
      case 'MEDIUM':
        return {
          strokeColor: '#F6B84B',
          fillColor: '#F6B84B',
          fillOpacity: isSelected ? 0.4 : 0.22,
          weight: isSelected ? 3.5 : 2,
          badgeColor: 'border-[#F6B84B] text-[#F6B84B] bg-[#071316]',
          glow: 'rgba(246, 184, 75, 0.5)',
        };
      case 'LOW':
      default:
        return {
          strokeColor: '#49D7D0',
          fillColor: '#49D7D0',
          fillOpacity: isSelected ? 0.35 : 0.18,
          weight: isSelected ? 3.5 : 2,
          badgeColor: 'border-[#49D7D0] text-[#8DEBE3] bg-[#071316]',
          glow: 'rgba(73, 215, 208, 0.5)',
        };
    }
  };

  // Create custom DivIcons for Zone Markers
  const createZoneIcon = (geo: ModelledZoneGeo, risk: string, isSelected: boolean) => {
    const isHigh = risk === 'HIGH';
    const isLake = geo.isCentralDetention;

    let ringColor = '#49D7D0';
    let textColor = '#8DEBE3';
    let shadow = '0 0 10px rgba(73,215,208,0.4)';

    if (risk === 'HIGH') {
      ringColor = '#FF6B6B';
      textColor = '#FF6B6B';
      shadow = '0 0 16px rgba(255,107,107,0.7)';
    } else if (risk === 'MEDIUM') {
      ringColor = '#F6B84B';
      textColor = '#F6B84B';
      shadow = '0 0 12px rgba(246,184,75,0.5)';
    }

    const html = `
      <div class="relative flex flex-col items-center group cursor-pointer" style="transform: translate(-50%, -50%);">
        ${isHigh ? `<div class="absolute -inset-2 rounded-full border-2 border-[#FF6B6B] animate-ping opacity-75"></div>` : ''}
        ${isSelected ? `<div class="absolute -inset-3 rounded-full border border-white/60 animate-pulse"></div>` : ''}

        <!-- Zone Pin Badge -->
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#071316] border-2 transition-all duration-200"
             style="border-color: ${isSelected ? '#FFFFFF' : ringColor}; box-shadow: ${shadow};">
          <span class="text-[11px] font-mono font-black" style="color: ${isSelected ? '#FFFFFF' : textColor};">
            ${geo.zoneCode}
          </span>
        </div>

        <!-- Name Pill -->
        <div class="mt-1 px-2 py-0.5 rounded-md bg-[#071316]/95 border border-white/15 text-[10px] font-bold text-[#F4FAFA] shadow-lg whitespace-nowrap backdrop-blur-sm pointer-events-none flex items-center gap-1">
          <span>${geo.shortName}</span>
          ${isLake ? `<span class="text-[9px] text-[#49D7D0] font-mono-num font-extrabold">• DETENTION</span>` : ''}
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const isLive = scenarioSource === 'LIVE_WEATHER';

  return (
    <div className="relative w-full bg-[#071316] select-none overflow-hidden flex flex-col">

      {/* 1. TOP PROVENANCE & REAL MAP BADGE */}
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="bg-[#071316]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#49D7D0]/30 text-xs font-mono-num flex items-center gap-2 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-[#49D7D0] animate-ping" />
          <span className="font-extrabold text-[#8DEBE3] tracking-wide uppercase text-[11px]">
            {isLive ? 'REAL MAP · LIVE WEATHER INPUT' : 'REAL MAP · MODELLED HYDROLOGY'}
          </span>
        </div>

        {/* Tile Style Selector Toggle */}
        <div className="hidden md:flex items-center bg-[#071316]/90 backdrop-blur-md p-1 rounded-xl border border-white/10 text-[11px] font-mono-num shadow-lg">
          <button
            onClick={() => setTileMode('carto_dark')}
            className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
              tileMode === 'carto_dark'
                ? 'bg-[#0F2A2F] text-[#8DEBE3] font-bold border border-[#49D7D0]/40'
                : 'text-[#91A9AB] hover:text-[#F4FAFA]'
            }`}
          >
            Monsoon Dark
          </button>
          <button
            onClick={() => setTileMode('osm_standard')}
            className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
              tileMode === 'osm_standard'
                ? 'bg-[#0F2A2F] text-[#8DEBE3] font-bold border border-[#49D7D0]/40'
                : 'text-[#91A9AB] hover:text-[#F4FAFA]'
            }`}
          >
            Standard OSM
          </button>
        </div>
      </div>

      {/* 2. TOP RIGHT FLOATING METRICS HUD */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col sm:flex-row items-end sm:items-center gap-2 pointer-events-none">
        <div className="bg-[#071316]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#49D7D0]/25 text-xs font-mono-num flex items-center gap-2.5 shadow-xl">
          <span className="text-[#91A9AB]">
            {isLive ? 'Live Rain [INPUT]:' : 'Simulated Rain [INPUT]:'}{' '}
            <strong className="text-[#8DEBE3]">{simulation.params.rainfallMm} mm</strong>
          </span>
          <span className="text-[#49D7D0]/30">|</span>
          <span className="text-[#91A9AB]">
            Runoff [MODELLED]: <strong className="text-[#F4FAFA]">{simulation.totalRunoffM3.toLocaleString()} m³</strong>
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2.5 bg-[#071316]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#49D7D0]/25 text-[10px] font-mono-num shadow-xl">
          <span className="flex items-center gap-1 text-[#49D7D0] font-bold"><span className="w-2 h-2 rounded-full bg-[#49D7D0]" /> LOW</span>
          <span className="flex items-center gap-1 text-[#F6B84B] font-bold"><span className="w-2 h-2 rounded-full bg-[#F6B84B]" /> MED</span>
          <span className="flex items-center gap-1 text-[#FF6B6B] font-bold"><span className="w-2 h-2 rounded-full bg-[#FF6B6B]" /> HIGH</span>
        </div>
      </div>

      {/* 3. AMBIENT RAIN CANVAS OVERLAY */}
      {showRainOverlay && (
        <div className="absolute inset-0 z-[350] pointer-events-none opacity-20 overflow-hidden">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <pattern id="real-map-rain-pattern" width="36" height="36" patternUnits="userSpaceOnUse">
              <line x1="8" y1="0" x2="0" y2="18" stroke="#49D7D0" strokeWidth="1" strokeDasharray="2,5" />
              <line x1="26" y1="8" x2="18" y2="28" stroke="#49D7D0" strokeWidth="1" strokeDasharray="2,5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#real-map-rain-pattern)" className="animate-pulse" />
          </svg>
        </div>
      )}

      {/* 4. REACT LEAFLET MAP CONTAINER */}
      <div className="relative w-full h-[450px] sm:h-[490px] lg:h-[520px]">
        <MapContainer
  center={KIIT_CAMPUS_GEO_CENTER}
  zoom={KIIT_DEFAULT_ZOOM}
  minZoom={KIIT_MIN_ZOOM}
  maxZoom={KIIT_MAX_ZOOM}
  className={`w-full h-full min-h-full z-10 ${tileMode === 'osm_standard' ? 'leaflet-dark-tiles' : ''}`}
  style={{ height: '100%', width: '100%' }}
  scrollWheelZoom={true}
  attributionControl={true}
>
          <MapController selectedGeo={selectedGeo} />

          {/* Base Tile Layer */}
          {tileMode === 'carto_dark' ? (
            <TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  maxZoom={19}
/>
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          {/* 5. MODELLED STORM CONDUITS (UNDERGROUND / PRIMARY DISCHARGE) */}
          {showDrainageNetwork &&
            MODELLED_STORM_CONDUITS.map((conduit) => (
              <Polyline
                key={conduit.id}
                positions={conduit.coordinates}
                pathOptions={{
                  color: '#91A9AB',
                  weight: 3.5,
                  dashArray: '6, 6',
                  opacity: 0.65,
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs font-mono-num p-1">
                    <div className="font-bold text-[#8DEBE3]">{conduit.label}</div>
                    <div className="text-[10px] text-[#91A9AB]">MODELLED DRAINAGE CONDUIT [MODELLED]</div>
                  </div>
                </Tooltip>
              </Polyline>
            ))}

          {/* 6. MODELLED FLOW VECTORS (SURFACE OVERLAND KINEMATICS) */}
          {showFlowVectors &&
            MODELLED_FLOW_VECTORS.map((flow) => (
              <Polyline
                key={flow.id}
                positions={flow.coordinates}
                pathOptions={{
                  color: '#49D7D0',
                  weight: 3,
                  dashArray: '8, 8',
                  opacity: 0.85,
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs font-mono-num p-1">
                    <div className="font-bold text-[#49D7D0]">{flow.label}</div>
                    <div className="text-[10px] text-[#91A9AB]">MODELLED RUNOFF FLOW [MODELLED]</div>
                  </div>
                </Tooltip>
              </Polyline>
            ))}

          {/* 7. MODELLED ZONE POLYGONS */}
          {showZonePolygons &&
            KIIT_MODELLED_ZONE_GEOS.map((geo) => {
              const analysis = analysisMap.get(geo.zoneId);
              const risk = analysis ? analysis.riskLevel : 'LOW';
              const isSelected = selectedZoneId === geo.zoneId;
              const style = getRiskStyle(risk, isSelected);

              return (
                <Polygon
                  key={`poly-${geo.zoneId}`}
                  positions={geo.polygon}
                  pathOptions={{
                    color: isSelected ? '#FFFFFF' : style.strokeColor,
                    fillColor: style.fillColor,
                    fillOpacity: style.fillOpacity,
                    weight: style.weight,
                  }}
                  eventHandlers={{
                    click: () => onSelectZone(geo.zoneId),
                  }}
                >
                  <Tooltip sticky>
                    <div className="text-xs font-sans p-1.5 space-y-1">
                      <div className="font-bold text-[#F4FAFA] flex items-center justify-between gap-3">
                        <span>{geo.zoneCode} · {geo.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono-num font-bold ${
                          risk === 'HIGH' ? 'bg-[#FF6B6B]/20 text-[#FF6B6B]' :
                          risk === 'MEDIUM' ? 'bg-[#F6B84B]/20 text-[#F6B84B]' :
                          'bg-[#49D7D0]/20 text-[#8DEBE3]'
                        }`}>
                          {risk} RISK [MODELLED]
                        </span>
                      </div>
                      {analysis && (
                        <div className="text-[11px] text-[#91A9AB] font-mono-num grid grid-cols-2 gap-x-2 pt-1 border-t border-white/10">
                          <span>Runoff: <strong className="text-[#F4FAFA]">{analysis.runoffVolumeM3} m³</strong></span>
                          <span>Capacity: <strong className="text-[#8DEBE3]">{analysis.drainageCapM3Hr} m³/h</strong></span>
                          <span>Captured: <strong className="text-[#49D7D0]">{analysis.capturePotentialM3} m³</strong></span>
                          <span>Excess: <strong className="text-[#FF6B6B]">{analysis.excessOverflowM3} m³</strong></span>
                        </div>
                      )}
                      <div className="text-[9px] text-[#91A9AB]/80 italic pt-0.5">
                        Click polygon to view complete diagnostics
                      </div>
                    </div>
                  </Tooltip>
                </Polygon>
              );
            })}

          {/* 8. ZONE MARKERS WITH DIVICONS */}
          {KIIT_MODELLED_ZONE_GEOS.map((geo) => {
            const analysis = analysisMap.get(geo.zoneId);
            const risk = analysis ? analysis.riskLevel : 'LOW';
            const isSelected = selectedZoneId === geo.zoneId;
            const icon = createZoneIcon(geo, risk, isSelected);

            return (
              <Marker
                key={`marker-${geo.zoneId}`}
                position={geo.center}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectZone(geo.zoneId),
                }}
              >
                <Popup>
                  <div className="p-1 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                      <span className="font-extrabold text-[#F4FAFA]">{geo.zoneCode} · {geo.shortName}</span>
                      <span className="font-mono-num text-[10px] text-[#8DEBE3]">{geo.elevationMeters}m</span>
                    </div>
                    <div className="text-[11px] text-[#91A9AB]">
                      {geo.name}
                    </div>
                    {geo.isCentralDetention && (
                      <div className="px-2 py-1 rounded bg-[#49D7D0]/15 border border-[#49D7D0]/40 text-[10px] text-[#8DEBE3] font-mono-num font-bold">
                        MODELLED DETENTION · ECO-LAKE (38.5m) [MODELLED SINK]
                      </div>
                    )}
                    {analysis && (
                      <div className="space-y-1 font-mono-num text-[11px] pt-1">
                        <div className="flex justify-between">
                          <span className="text-[#91A9AB]">Modelled Risk:</span>
                          <strong className={
                            risk === 'HIGH' ? 'text-[#FF6B6B]' :
                            risk === 'MEDIUM' ? 'text-[#F6B84B]' : 'text-[#49D7D0]'
                          }>{risk} ({analysis.riskScore}/100) [MODELLED]</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#91A9AB]">Runoff Volume:</span>
                          <strong className="text-[#F4FAFA]">{analysis.runoffVolumeM3} m³ [MODELLED]</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#91A9AB]">Action:</span>
                          <strong className="text-[#8DEBE3]">{analysis.recommendedIntervention}</strong>
                        </div>
                      </div>
                    )}
                    <div className="pt-2 space-y-1.5">
                      <button
                        onClick={() => onOpenZoneDetail(geo.zoneId)}
                        className="w-full py-1.5 rounded-lg bg-[#0F2A2F] hover:bg-[#143940] border border-[#49D7D0]/40 text-xs font-bold text-[#8DEBE3] text-center transition-colors cursor-pointer"
                      >
                        Inspect Zone Telemetry →
                      </button>
                      {onNavigateToActions && (
                        <button
                          onClick={onNavigateToActions}
                          className="w-full py-1 rounded-lg bg-[#071316] hover:bg-[#0B2024] border border-white/15 text-[11px] text-[#91A9AB] hover:text-[#F4FAFA] text-center transition-colors cursor-pointer"
                        >
                          View Action Plan Directives →
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* 9. IN-FLOW MAP LEGEND & PROVENANCE BAR */}
      <div className="p-3 sm:p-3.5 bg-[#071316]/95 border-t border-[#49D7D0]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-[11px] font-mono-num text-[#91A9AB]">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-bold text-[#F4FAFA] uppercase text-[10px] tracking-wider">Legend:</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#49D7D0]" /> Low</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F6B84B]" /> Med</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF6B6B]" /> High</span>
          <span className="text-white/20">|</span>
          <span className="text-[#49D7D0]">➔ Runoff Flow</span>
          <span className="text-[#91A9AB]">╍╍ Conduits</span>
          <span className="text-[#8DEBE3]">◉ Detention Sink</span>
        </div>

        <div className="text-[10px] text-[#91A9AB] font-mono-num">
          Base: OpenStreetMap [REAL] · Hydrology: Varshaনেত্র [MODELLED]
        </div>
      </div>
    </div>
  );
};
