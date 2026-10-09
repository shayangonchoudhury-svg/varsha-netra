/**
 * Deterministic Intervention & Action Plan Engine for Varshaনেত্র.
 * Categorizes physical mitigation directives into PROTECT, REDIRECT, and STORE.
 */

import { CampusZone, InterventionType, ActionItem, SimulationResult, ZoneAnalysis } from './types';

export function evaluateZoneAction(
  zone: CampusZone,
  analysis: {
    riskLevel: string;
    drainageStressRatio: number;
    excessOverflowM3: number;
    runoffVolumeM3: number;
    capturePotentialM3: number;
  }
): {
  recommendedIntervention: InterventionType;
  interventionReason: string;
  expectedModeledImpact: string;
} {
  // If zero runoff, maintain passive standby
  if (analysis.runoffVolumeM3 <= 0) {
    return {
      recommendedIntervention: 'STORE',
      interventionReason: 'No active surface runoff under current precipitation. Zone in passive baseline standby.',
      expectedModeledImpact: 'Pre-storm readiness. Zero active surface runoff to divert or capture.',
    };
  }

  const hasCriticalAsset = zone.criticalAssets.some((a) => a.elevationRisk === 'critical');

  // Decision Tree:
  // 1. Low elevation basin or critical asset facing flooding -> PROTECT
  // 2. High impervious area with high runoff velocity and limited local storage -> REDIRECT
  // 3. High rooftop or open catchment area with high capture potential -> STORE
  if (
    (hasCriticalAsset && (analysis.riskLevel === 'HIGH' || analysis.drainageStressRatio >= 0.85)) ||
    (zone.elevationMeters <= 43.0 && analysis.excessOverflowM3 > 40)
  ) {
    const assetName = zone.criticalAssets[0]?.name || 'Sub-grade Facility';
    return {
      recommendedIntervention: 'PROTECT',
      interventionReason: `Critical low-elevation infrastructure (${assetName}) under drainage stress (${analysis.drainageStressRatio.toFixed(2)}x).`,
      expectedModeledImpact: `Deploy automated barrier berms and auxiliary sump pumps to safeguard critical facilities from ${analysis.excessOverflowM3.toFixed(1)} m³ ponding.`,
    };
  } else if (
    zone.surfaceBreakdown.imperviousPavedSqM > zone.surfaceBreakdown.roofSqM &&
    analysis.drainageStressRatio >= 0.85
  ) {
    return {
      recommendedIntervention: 'REDIRECT',
      interventionReason: `Rapid bituminous surface runoff (${analysis.runoffVolumeM3.toFixed(1)} m³) exceeding local soakaway velocity.`,
      expectedModeledImpact: `Divert ${Math.round(analysis.runoffVolumeM3 * 0.45).toLocaleString()} m³ runoff through bio-swale bypass channels to Eco-Lake detention.`,
    };
  } else {
    return {
      recommendedIntervention: 'STORE',
      interventionReason: `High-yield rooftop catchment with substantial untapped rainwater harvesting potential (${analysis.capturePotentialM3.toFixed(1)} m³).`,
      expectedModeledImpact: `Capture up to ${analysis.capturePotentialM3.toFixed(1)} m³ into campus reserve tanks, mitigating storm sewer overload.`,
    };
  }
}

export function generateActionPlan(
  simulation: SimulationResult,
  zones: CampusZone[]
): ActionItem[] {
  // If rainfall is 0 or total runoff is 0, output a single clean pre-storm readiness directive
  if (simulation.params.rainfallMm === 0 || simulation.totalRunoffM3 === 0) {
    return [
      {
        id: 'act-pre-storm-readiness',
        priority: 'P3',
        action: 'STORE',
        zoneId: 'all-zones',
        zoneName: 'Campus Infrastructure',
        reason: 'No active hydrological stress under 0 mm rainfall conditions.',
        expectedImpact: 'Maintain pre-storm telemetry readiness and verify cistern intake gates are clear.',
        specificMeasure: 'Perform routine pre-storm inspection of inlet grates, verify cistern telemetry, and maintain passive readiness.',
        estimatedEffort: 'Pre-Storm Staging',
        status: 'recommended',
      },
    ];
  }

  const items: ActionItem[] = [];

  simulation.zones.forEach((za) => {
    const zone = zones.find((z) => z.id === za.zoneId);
    if (!zone) return;

    let priority: 'P1' | 'P2' | 'P3' = 'P3';
    let effort: 'Immediate (0-2h)' | 'Short-Term (2-6h)' | 'Pre-Storm Staging' = 'Pre-Storm Staging';
    let specificMeasure = '';

    if (za.riskLevel === 'HIGH') {
      priority = 'P1';
      effort = 'Immediate (0-2h)';
      if (za.recommendedIntervention === 'PROTECT') {
        specificMeasure = `Activate secondary submersible dewatering sump pumps (45 kW) at ${za.zoneName}. Deploy hydro-barrier berms along low-elevation basement entries.`;
      } else if (za.recommendedIntervention === 'REDIRECT') {
        specificMeasure = `Open automated diversion gates 1 & 2 toward South Bio-Retention Swale. Divert stormwater away from arterial bus routes.`;
      } else {
        specificMeasure = `Pre-empty cistern cell B to create 400 m³ surge buffer. Direct all roof downspout manifolds into primary filtration line.`;
      }
    } else if (za.riskLevel === 'MEDIUM') {
      priority = 'P2';
      effort = 'Short-Term (2-6h)';
      if (za.recommendedIntervention === 'STORE') {
        specificMeasure = `Route rooftop collector manifolds to central underground tanks. Verify vortex silt filter clearance.`;
      } else if (za.recommendedIntervention === 'REDIRECT') {
        specificMeasure = `Clear surface culvert trash grates and open intermediate throttle valve to eco-wetland.`;
      } else {
        specificMeasure = `Inspect backup generator seal and verify auxiliary drainage pump telemetry.`;
      }
    } else {
      priority = 'P3';
      effort = 'Pre-Storm Staging';
      specificMeasure = `Perform standard visual inspection of inlet grates, maintain passive bio-swale percolation rate, and log reserve storage levels.`;
    }

    items.push({
      id: `act-${za.zoneId}`,
      priority,
      action: za.recommendedIntervention,
      zoneId: za.zoneId,
      zoneName: za.zoneName,
      reason: za.interventionReason,
      expectedImpact: za.expectedModeledImpact,
      specificMeasure,
      estimatedEffort: effort,
      status: 'recommended',
    });
  });

  const priorityOrder: Record<string, number> = { P1: 0, P2: 1, P3: 2 };
  return items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
