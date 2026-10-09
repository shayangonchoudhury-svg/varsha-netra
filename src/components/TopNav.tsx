import React from 'react';
import {
  SlidersHorizontal,
  MapPin,
  BookOpen,
  Radio,
  CloudRain,
  Play,
} from 'lucide-react';

interface TopNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenFormulas: () => void;
  onQuickSimulate: () => void;
  rainfallMm: number;
  scenarioSource: 'LIVE_WEATHER' | 'DEMO_PRESET' | 'CUSTOM';
  scenarioLabel: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenFormulas,
  onQuickSimulate,
  rainfallMm,
  scenarioSource,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'map', label: 'Digital Twin' },
    { id: 'scenario', label: 'Storm Simulator' },
    { id: 'actions', label: 'Action Plan' },
    { id: 'impact', label: 'Impact & Reserves' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#49D7D0]/15 bg-[#071316]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Zone 1: Brand Wordmark & Dynamic Telemetry Indicator */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => onSelectTab('overview')}
            className="flex items-baseline gap-1 text-left group focus:outline-none cursor-pointer"
          >
            <span className="text-xl font-bold tracking-tight text-[#F4FAFA] transition-colors group-hover:text-[#49D7D0]">
              Varsha<span className="font-bengali font-normal text-[#49D7D0] text-2xl ml-0.5">নেত্র</span>
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-2 pl-3.5 border-l border-white/10 text-xs font-mono-num whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5 text-[#49D7D0]" />
            <span className="text-[#91A9AB]">KIIT Campus</span>
            <span className="text-white/20">·</span>

            {scenarioSource === 'LIVE_WEATHER' ? (
              <span className="inline-flex items-center gap-1.5 text-[#8DEBE3]">
                <Radio className="w-3.5 h-3.5 text-[#49D7D0] animate-pulse shrink-0" />
                <strong className="text-[#49D7D0]">{rainfallMm} mm</strong>
                <span className="text-[#91A9AB]">Live Weather</span>
              </span>
            ) : scenarioSource === 'CUSTOM' ? (
              <span className="inline-flex items-center gap-1.5 text-[#8DEBE3]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#49D7D0] shrink-0" />
                <strong className="text-[#49D7D0]">{rainfallMm} mm</strong>
                <span className="text-[#91A9AB]">Custom Model</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[#8DEBE3]">
                <CloudRain className="w-3.5 h-3.5 text-[#49D7D0] shrink-0" />
                <strong className="text-[#49D7D0]">{rainfallMm} mm</strong>
                <span className="text-[#91A9AB]">Storm Preset</span>
              </span>
            )}
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#0F2A2F] text-[#8DEBE3] shadow-[0_0_12px_rgba(73,215,208,0.2)] border border-[#49D7D0]/30'
                    : 'text-[#91A9AB] hover:text-[#F4FAFA] hover:bg-[#0B2024]/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenFormulas}
            title="Inspect Deterministic Hydrological Equations"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#91A9AB] hover:text-[#F4FAFA] bg-[#0B2024]/80 hover:bg-[#0F2A2F] border border-[#49D7D0]/20 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#49D7D0]" />
            <span>Equations</span>
          </button>

          <button
            onClick={onQuickSimulate}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-[#071316] bg-gradient-to-r from-[#49D7D0] via-[#8DEBE3] to-[#49D7D0] hover:brightness-110 rounded-lg shadow-[0_0_15px_rgba(73,215,208,0.35)] transition-all whitespace-nowrap cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-[#071316]" />
            <span>RUN SIMULATION</span>
          </button>
        </div>

      </div>

      {/* Mobile Nav Bar */}
      <div className="flex md:hidden overflow-x-auto border-t border-[#49D7D0]/10 px-4 py-2 gap-1.5 bg-[#071316]/95 backdrop-blur-md scrollbar-none">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-[#0F2A2F] text-[#8DEBE3] border border-[#49D7D0]/40'
                  : 'text-[#91A9AB] hover:text-[#F4FAFA]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
