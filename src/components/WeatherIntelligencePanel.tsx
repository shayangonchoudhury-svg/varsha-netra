import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  RefreshCw,
  Wind,
  Thermometer,
  Percent,
  Clock,
  Zap,
  ArrowRight,
  TriangleAlert,
  CheckCircle2,
  SlidersHorizontal,
  ShieldCheck,
  Radio,
  ExternalLink,
  Compass,
} from 'lucide-react';
import { WeatherForecast, ForecastWindowHours, WeatherDerivedStormProfile } from '../types/weather';
import { weatherService } from '../services/weatherService';
import { ScenarioParams } from '../types/hydrology';

interface WeatherIntelligencePanelProps {
  currentScenarioParams: ScenarioParams;
  activeScenarioLabel?: string;
  onModelRain: (derivedProfile: WeatherDerivedStormProfile) => void;
  activeLiveProfile?: WeatherDerivedStormProfile | null;
  onNavigateToMap?: () => void;
}

const MODELING_PIPELINE_STEPS = [
  'FETCHING LIVE WEATHER INPUT',
  'BUILDING INTENSITY PROFILE',
  'PROPAGATING 7 CAMPUS ZONES',
  'CALCULATING RUNOFF & STORAGE',
  'EVALUATING DRAINAGE STRESS',
  'UPDATING DIGITAL TWIN',
];

