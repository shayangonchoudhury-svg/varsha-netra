import React from 'react';
import {
  Droplets,
  TrendingDown,
  ShieldCheck,
  Building,
  Coins,
  Sprout,
  ArrowRight,
  SlidersHorizontal,
  Sparkles,
  Info,
  HelpCircle,
} from 'lucide-react';
import { ScenarioComparison } from '../types/hydrology';

interface ImpactComparisonViewProps {
  comparison: ScenarioComparison;
  onNavigateToScenario: () => void;
  onNavigateToActions: () => void;
}

export const ImpactComparisonView: React.FC<ImpactComparisonViewProps> = ({
  comparison,
  onNavigateToScenario,
  onNavigateToActions,
}) => {
  const { baseline, simulated, deltas, impact } = comparison;

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto relative z-10">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#49D7D0]/15 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F4FAFA] tracking-tight flex items-center gap-2.5">
              <Droplets className="w-5 h-5 text-[#49D7D0]" />
              <span>Campus Water Impact & Reserve Valuation</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#91A9AB] mt-1">
            Quantified environmental returns, flood risk downgrades, and non-potable municipal water substitution.
          </p>
        </div>

        <button
          onClick={onNavigateToScenario}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#071316] bg-gradient-to-r from-[#49D7D0] to-[#8DEBE3] hover:brightness-110 rounded-xl transition-all shadow-md shadow-[#49D7D0]/20 cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Adjust Simulation Variables</span>
        </button>
      </div>

      {/* Transparent Data Labeling Legend */}
      <div className="flex flex-wrap items-center gap-3 bg-[#0B2024]/80 p-3 rounded-2xl border border-[#49D7D0]/15 text-xs font-mono-num">
        <span className="text-[#91A9AB] font-bold">Data Provenance:</span>
        <span className="px-2 py-0.5 rounded bg-[#49D7D0]/20 text-[#8DEBE3] border border-[#49D7D0]/40">
          [MODELED ESTIMATE] = Deterministic Hydrology
        </span>
        <span className="px-2 py-0.5 rounded bg-[#F6B84B]/20 text-[#F6B84B] border border-[#F6B84B]/40">
          [SCENARIO ASSUMPTION] = 120k L/day Institutional Demand
        </span>
        <span className="px-2 py-0.5 rounded bg-white/10 text-[#F4FAFA] border border-white/20">
          [INPUT DATA] = KIIT Campus Topography
        </span>
      </div>

      {/* 4 Primary Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Metric 1: Water Potentially Captured */}
        <div className="p-6 rounded-3xl glass-panel-elevated border border-[#49D7D0]/30 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-xs text-[#49D7D0]">
            <span className="font-bold uppercase tracking-wider text-[11px]">[MODELED] Captured Water</span>
            <Droplets className="w-4 h-4 text-[#49D7D0]" />
          </div>
          <div className="text-3xl font-extrabold font-mono-num text-[#49D7D0]">
            {simulated.totalCapturedM3.toLocaleString()} <span className="text-sm font-normal text-[#91A9AB]">m³</span>
          </div>
          <div className="text-xs text-[#91A9AB] space-y-1.5 pt-2 border-t border-[#49D7D0]/15">
            <div className="font-mono-num font-bold text-[#F4FAFA]">
              {(simulated.totalCapturedM3 * 1000).toLocaleString()} Liters
            </div>
            <div className="text-[#8DEBE3] font-medium">
              ≈ {impact.campusDaysSupplyEquivalent} Days campus utility supply
            </div>
          </div>
        </div>

        {/* Metric 2: Overflow / Excess Reduction */}
        <div className="p-6 rounded-3xl glass-panel-elevated border border-[#8DEBE3]/30 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-xs text-[#8DEBE3]">
            <span className="font-bold uppercase tracking-wider text-[11px]">[MODELED] Flood Reduction</span>
            <TrendingDown className="w-4 h-4 text-[#8DEBE3]" />
          </div>
          {baseline.totalExcessM3 > 0 ? (
            <>
              <div className="text-3xl font-extrabold font-mono-num text-[#8DEBE3]">
                {impact.excessReductionPct}% <span className="text-sm font-normal text-[#91A9AB]">mitigated</span>
              </div>
              <div className="text-xs text-[#91A9AB] space-y-1.5 pt-2 border-t border-[#49D7D0]/15">
                <div className="font-mono-num font-bold text-[#F4FAFA]">
                  -{impact.excessReductionM3.toLocaleString()} m³ unmanaged excess
                </div>
                <div className="text-[#49D7D0] font-medium">
                  Prevents standing water at lower gates
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-extrabold font-mono-num text-[#8DEBE3]">
                NO FLOOD EXCESS
              </div>
              <div className="text-xs text-[#91A9AB] space-y-1.5 pt-2 border-t border-[#49D7D0]/15">
                <div className="font-mono-num text-[#8DEBE3]">
                  0 m³ surface excess
                </div>
                <div className="text-[#91A9AB]">
                  No excess generated under current storm conditions.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Metric 3: Risk-State Improvement */}
        <div className="p-6 rounded-3xl glass-panel-elevated border border-[#6AA9FF]/30 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-xs text-[#6AA9FF]">
            <span className="font-bold uppercase tracking-wider text-[11px]">[MODELED] Risk Upgrades</span>
            <ShieldCheck className="w-4 h-4 text-[#6AA9FF]" />
          </div>
          <div className="text-3xl font-extrabold font-mono-num text-[#6AA9FF]">
            {impact.riskStateImprovementCount} <span className="text-sm font-normal text-[#91A9AB]">Zones</span>
          </div>
          <div className="text-xs text-[#91A9AB] space-y-1.5 pt-2 border-t border-[#49D7D0]/15">
            <div className="font-mono-num font-bold text-[#F4FAFA]">
              {deltas.highRiskZonesReduced} High-Risk zones eliminated
            </div>
            <div className="text-[#8DEBE3] font-medium">
              Protects sub-grade electrical grids
            </div>
          </div>
        </div>

        {/* Metric 4: Municipal Offset / Economic Value */}
        <div className="p-6 rounded-3xl glass-panel-elevated border border-[#F6B84B]/30 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-[11px] text-[#F6B84B] flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-[#F6B84B]/20 text-[#F6B84B] border border-[#F6B84B]/40 font-mono-num font-bold text-[10px]">[ESTIMATED]</span>
              <span>Tariff Offset</span>
            </span>
            <Coins className="w-4 h-4 text-[#F6B84B]" />
          </div>
          <div className="text-3xl font-extrabold font-mono-num text-[#F6B84B]">
            ₹{impact.municipalWaterOffsetINR.toLocaleString()}
          </div>
          <div className="text-xs text-[#91A9AB] space-y-1.5 pt-2 border-t border-[#49D7D0]/15">
            <div className="font-mono-num font-bold text-[#F4FAFA]">
              ₹65 / kL municipal tariff assumption
            </div>
            <div className="text-[#F6B84B] font-medium">
              +{impact.groundwaterRechargeEstimateM3} m³ aquifer recharge
            </div>
          </div>
        </div>

      </div>

      {/* Visual Volume Comparison Flow */}
      <div className="rounded-3xl glass-panel-elevated p-6 sm:p-8 space-y-6 border border-[#49D7D0]/20 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#49D7D0]/15 pb-4">
          <div>
            <h3 className="text-base font-bold text-[#F4FAFA]">
              Campus Hydrological Mass Balance (Baseline vs Intervention)
            </h3>
            <p className="text-xs text-[#91A9AB]">
              Comparative partition of total storm precipitation across campus storage vs unmanaged runoff
            </p>
          </div>
          <span className="text-xs font-mono-num text-[#49D7D0]">
            Volumetric Conservation Model
          </span>
        </div>

        <div className="space-y-6">

          {/* Baseline Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#91A9AB]">
                BASELINE (As-Is Configuration · {baseline.params.rainfallMm}mm Storm)
              </span>
              <span className="font-mono-num text-[#91A9AB]">
                Total Runoff: {baseline.totalRunoffM3.toLocaleString()} m³
              </span>
            </div>

            {baseline.totalRunoffM3 > 0 ? (
              <div className="h-7 w-full rounded-xl bg-[#071316] overflow-hidden flex border border-white/10">
                {baseline.totalCapturedM3 > 0 && (
                  <div
                    title={`Captured into Cisterns: ${baseline.totalCapturedM3} m³`}
                    style={{ width: `${(baseline.totalCapturedM3 / baseline.totalRunoffM3) * 100}%` }}
                    className="bg-[#49D7D0] h-full flex items-center justify-center text-[10px] font-bold text-[#071316] font-mono-num overflow-hidden px-1 whitespace-nowrap"
                  >
                    {(baseline.totalCapturedM3 / baseline.totalRunoffM3) * 100 >= 12
                      ? `${Math.round((baseline.totalCapturedM3 / baseline.totalRunoffM3) * 100)}%`
                      : ''}
                  </div>
                )}
                {Math.max(0, baseline.totalRunoffM3 - baseline.totalCapturedM3 - baseline.totalExcessM3) > 0 && (
                  <div
                    title={`Discharged via Gravity Storm Lines: ${Math.max(0, baseline.totalRunoffM3 - baseline.totalCapturedM3 - baseline.totalExcessM3)} m³`}
                    style={{ width: `${(Math.max(0, baseline.totalRunoffM3 - baseline.totalCapturedM3 - baseline.totalExcessM3) / baseline.totalRunoffM3) * 100}%` }}
                    className="bg-[#6AA9FF]/70 h-full flex items-center justify-center text-[10px] font-bold text-[#071316] font-mono-num overflow-hidden px-1 whitespace-nowrap"
                  >
                    {(Math.max(0, baseline.totalRunoffM3 - baseline.totalCapturedM3 - baseline.totalExcessM3) / baseline.totalRunoffM3) * 100 >= 14
                      ? 'Drained'
                      : ''}
                  </div>
                )}
                {baseline.totalExcessM3 > 0 && (
                  <div
                    title={`Excess Ponding Hazard: ${baseline.totalExcessM3} m³`}
                    style={{ width: `${(baseline.totalExcessM3 / baseline.totalRunoffM3) * 100}%` }}
                    className="bg-[#FF6B6B] h-full flex items-center justify-center text-[10px] font-bold text-[#F4FAFA] font-mono-num overflow-hidden px-1 whitespace-nowrap"
                  >
                    {(baseline.totalExcessM3 / baseline.totalRunoffM3) * 100 >= 12
                      ? `${Math.round((baseline.totalExcessM3 / baseline.totalRunoffM3) * 100)}%`
                      : ''}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-7 w-full rounded-xl bg-[#071316] flex items-center justify-center text-xs text-[#91A9AB] border border-white/10 font-mono-num">
                No storm runoff generated (0 mm precipitation event)
              </div>
            )}
          </div>

          {/* Simulated Upgraded Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#8DEBE3] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#49D7D0]" />
                <span>INTERVENTION (Upgraded Infrastructure)</span>
              </span>
              <span className="font-mono-num text-[#49D7D0] font-bold">
                Total Runoff: {simulated.totalRunoffM3.toLocaleString()} m³
              </span>
            </div>

            {simulated.totalRunoffM3 > 0 ? (
              <div className="h-7 w-full rounded-xl bg-[#071316] overflow-hidden flex border border-[#49D7D0]/40">
                {simulated.totalCapturedM3 > 0 && (
                  <div
                    title={`Captured into Cisterns: ${simulated.totalCapturedM3} m³`}
                    style={{ width: `${(simulated.totalCapturedM3 / simulated.totalRunoffM3) * 100}%` }}
                    className="bg-[#49D7D0] h-full flex items-center justify-center text-[10px] font-bold text-[#071316] font-mono-num overflow-hidden px-1 whitespace-nowrap"
                  >
                    {(simulated.totalCapturedM3 / simulated.totalRunoffM3) * 100 >= 12
                      ? `${Math.round((simulated.totalCapturedM3 / simulated.totalRunoffM3) * 100)}%`
                      : ''}
                  </div>
                )}
                {Math.max(0, simulated.totalRunoffM3 - simulated.totalCapturedM3 - simulated.totalExcessM3) > 0 && (
                  <div
                    title={`Discharged via Gravity Storm Lines: ${Math.max(0, simulated.totalRunoffM3 - simulated.totalCapturedM3 - simulated.totalExcessM3)} m³`}
                    style={{ width: `${(Math.max(0, simulated.totalRunoffM3 - simulated.totalCapturedM3 - simulated.totalExcessM3) / simulated.totalRunoffM3) * 100}%` }}
                    className="bg-[#6AA9FF] h-full flex items-center justify-center text-[10px] font-bold text-[#071316] font-mono-num overflow-hidden px-1 whitespace-nowrap"
                  >
                    {(Math.max(0, simulated.totalRunoffM3 - simulated.totalCapturedM3 - simulated.totalExcessM3) / simulated.totalRunoffM3) * 100 >= 14
                      ? 'Drained'
                      : ''}
                  </div>
                )}
                {simulated.totalExcessM3 > 0 && (
                  <div
                    title={`Excess Ponding Hazard: ${simulated.totalExcessM3} m³`}
                    style={{ width: `${(simulated.totalExcessM3 / simulated.totalRunoffM3) * 100}%` }}
                    className="bg-[#FF6B6B]/70 h-full flex items-center justify-center text-[10px] font-bold text-[#F4FAFA] font-mono-num overflow-hidden px-1 whitespace-nowrap"
                  >
                    {(simulated.totalExcessM3 / simulated.totalRunoffM3) * 100 >= 12
                      ? `${Math.round((simulated.totalExcessM3 / simulated.totalRunoffM3) * 100)}%`
                      : ''}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-7 w-full rounded-xl bg-[#071316] flex items-center justify-center text-xs text-[#91A9AB] border border-[#49D7D0]/20 font-mono-num">
                No storm runoff generated (0 mm precipitation event)
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-[#91A9AB] pt-3 border-t border-[#49D7D0]/15">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#49D7D0]" /> Harvested to Tanks</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#6AA9FF]" /> Conveyed to Eco-Lake</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#FF6B6B]" /> Unmanaged Flood Risk</span>
            </div>
            <div className="font-mono-num text-[#49D7D0] font-bold">
              +{(simulated.captureEfficiencyPct - baseline.captureEfficiencyPct).toFixed(1)}% Efficiency Gain
            </div>
          </div>

        </div>
      </div>

      {/* Transparent Assumption Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="rounded-3xl glass-panel-elevated p-6 space-y-4 border border-[#49D7D0]/20">
          <h3 className="text-base font-bold text-[#F4FAFA] flex items-center gap-2">
            <Building className="w-4 h-4 text-[#49D7D0]" />
            <span>Campus Utility Demand Assumptions</span>
          </h3>

          <p className="text-xs text-[#91A9AB] leading-relaxed">
            [SCENARIO ASSUMPTION]: KIIT campus consumes approximately <strong className="text-[#F4FAFA] font-mono-num">120,000 Liters/day</strong> for cooling tower chiller loops, botanical gardens, and non-potable sanitation.
          </p>

          <div className="p-4 rounded-2xl bg-[#071316] border border-white/5 space-y-2 font-mono-num text-xs">
            <div className="flex justify-between text-[#91A9AB]">
              <span>Single Heavy Rain Capture:</span>
              <span className="font-bold text-[#49D7D0]">{(simulated.totalCapturedM3 * 1000).toLocaleString()} Liters</span>
            </div>
            <div className="flex justify-between text-[#91A9AB]">
              <span>Days of Total Utility Autonomy:</span>
              <span className="font-bold text-[#8DEBE3]">{impact.campusDaysSupplyEquivalent} Days</span>
            </div>
            <div className="flex justify-between text-[#91A9AB]">
              <span>Pumping Energy Avoided:</span>
              <span className="font-bold text-[#6AA9FF]">~{Math.round(simulated.totalCapturedM3 * 0.42)} kg CO₂e</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl glass-panel-elevated p-6 space-y-4 border border-[#49D7D0]/20">
          <h3 className="text-base font-bold text-[#F4FAFA] flex items-center gap-2">
            <Sprout className="w-4 h-4 text-[#49D7D0]" />
            <span>Aquifer Hydrogeology Assumptions</span>
          </h3>

          <p className="text-xs text-[#91A9AB] leading-relaxed">
            [MODELED ESTIMATE]: Infiltration swales percolate stormwater into coastal Odisha shallow unconfined aquifers, raising water table pressure prior to dry summer drawdowns.
          </p>

          <div className="p-4 rounded-2xl bg-[#071316] border border-white/5 space-y-2 font-mono-num text-xs">
            <div className="flex justify-between text-[#91A9AB]">
              <span>Modeled Soil Percolation:</span>
              <span className="font-bold text-[#49D7D0]">{impact.groundwaterRechargeEstimateM3} m³</span>
            </div>
            <div className="flex justify-between text-[#91A9AB]">
              <span>Silt Trap Sediment Retention:</span>
              <span className="font-bold text-[#F4FAFA]">100% Operational</span>
            </div>
            <div className="flex justify-between text-[#91A9AB]">
              <span>Terminal Eco-Lake Buffer:</span>
              <span className="font-bold text-[#8DEBE3]">Nominal Retention</span>
            </div>
          </div>
        </div>

      </div>

      {/* Action Router Footer Banner */}
      <div className="p-6 rounded-3xl glass-panel-elevated border border-[#49D7D0]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-[#F4FAFA]">Ready to operationalize these interventions?</div>
          <div className="text-xs text-[#91A9AB]">View prioritized step-by-step engineering dispatch instructions for campus facility crews.</div>
        </div>
        <button
          onClick={onNavigateToActions}
          className="px-6 py-3 text-xs font-bold text-[#071316] bg-gradient-to-r from-[#49D7D0] via-[#8DEBE3] to-[#49D7D0] hover:brightness-110 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#49D7D0]/25"
        >
          <span>Open Operational Action Plan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
