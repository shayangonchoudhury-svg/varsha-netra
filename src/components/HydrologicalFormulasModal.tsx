import React from 'react';
import { BookOpen, X, Cloud, ShieldCheck } from 'lucide-react';

interface HydrologicalFormulasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HydrologicalFormulasModal: React.FC<HydrologicalFormulasModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0B2024] border border-[#49D7D0]/30 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 relative z-50">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#49D7D0]/15 pb-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#49D7D0]" />
            <h2 className="text-lg font-bold text-[#F4FAFA] tracking-tight">
              Deterministic Hydrological Engine Specification
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#91A9AB] hover:text-[#F4FAFA] bg-[#071316] hover:bg-[#0F2A2F] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs text-[#91A9AB] leading-relaxed max-h-[70vh] overflow-y-auto pr-2">

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-[#8DEBE3]">1. Core Governing Principle</h3>
            <p className="text-[#91A9AB]">
              All environmental and flood-risk decisions in <strong className="text-[#F4FAFA]">Varshaনেত্র</strong> are strictly deterministic. We do not use stochastic LLM inference to invent risk states or runoffs. The calculations follow established civil hydrological formulas: Rational Method runoff kinetics, conservation of mass, and storage saturation curves.
            </p>
          </section>

          {/* Rational Equation */}
          <section className="p-5 rounded-2xl bg-[#071316] border border-white/5 space-y-2">
            <div className="font-bold text-[#F4FAFA] font-mono-num">
              A. Peak Runoff Rate (Rational Method):
            </div>
            <div className="p-3.5 bg-[#0B2024] rounded-xl font-mono-num text-[#49D7D0] text-xs sm:text-sm border border-[#49D7D0]/20">
              Q_peak (m³/h) = (I_peak (mm/h) × Area (m²) × C_composite) / 1000
            </div>
            <p className="text-[11px] text-[#91A9AB]">
              Where <span className="text-[#8DEBE3]">C_composite</span> is the weighted runoff coefficient derived from zone surface substrate: Rooftops (0.90), Bituminous Asphalt (0.92), Compacted Soils (0.60), and Turf/Swales (0.25).
            </p>
          </section>

          {/* Volumetric Balance */}
          <section className="p-5 rounded-2xl bg-[#071316] border border-white/5 space-y-2">
            <div className="font-bold text-[#F4FAFA] font-mono-num">
              B. Volumetric Runoff & Conservation of Mass:
            </div>
            <div className="p-3.5 bg-[#0B2024] rounded-xl font-mono-num text-[#8DEBE3] text-xs sm:text-sm border border-[#49D7D0]/20">
              V_runoff (m³) = (Rainfall_mm × Area_m² × C) / 1000<br/>
              V_excess (m³) = max(0, V_runoff - V_captured - (Drainage_Rate × Duration × 0.85))
            </div>
            <p className="text-[11px] text-[#91A9AB]">
              Where 0.85 represents hydraulic gravity line discharge efficiency under continuous storm conditions.
            </p>
          </section>

          {/* Deterministic Risk Classification */}
          <section className="p-5 rounded-2xl bg-[#071316] border border-white/5 space-y-2">
            <div className="font-bold text-[#F4FAFA] font-mono-num">
              C. Deterministic Risk Classification Matrix:
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[#91A9AB] text-[11px]">
              <li><strong className="text-[#FF6B6B]">HIGH RISK:</strong> Drainage Stress Ratio (Q_peak / Capacity) &gt; 1.4 OR Excess &gt; 100 m³ OR Co-located with critical sub-grade electrical infrastructure below 43m elevation contour.</li>
              <li><strong className="text-[#F6B84B]">MEDIUM RISK:</strong> Drainage Stress Ratio between 0.95 and 1.40 OR Excess between 30 and 100 m³.</li>
              <li><strong className="text-[#49D7D0]">LOW RISK:</strong> Stress Ratio &lt; 0.95 with complete capture or gravity conveyance.</li>
            </ul>
          </section>

          {/* AWS Lambda Isolation Target */}
          <section className="p-5 rounded-2xl bg-gradient-to-r from-[#071316] via-[#0B2024] to-[#071316] border border-[#49D7D0]/30 space-y-3">
            <div className="flex items-center gap-2 text-[#49D7D0] font-bold text-xs uppercase tracking-wider">
              <Cloud className="w-4 h-4" />
              <span>Production AWS Target Architecture</span>
            </div>
            <p className="text-[11px] text-[#91A9AB]">
              The deterministic engine in <code className="text-[#8DEBE3] bg-[#071316] px-1.5 py-0.5 rounded border border-[#49D7D0]/20">src/engine/deterministicHydrology.ts</code> is built as a pure, zero-dependency mathematical module. In production, this maps directly to an AWS Lambda function invoked via AWS Amplify & API Gateway:
            </p>
            <div className="flex flex-wrap items-center gap-2 font-mono-num text-[11px] text-[#91A9AB]">
              <span className="px-2.5 py-1 bg-[#071316] rounded-lg border border-white/5 text-[#F4FAFA]">React Frontend</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-[#071316] rounded-lg border border-white/5 text-[#F4FAFA]">AWS Amplify</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-[#071316] rounded-lg border border-white/5 text-[#8DEBE3]">API Gateway</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-[#0F2A2F] rounded-lg border border-[#49D7D0] text-[#49D7D0] font-bold shadow-sm">AWS Lambda (Deterministic Engine)</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-[#071316] rounded-lg border border-white/5 text-[#F4FAFA]">DynamoDB / S3</span>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#49D7D0]/15 pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-bold text-[#071316] bg-gradient-to-r from-[#49D7D0] to-[#8DEBE3] hover:brightness-110 rounded-xl transition-all cursor-pointer shadow-md shadow-[#49D7D0]/20"
          >
            Close Specification
          </button>
        </div>

      </div>
    </div>
  );
};
