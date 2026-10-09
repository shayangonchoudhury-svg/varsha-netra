import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CornerDownRight,
  Database,
  CheckCircle2,
  Filter,
  FileText,
  Printer,
  ChevronRight,
  Activity,
  SlidersHorizontal,
  Layers,
  Info,
} from 'lucide-react';
import { ActionItem, InterventionType, SimulationResult } from '../types/hydrology';

interface ActionPlanViewProps {
  actions: ActionItem[];
  simulation: SimulationResult;
  onNavigateToZone: (zoneId: string) => void;
  onNavigateToScenario: () => void;
}

export const ActionPlanView: React.FC<ActionPlanViewProps> = ({
  actions: initialActions,
  simulation,
  onNavigateToZone,
  onNavigateToScenario,
}) => {
  const [actions, setActions] = useState<ActionItem[]>(initialActions);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | InterventionType>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'P1' | 'P2' | 'P3'>('ALL');
  const [showExportModal, setShowExportModal] = useState(false);

  // Synchronize state whenever props change from external state transitions
  useEffect(() => {
    setActions(initialActions);
  }, [initialActions]);

  const toggleActionStatus = (id: string) => {
    setActions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'recommended' ? 'staged' : item.status === 'staged' ? 'deployed' : 'recommended';
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  const filteredActions = actions.filter((item) => {
    const matchesType = selectedFilter === 'ALL' || item.action === selectedFilter;
    const matchesPriority = priorityFilter === 'ALL' || item.priority === priorityFilter;
    return matchesType && matchesPriority;
  });

  const p1Count = actions.filter((a) => a.priority === 'P1').length;
  const p2Count = actions.filter((a) => a.priority === 'P2').length;
  const p3Count = actions.filter((a) => a.priority === 'P3').length;
  const deployedCount = actions.filter((a) => a.status === 'deployed').length;

  const isZeroRainfall = simulation.params.rainfallMm === 0;

  const getActionBadge = (action: InterventionType) => {
    switch (action) {
      case 'PROTECT':
        return {
          badge: 'bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]/50',
          icon: <ShieldAlert className="w-4 h-4 text-[#FF6B6B] shrink-0" />,
          cardGlow: 'border-[#FF6B6B]/30 hover:border-[#FF6B6B]/60 shadow-[0_10px_30px_rgba(255,107,107,0.12)]',
        };
      case 'REDIRECT':
        return {
          badge: 'bg-[#F6B84B]/20 text-[#F6B84B] border-[#F6B84B]/50',
          icon: <CornerDownRight className="w-4 h-4 text-[#F6B84B] shrink-0" />,
          cardGlow: 'border-[#F6B84B]/30 hover:border-[#F6B84B]/60 shadow-[0_10px_30px_rgba(246,184,75,0.12)]',
        };
      case 'STORE':
        return {
          badge: 'bg-[#49D7D0]/20 text-[#8DEBE3] border-[#49D7D0]/50',
          icon: <Database className="w-4 h-4 text-[#49D7D0] shrink-0" />,
          cardGlow: 'border-[#49D7D0]/30 hover:border-[#49D7D0]/60 shadow-[0_10px_30px_rgba(73,215,208,0.12)]',
        };
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto relative z-10">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#49D7D0]/15 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F4FAFA] tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#49D7D0]" />
              <span>Campus Storm Action Plan</span>
            </h1>
            <span className="text-xs font-mono-num font-bold text-[#8DEBE3] bg-[#0F2A2F] px-3 py-1 rounded-full border border-[#49D7D0]/30 shadow-inner">
              {simulation.params.rainfallMm === 0 ? '0 mm (Pre-Storm Standby)' : `${simulation.params.rainfallMm} mm Event`}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#91A9AB] mt-1">
            Command-center operational directives mapped directly to modeled hydrological stress points across KIIT Campus.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2.5 text-xs font-bold text-[#F4FAFA] hover:text-[#8DEBE3] glass-panel hover:bg-[#0F2A2F] border border-[#49D7D0]/25 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <FileText className="w-4 h-4 text-[#49D7D0]" />
            <span>Export Mitigation Brief</span>
          </button>
        </div>
      </div>

      {/* 0 mm Pre-Storm Readiness Banner */}
      {isZeroRainfall && (
        <div className="p-5 rounded-2xl bg-[#0F2A2F]/80 border border-[#49D7D0]/30 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#8DEBE3]">
            <CheckCircle2 className="w-4 h-4 text-[#49D7D0]" />
            <span>NO STORM RESPONSE REQUIRED</span>
          </div>
          <p className="text-xs text-[#91A9AB] leading-relaxed">
            Current modeled rainfall is <strong className="text-[#F4FAFA] font-mono-num">0 mm</strong>. Campus hydrological stress is zero across all 7 sectors. The facility is operating in <strong>PRE-STORM READINESS</strong> standby.
          </p>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel-elevated border border-[#FF6B6B]/25 space-y-1">
          <div className="text-xs text-[#91A9AB] font-semibold uppercase tracking-wider text-[11px]">P1 Immediate</div>
          <div className="text-2xl font-extrabold font-mono-num text-[#FF6B6B]">
            {p1Count} Directives
          </div>
          <div className="text-[11px] text-[#91A9AB] pt-1">Critical sub-station & gate barriers</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel-elevated border border-[#F6B84B]/25 space-y-1">
          <div className="text-xs text-[#91A9AB] font-semibold uppercase tracking-wider text-[11px]">P2 Tactical Routing</div>
          <div className="text-2xl font-extrabold font-mono-num text-[#F6B84B]">
            {p2Count} Directives
          </div>
          <div className="text-[11px] text-[#91A9AB] pt-1">Swale & culvert throttle gates</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel-elevated border border-[#49D7D0]/25 space-y-1">
          <div className="text-xs text-[#91A9AB] font-semibold uppercase tracking-wider text-[11px]">P3 Reserve Storage</div>
          <div className="text-2xl font-extrabold font-mono-num text-[#49D7D0]">
            {p3Count} Directives
          </div>
          <div className="text-[11px] text-[#91A9AB] pt-1">Underground tank manifold intake</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel-elevated border border-[#8DEBE3]/25 space-y-1">
          <div className="text-xs text-[#91A9AB] font-semibold uppercase tracking-wider text-[11px]">Field Readiness</div>
          <div className="text-2xl font-extrabold font-mono-num text-[#8DEBE3]">
            {deployedCount} / {actions.length}
          </div>
          <div className="text-[11px] text-[#91A9AB] pt-1">Dispatched or Staged</div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-3 rounded-2xl border border-[#49D7D0]/15">

        {/* Type Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-xs text-[#91A9AB] mr-2 flex items-center gap-1 font-bold pl-1">
            <Filter className="w-3.5 h-3.5 text-[#49D7D0]" /> Filter:
          </span>
          {(['ALL', 'PROTECT', 'REDIRECT', 'STORE'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedFilter(type)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                selectedFilter === type
                  ? 'bg-[#0F2A2F] text-[#8DEBE3] shadow-[0_0_10px_rgba(73,215,208,0.25)] border border-[#49D7D0]/40'
                  : 'text-[#91A9AB] hover:text-[#F4FAFA]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#91A9AB] mr-2 font-bold">Priority:</span>
          {(['ALL', 'P1', 'P2', 'P3'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1 text-xs font-mono-num font-bold rounded-lg transition-all cursor-pointer ${
                priorityFilter === p
                  ? 'bg-[#0F2A2F] text-[#8DEBE3] border border-[#49D7D0] shadow-sm'
                  : 'text-[#91A9AB] hover:text-[#F4FAFA]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

      </div>

      {/* Action Cards List */}
      <div className="space-y-4">
        {filteredActions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl glass-panel border border-white/5 text-[#91A9AB] text-xs">
            No action recommendations match the current filter criteria.
          </div>
        ) : (
          filteredActions.map((item) => {
            const { badge, icon, cardGlow } = getActionBadge(item.action);
            const isP1 = item.priority === 'P1';

            return (
              <div
                key={item.id}
                className={`rounded-2xl glass-panel p-6 transition-all border ${cardGlow}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

                  {/* Left Metadata & Action Description */}
                  <div className="space-y-3.5 max-w-3xl">

                    {/* Top Row Pill Strip */}
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      <span className={`px-2.5 py-0.5 rounded-md font-mono-num font-extrabold border ${
                        item.priority === 'P1' ? 'bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]/50' :
                        item.priority === 'P2' ? 'bg-[#F6B84B]/20 text-[#F6B84B] border-[#F6B84B]/50' :
                        'bg-[#49D7D0]/20 text-[#8DEBE3] border-[#49D7D0]/50'
                      }`}>
                        {item.priority} URGENCY
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-md font-mono-num font-bold flex items-center gap-1.5 border ${badge}`}>
                        {icon}
                        <span>{item.action}</span>
                      </span>

                      <button
                        onClick={() => onNavigateToZone(item.zoneId)}
                        className="text-[#F4FAFA] font-bold hover:text-[#49D7D0] underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Zone: {item.zoneName}
                      </button>

                      <span className="text-[#91A9AB] text-[11px] font-mono-num">
                        · Window: {item.estimatedEffort}
                      </span>
                    </div>

                    {/* Operational measure detail */}
                    <div className="text-sm font-bold text-[#F4FAFA] leading-snug">
                      {item.specificMeasure}
                    </div>

                    {/* Deterministic Reason */}
                    <div className="text-xs text-[#91A9AB] bg-[#071316]/90 p-4 rounded-xl border border-white/5 space-y-1.5">
                      <div><strong className="text-[#F4FAFA]">Hydrological Cause:</strong> {item.reason}</div>
                      <div><strong className="text-[#49D7D0]">Modeled Impact:</strong> {item.expectedImpact}</div>
                    </div>

                  </div>

                  {/* Right Status Toggle & Direct Inspect CTA */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#49D7D0]/10">

                    <button
                      onClick={() => toggleActionStatus(item.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold font-mono-num flex items-center gap-2 border transition-all cursor-pointer shadow-md ${
                        item.status === 'deployed'
                          ? 'bg-[#49D7D0] text-[#071316] border-[#49D7D0] shadow-[0_0_12px_rgba(73,215,208,0.4)]'
                          : item.status === 'staged'
                          ? 'bg-[#0F2A2F] text-[#8DEBE3] border-[#49D7D0]'
                          : 'bg-[#071316] text-[#91A9AB] border-white/10 hover:text-[#F4FAFA]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {item.status === 'deployed' ? 'DEPLOYED / VERIFIED' : item.status === 'staged' ? 'STAGED ON-SITE' : 'MARK STAGED'}
                      </span>
                    </button>

                    <button
                      onClick={() => onNavigateToZone(item.zoneId)}
                      className="text-xs text-[#49D7D0] hover:text-[#8DEBE3] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Inspect Zone</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Export Mitigation Brief Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0B2024] border border-[#49D7D0]/30 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#49D7D0]/15 pb-4">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#49D7D0]" />
                <h3 className="text-lg font-bold text-[#F4FAFA]">Campus Storm Response Brief</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-[#91A9AB] hover:text-[#F4FAFA] text-xs px-3 py-1.5 rounded-lg bg-[#071316] cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="text-xs text-[#91A9AB] font-mono-num bg-[#071316] p-5 rounded-2xl border border-white/5 max-h-96 overflow-y-auto space-y-3 leading-relaxed">
              <div className="font-extrabold text-[#49D7D0] text-sm">
                Varshaনেত্র · KIIT CAMPUS OPERATIONAL DISPATCH BRIEF
              </div>
              <div>STORM EVENT: {simulation.params.rainfallMm} mm | PROFILE: {simulation.params.stormProfile}</div>
              <div>TIMESTAMP: {new Date().toLocaleString()}</div>
              <div className="border-t border-white/10 pt-2 font-bold text-[#F4FAFA]">
                1. EXECUTIVE SUMMARY
              </div>
              <div>- Total Runoff: {simulation.totalRunoffM3} m³ ({(simulation.totalRunoffM3 * 1000).toLocaleString()} L)</div>
              <div>- Captured: {simulation.totalCapturedM3} m³ ({simulation.captureEfficiencyPct}%)</div>
              <div>- Excess: {simulation.totalExcessM3} m³</div>
              <div className="border-t border-white/10 pt-2 font-bold text-[#F4FAFA]">
                2. PRIORITIZED MITIGATION ACTIONS
              </div>
              {actions.map((a, idx) => (
                <div key={idx} className="pl-2 border-l border-[#49D7D0]/40">
                  <span className="font-bold text-[#8DEBE3]">[{a.priority}] {a.action}</span> - {a.zoneName}
                  <div className="text-[#91A9AB]">{a.specificMeasure}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2.5 text-xs font-bold text-[#071316] bg-gradient-to-r from-[#49D7D0] to-[#8DEBE3] hover:brightness-110 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#49D7D0]/20"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