export const WeatherIntelligencePanel: React.FC<WeatherIntelligencePanelProps> = ({
  currentScenarioParams,
  activeScenarioLabel,
  onModelRain,
  activeLiveProfile,
  onNavigateToMap,
}) => {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedWindow, setSelectedWindow] = useState<ForecastWindowHours>(12);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [timeAgo, setTimeAgo] = useState<string>('just now');
  const [isModeling, setIsModeling] = useState<boolean>(false);
  const [modelingStepIndex, setModelingStepIndex] = useState<number>(0);

  // Initial fetch
  useEffect(() => {
    let mounted = true;
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const data = await weatherService.getLiveWeather();
        if (mounted) setForecast(data);
      } catch (e) {
        console.error('Failed to load initial weather:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWeather();
    return () => {
      mounted = false;
    };
  }, []);

  // Update relative time
  useEffect(() => {
    if (!forecast?.fetchedAt) return;
    const interval = setInterval(() => {
      const diffSec = Math.floor((Date.now() - new Date(forecast.fetchedAt).getTime()) / 1000);
      if (diffSec < 60) {
        setTimeAgo('just now');
      } else if (diffSec < 3600) {
        setTimeAgo(`${Math.floor(diffSec / 60)}m ago`);
      } else {
        setTimeAgo(`${Math.floor(diffSec / 3600)}h ago`);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [forecast?.fetchedAt]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await weatherService.getLiveWeather(true);
      setForecast(data);
      setTimeAgo('just now');
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTriggerModelRain = (profile: WeatherDerivedStormProfile) => {
    setIsModeling(true);
    setModelingStepIndex(0);

    const stepInterval = 180;
    MODELING_PIPELINE_STEPS.forEach((_, idx) => {
      setTimeout(() => {
        setModelingStepIndex(idx);
      }, idx * stepInterval);
    });

    setTimeout(() => {
      setIsModeling(false);
      onModelRain(profile);
    }, MODELING_PIPELINE_STEPS.length * stepInterval + 80);
  };

  if (loading && !forecast) {
    return (
      <div className="rounded-3xl glass-panel p-6 border border-[#49D7D0]/20 animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-[#0F2A2F] rounded-lg" />
          <div className="h-6 w-24 bg-[#0F2A2F] rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-[#0B2024] rounded-xl border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (!forecast) return null;

  // Selected window derived values
  const derivedProfile = weatherService.weatherToStormProfile(forecast, selectedWindow);
  const isCurrentlySimulated =
    currentScenarioParams.rainfallMm === derivedProfile.rainfallMm &&
    currentScenarioParams.durationHours === derivedProfile.durationHours;

  const maxHourlyInDisplay = Math.max(1, ...forecast.hourly.map((h) => h.precipitationMm));

  return (
    <section className="rounded-3xl glass-panel-elevated p-6 border border-[#49D7D0]/25 shadow-2xl relative overflow-hidden space-y-5">

      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/3 w-80 h-80 bg-[#49D7D0]/5 blur-3xl pointer-events-none rounded-full" />

      {/* Header & Telemetry Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#49D7D0]/15 pb-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-bold text-[#F4FAFA] tracking-tight flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#49D7D0] animate-pulse" />
              <span>LIVE WEATHER FEED</span>
            </h2>

            {forecast.isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#49D7D0]/15 border border-[#49D7D0]/40 text-[11px] font-mono-num font-bold text-[#8DEBE3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#49D7D0] animate-ping" />
                <span>LIVE [INPUT]</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F6B84B]/15 border border-[#F6B84B]/40 text-[11px] font-mono-num font-bold text-[#F6B84B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F6B84B]" />
                <span>DEMO PROFILE [INPUT]</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[#91A9AB] mt-0.5 flex flex-wrap items-center gap-1.5">
            <span>Bhubaneswar meteorological telemetry</span>
            <span className="text-white/20">·</span>
            <span className="text-[#8DEBE3] font-mono-num font-medium">
              Active model: <strong className="text-[#F4FAFA] font-bold">{activeScenarioLabel || `${currentScenarioParams.rainfallMm} mm Storm`}</strong>
            </span>
          </p>
        </div>

        {/* Source & Refresh Control */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right text-[11px] font-mono-num text-[#91A9AB] hidden md:block">
            <div>{forecast.source} · {forecast.current.location.split('·')[0]}</div>
            <div className="text-[#8DEBE3]">Updated {timeAgo}</div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh Live Weather"
            className="px-3 py-1.5 rounded-xl bg-[#0B2024] hover:bg-[#0F2A2F] border border-[#49D7D0]/25 text-xs font-semibold text-[#8DEBE3] flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#49D7D0]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Fallback Notice if present */}
      {forecast.error && (
        <div className="p-3 rounded-xl bg-[#F6B84B]/10 border border-[#F6B84B]/30 flex items-center gap-2.5 text-xs text-[#F6B84B]">
          <TriangleAlert className="w-4 h-4 shrink-0" />
          <span>External live feed unavailable ({forecast.error}). Running deterministic demo weather profile.</span>
        </div>
      )}

      {/* GROUP A: Current Atmospheric Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

        <div className="p-3 rounded-2xl glass-panel-subtle border border-white/5 space-y-0.5">
          <div className="text-[11px] text-[#91A9AB] font-semibold flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-[#8DEBE3]" />
            <span>Temperature</span>
          </div>
          <div className="text-base font-bold font-mono-num text-[#F4FAFA]">
            {forecast.current.temperatureC}°C
          </div>
          <div className="text-[10px] text-[#91A9AB]/70 font-mono-num">Current observation</div>
        </div>

        <div className="p-3 rounded-2xl glass-panel-subtle border border-white/5 space-y-0.5">
          <div className="text-[11px] text-[#91A9AB] font-semibold flex items-center gap-1.5">
            <CloudRain className="w-3.5 h-3.5 text-[#49D7D0]" />
            <span>Current Rain</span>
          </div>
          <div className="text-base font-bold font-mono-num text-[#49D7D0]">
            {forecast.current.currentPrecipitationMm} mm/h
          </div>
          <div className="text-[10px] text-[#91A9AB]/70 font-mono-num">Instantaneous rate</div>
        </div>

        <div className="p-3 rounded-2xl glass-panel-subtle border border-white/5 space-y-0.5">
          <div className="text-[11px] text-[#91A9AB] font-semibold flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-[#8DEBE3]" />
            <span>Wind Speed</span>
          </div>
          <div className="text-base font-bold font-mono-num text-[#F4FAFA]">
            {forecast.current.windSpeedKmh} km/h
          </div>
          <div className="text-[10px] text-[#91A9AB]/70 font-mono-num">Ground station (10m)</div>
        </div>

        <div className="p-3 rounded-2xl glass-panel-subtle border border-white/5 space-y-0.5">
          <div className="text-[11px] text-[#91A9AB] font-semibold flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-[#F6B84B]" />
            <span>Rain Probability</span>
          </div>
          <div className="text-base font-bold font-mono-num text-[#F6B84B]">
            {forecast.maxPrecipitationProbability}%
          </div>
          <div className="text-[10px] text-[#91A9AB]/70 font-mono-num">Peak 24h probability</div>
        </div>

      </div>

      {/* GROUP B & C & D: Forecast Window Selector, Storm Model Summary & Action Command */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#071316]/90 border border-[#49D7D0]/25 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* GROUP B: Forecast Window Buttons */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#91A9AB]">
              Select Forecast Window [INPUT]
            </div>
            <div className="flex items-center gap-2">
              {([6, 12, 24] as ForecastWindowHours[]).map((hours) => {
                const isSelected = selectedWindow === hours;
                const total =
                  hours === 6
                    ? forecast.totalNext6hMm
                    : hours === 12
                    ? forecast.totalNext12hMm
                    : forecast.totalNext24hMm;

                return (
                  <button
                    key={hours}
                    onClick={() => setSelectedWindow(hours)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono-num transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-[#0F2A2F] text-[#8DEBE3] border-[#49D7D0] shadow-[0_0_12px_rgba(73,215,208,0.25)] font-bold'
                        : 'bg-[#0B2024]/70 text-[#91A9AB] border-white/10 hover:text-[#F4FAFA] hover:border-[#49D7D0]/30'
                    }`}
                  >
                    <span>{hours}h Window</span>
                    <span className="font-bold text-[#49D7D0]">{total} mm</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* GROUP C: Selected Window Metrics Summary */}
          <div className="flex items-center gap-4 bg-[#0B2024] px-4 py-2 rounded-xl border border-white/5 font-mono-num text-xs">
            <div>
              <div className="text-[10px] uppercase text-[#91A9AB]">Accumulation</div>
              <div className="text-sm font-extrabold text-[#49D7D0]">{derivedProfile.rainfallMm} mm</div>
            </div>
            <div className="text-white/20">|</div>
            <div>
              <div className="text-[10px] uppercase text-[#91A9AB]">Peak Intensity</div>
              <div className="text-sm font-bold text-[#F4FAFA]">{derivedProfile.peakIntensityMmHr} mm/h</div>
            </div>
            <div className="text-white/20">|</div>
            <div>
              <div className="text-[10px] uppercase text-[#91A9AB]">Profile</div>
              <div className="text-xs font-bold text-[#8DEBE3] uppercase">
                {derivedProfile.stormProfile.replace('_', ' ')}
              </div>
            </div>
          </div>

        </div>

        {/* GROUP D: Action Banner */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#49D7D0]/15">
          <div className="text-xs text-[#91A9AB]">
            <span className="text-[#8DEBE3] font-semibold">Deterministic Feed:</span> Feeds{' '}
            <strong className="text-[#F4FAFA] font-mono-num">{derivedProfile.rainfallMm} mm</strong> ({selectedWindow}h) into campus mass-balance and zone risk analysis.
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              disabled={isModeling}
              onClick={() => handleTriggerModelRain(derivedProfile)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-lg ${
                isModeling
                  ? 'bg-[#0F2A2F] text-[#49D7D0] border border-[#49D7D0]/40 animate-pulse cursor-wait'
                  : isCurrentlySimulated
                  ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-gradient-to-r from-[#49D7D0] via-[#8DEBE3] to-[#49D7D0] text-[#071316] hover:brightness-110 shadow-[0_0_20px_rgba(73,215,208,0.35)]'
              }`}
            >
              {isModeling ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#49D7D0]" />
                  <span>{MODELING_PIPELINE_STEPS[modelingStepIndex]}...</span>
                </>
              ) : isCurrentlySimulated ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>CURRENTLY MODELLED ({derivedProfile.rainfallMm} mm)</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>MODEL {derivedProfile.rainfallMm} mm FORECAST →</span>
                </>
              )}
            </button>

            {isCurrentlySimulated && onNavigateToMap && (
              <button
                onClick={onNavigateToMap}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F2A2F] hover:bg-[#143940] text-[#8DEBE3] hover:text-[#F4FAFA] border border-[#49D7D0]/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>Digital Twin</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#49D7D0]" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 24-Hour Hourly Timeline Bar Chart */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-[#91A9AB]">
          <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#49D7D0]" />
            <span>24-Hour Precipitation Timeline</span>
          </span>
          <span className="font-mono-num text-[11px] text-[#8DEBE3]">
            {hoveredHour !== null && forecast.hourly[hoveredHour] ? (
              <span>
                Hour +{hoveredHour}h: <strong className="text-[#49D7D0]">{forecast.hourly[hoveredHour].precipitationMm} mm</strong> ({forecast.hourly[hoveredHour].precipitationProbability}% chance)
              </span>
            ) : (
              <span>Hover bars for hourly rainfall rate</span>
            )}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[#071316]/60 border border-white/10 flex items-end gap-1 sm:gap-1.5 h-24 pt-3">
          {forecast.hourly.map((h, i) => {
            const heightPercent = Math.max(8, Math.round((h.precipitationMm / maxHourlyInDisplay) * 100));
            const isInsideSelectedWindow = i < selectedWindow;
            const isHovered = hoveredHour === i;
            const hourLabel = new Date(h.timestamp).getHours();
            const formattedHour = `${hourLabel % 12 || 12}${hourLabel >= 12 ? 'p' : 'a'}`;

            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredHour(i)}
                onMouseLeave={() => setHoveredHour(null)}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
              >
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t transition-all duration-150 ${
                    isHovered
                      ? 'bg-[#FFFFFF] shadow-[0_0_12px_rgba(255,255,255,0.8)]'
                      : isInsideSelectedWindow
                      ? h.precipitationMm > 8
                        ? 'bg-[#FF6B6B]'
                        : h.precipitationMm > 3
                        ? 'bg-[#F6B84B]'
                        : 'bg-[#49D7D0]'
                      : 'bg-[#91A9AB]/30'
                  }`}
                />
                <span className={`text-[9px] font-mono-num mt-1 truncate ${
                  isInsideSelectedWindow ? 'text-[#8DEBE3]' : 'text-[#91A9AB]/60'
                }`}>
                  {i % 3 === 0 ? formattedHour : '·'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
};
