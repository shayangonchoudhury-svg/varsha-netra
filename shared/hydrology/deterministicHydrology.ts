/**
 * Pure Deterministic Hydrology Engine for Varshaনেত্র.
 *
 * Implements authoritative civil hydrological calculations:
 * - Volumetric mass balance: V_runoff = V_captured + V_infiltrated + V_drained + V_excess
 * - Rational Method peak flow kinetics: Q_peak = (I_peak * Area * C) / 1000
 * - Dynamic storage, infiltration, and drainage mechanics
 * - Deterministic intervention modeling (Baseline ≠ Intervention)
 *
 * NO stochastic math, NO random numbers, NO LLM inference.
 * Identical engine used by React Frontend, Local Mock Mode, and AWS Lambda.
 */

import {
  CampusZone,
  ScenarioParams,
  SimulationInput,
  ZoneAnalysis,
  SimulationResult,
  ScenarioComparison,
  ImpactMetrics,
  InterventionPlan,
  RiskLevel,
} from './types';
import { calculateZoneRisk } from './risk';
import { evaluateZoneAction } from './interventions';
import {
  STORM_PROFILE_CONFIG,
  INSTITUTIONAL_WATER_ASSUMPTIONS,
} from './constants';

export interface SingleZoneHydrologyResult {
  rainVolumeM3: number;
  runoffM3: number;
  peakRunoffRateM3Hr: number;
  drainageCapM3Hr: number;
  drainageStressRatio: number;
  effectiveStorageM3: number;
  effectiveInfiltrationM3: number;
  effectiveDrainageM3: number;
  capturedM3: number;
  infiltratedM3: number;
  drainedM3: number;
  excessM3: number;
  capturePotentialM3: number;
}

/**
 * Calculates raw deterministic hydrological variables for a single zone.
 * Enforces strict mass balance parity:
 * runoffM3 = capturedM3 + infiltratedM3 + drainedM3 + excessM3
 */
export function computeZoneHydrology(
  zone: CampusZone,
  rainfallMm: number,
  durationHours: number,
  storageMultiplier: number,
  infiltrationRetrofitPercent: number,
  drainageEfficiency: number,
  stormProfile: string
): SingleZoneHydrologyResult {
  // Input Sanitation (Physically Bounded)
  const safeRainfall = Math.max(0, Number(rainfallMm) || 0);
  const safeDuration = Math.max(0.5, Number(durationHours) || 1);
  const safeStorageMultiplier = Math.max(1.0, Number(storageMultiplier) || 1.0);
  const safeInfiltrationPercent = Math.max(0, Number(infiltrationRetrofitPercent) || 0);
  const safeDrainageEfficiency = Math.max(0.70, Math.min(1.0, Number(drainageEfficiency) || 0.85));

  // 1. Total Rain Volume (m³) = Rainfall(mm) * Area(m²) / 1000
  const rainVolumeM3 = Math.round(((safeRainfall * zone.totalAreaSqM) / 1000) * 10) / 10;

  // 2. Generated Runoff Volume (m³) = rainVolumeM3 * runoffCoefficient
  // Runoff is generated from the zone's composite surface coefficient C
  const runoffM3 = Math.round((rainVolumeM3 * zone.runoffCoefficient) * 10) / 10;

  // 3. Peak Runoff Rate (m³/h) using Rational Method:
  // I_peak = (Rainfall / Duration) * ProfilePeakMultiplier
  // Peak intensity influences hydraulic stress and peak flow rate, but does NOT artificially multiply total storm rain volume.
  const avgIntensityMmHr = safeRainfall / safeDuration;
  const profileKey = (stormProfile in STORM_PROFILE_CONFIG ? stormProfile : 'monsoon_steady') as keyof typeof STORM_PROFILE_CONFIG;
  const peakMultiplier = STORM_PROFILE_CONFIG[profileKey].peakMultiplier;
  const peakIntensityMmHr = avgIntensityMmHr * peakMultiplier;
  const peakRunoffRateM3Hr = Math.round(((peakIntensityMmHr * zone.totalAreaSqM * zone.runoffCoefficient) / 1000) * 10) / 10;

  // 4. Effective Capacities
  // Effective Cistern / Tank Storage Capacity (m³)
  const rawStorage = zone.baseStorageCapM3 * safeStorageMultiplier;
  const effectiveStorageM3 = Math.round(Math.min(zone.maxStoragePotentialM3, rawStorage) * 10) / 10;

  // Effective Soil & Swale Infiltration Capacity (m³)
  const effectiveInfiltrationM3 = Math.round((zone.baseInfiltrationM3 * (1 + safeInfiltrationPercent / 100)) * 10) / 10;

  // Effective Gravity / Pump Drainage Capacity over Storm Duration (m³)
  const effectiveDrainageM3 = Math.round((zone.baseDrainageCapM3PerHour * safeDuration * safeDrainageEfficiency) * 10) / 10;

  // 5. Sequential Post-Runoff Water Partitioning (Conservation of Mass)
  // Step A: Water Captured in Cisterns / Retention Tanks
  const capturedM3 = Math.min(runoffM3, effectiveStorageM3);
  let remainingRunoff = Math.max(0, Math.round((runoffM3 - capturedM3) * 10) / 10);

  // Step B: Water Infiltrated into Sub-surface Soil / Bio-swales
  const infiltratedM3 = Math.min(remainingRunoff, effectiveInfiltrationM3);
  remainingRunoff = Math.max(0, Math.round((remainingRunoff - infiltratedM3) * 10) / 10);

  // Step C: Water Drained via Storm Channels / Gravity Outfalls
  const drainedM3 = Math.min(remainingRunoff, effectiveDrainageM3);
  remainingRunoff = Math.max(0, Math.round((remainingRunoff - drainedM3) * 10) / 10);

  // Step D: Remaining Unmanaged Standing Excess (Flood Ponding Hazard)
  const excessM3 = remainingRunoff;

  // 6. Clean Rooftop Rainwater Harvesting Potential (m³)
  const roofYield = (safeRainfall * zone.surfaceBreakdown.roofSqM * 0.90) / 1000;
  const swaleYield = (safeRainfall * zone.surfaceBreakdown.bioRetentionSqM * 0.65) / 1000;
  const capturePotentialM3 = Math.round((roofYield + swaleYield) * 10) / 10;

  const drainageStressRatio = Math.round((peakRunoffRateM3Hr / Math.max(1, zone.baseDrainageCapM3PerHour)) * 100) / 100;

  return {
    rainVolumeM3,
    runoffM3,
    peakRunoffRateM3Hr,
    drainageCapM3Hr: zone.baseDrainageCapM3PerHour,
    drainageStressRatio,
    effectiveStorageM3,
    effectiveInfiltrationM3,
    effectiveDrainageM3,
    capturedM3,
    infiltratedM3,
    drainedM3,
    excessM3,
    capturePotentialM3,
  };
}

/**
 * Executes full deterministic simulation across all zones, comparing Baseline and Intervention.
 */
export function executeHydrologySimulation(
  zones: CampusZone[],
  input: SimulationInput,
  scenarioName = 'Simulation Run'
): {
  simulation: SimulationResult;
  comparison: ScenarioComparison;
} {
  const rainfallMm = input.rainfallMm !== undefined && !isNaN(Number(input.rainfallMm))
    ? Math.max(0, Number(input.rainfallMm))
    : 72;
  const durationHours = input.durationHours !== undefined && !isNaN(Number(input.durationHours))
    ? Math.max(0.5, Number(input.durationHours))
    : 18;
  const stormProfile = input.stormProfile || 'monsoon_steady';

  const intervention: InterventionPlan = {
    storageCapacityMultiplier: input.intervention?.storageCapacityMultiplier ?? 1.0,
    captureUpgradePercent: input.intervention?.captureUpgradePercent ?? 0,
    drainageEfficiencyImprovementPercent: input.intervention?.drainageEfficiencyImprovementPercent ?? 0,
    targetedZones: input.activeInterventions ?? input.intervention?.targetedZones ?? [],
  };

  const activeInterventions = intervention.targetedZones;

  // 1. Calculate Baseline Runs (As-is configuration: storage=1.0x, infiltration=0%, drainageEff=0.85, no targeted interventions)
  const baselineZoneAnalyses: ZoneAnalysis[] = zones.map((zone) => {
    const baseHydro = computeZoneHydrology(zone, rainfallMm, durationHours, 1.0, 0, 0.85, stormProfile);
    const baseRisk = calculateZoneRisk(
      zone,
      baseHydro.runoffM3,
      baseHydro.peakRunoffRateM3Hr,
      baseHydro.drainageCapM3Hr,
      baseHydro.excessM3,
      baseHydro.effectiveStorageM3,
      false
    );

    const actionSpec = evaluateZoneAction(zone, {
      riskLevel: baseRisk.riskLevel,
      drainageStressRatio: baseHydro.drainageStressRatio,
      excessOverflowM3: baseHydro.excessM3,
      runoffVolumeM3: baseHydro.runoffM3,
      capturePotentialM3: baseHydro.capturePotentialM3,
    });

    return {
      zoneId: zone.id,
      zoneCode: zone.code,
      zoneName: zone.name,
      baselineRunoffM3: baseHydro.runoffM3,
      interventionRunoffM3: baseHydro.runoffM3,
      baselineCapturedM3: baseHydro.capturedM3,
      interventionCapturedM3: baseHydro.capturedM3,
      baselineExcessM3: baseHydro.excessM3,
      interventionExcessM3: baseHydro.excessM3,
      baselineRiskScore: baseRisk.riskScore,
      interventionRiskScore: baseRisk.riskScore,
      baselineRisk: baseRisk.riskLevel,
      interventionRisk: baseRisk.riskLevel,
      captureDeltaM3: 0,
      excessReductionM3: 0,
      floodReductionPercent: 0,
      runoffVolumeM3: baseHydro.runoffM3,
      peakRunoffRateM3Hr: baseHydro.peakRunoffRateM3Hr,
      drainageCapM3Hr: baseHydro.drainageCapM3Hr,
      drainageStressRatio: baseHydro.drainageStressRatio,
      capturePotentialM3: baseHydro.capturePotentialM3,
      capturedVolumeM3: baseHydro.capturedM3,
      infiltratedVolumeM3: baseHydro.infiltratedM3,
      drainedVolumeM3: baseHydro.drainedM3,
      excessOverflowM3: baseHydro.excessM3,
      riskScore: baseRisk.riskScore,
      riskLevel: baseRisk.riskLevel,
      recommendedIntervention: actionSpec.recommendedIntervention,
      action: actionSpec.recommendedIntervention,
      interventionReason: actionSpec.interventionReason,
      expectedModeledImpact: actionSpec.expectedModeledImpact,
      riskFactors: baseRisk.riskFactors,
      riskFactorScores: baseRisk.riskFactorScores,
    };
  });

  // 2. Calculate Intervention Runs (with applied upgrades)
  const drainageEfficiency = 0.85 * (1 + intervention.drainageEfficiencyImprovementPercent / 100);

  const interventionZoneAnalyses: ZoneAnalysis[] = zones.map((zone, index) => {
    const isTargeted = activeInterventions.includes(zone.id);
    const interHydro = computeZoneHydrology(
      zone,
      rainfallMm,
      durationHours,
      intervention.storageCapacityMultiplier,
      intervention.captureUpgradePercent,
      drainageEfficiency,
      stormProfile
    );

    const interRisk = calculateZoneRisk(
      zone,
      interHydro.runoffM3,
      interHydro.peakRunoffRateM3Hr,
      interHydro.drainageCapM3Hr,
      interHydro.excessM3,
      interHydro.effectiveStorageM3,
      isTargeted
    );

    const baseZa = baselineZoneAnalyses[index];

    const captureDeltaM3 = Math.round((interHydro.capturedM3 - baseZa.baselineCapturedM3) * 10) / 10;
    const excessReductionM3 = Math.round(Math.max(0, baseZa.baselineExcessM3 - interHydro.excessM3) * 10) / 10;
    const floodReductionPercent = baseZa.baselineExcessM3 > 0
      ? Math.round((excessReductionM3 / baseZa.baselineExcessM3) * 100)
      : 0;

    const actionSpec = evaluateZoneAction(zone, {
      riskLevel: interRisk.riskLevel,
      drainageStressRatio: interHydro.drainageStressRatio,
      excessOverflowM3: interHydro.excessM3,
      runoffVolumeM3: interHydro.runoffM3,
      capturePotentialM3: interHydro.capturePotentialM3,
    });

    return {
      zoneId: zone.id,
      zoneCode: zone.code,
      zoneName: zone.name,
      baselineRunoffM3: baseZa.baselineRunoffM3,
      interventionRunoffM3: interHydro.runoffM3,
      baselineCapturedM3: baseZa.baselineCapturedM3,
      interventionCapturedM3: interHydro.capturedM3,
      baselineExcessM3: baseZa.baselineExcessM3,
      interventionExcessM3: interHydro.excessM3,
      baselineRiskScore: baseZa.baselineRiskScore,
      interventionRiskScore: interRisk.riskScore,
      baselineRisk: baseZa.baselineRisk,
      interventionRisk: interRisk.riskLevel,
      captureDeltaM3,
      excessReductionM3,
      floodReductionPercent,
      runoffVolumeM3: interHydro.runoffM3,
      peakRunoffRateM3Hr: interHydro.peakRunoffRateM3Hr,
      drainageCapM3Hr: interHydro.drainageCapM3Hr,
      drainageStressRatio: interHydro.drainageStressRatio,
      capturePotentialM3: interHydro.capturePotentialM3,
      capturedVolumeM3: interHydro.capturedM3,
      infiltratedVolumeM3: interHydro.infiltratedM3,
      drainedVolumeM3: interHydro.drainedM3,
      excessOverflowM3: interHydro.excessM3,
      riskScore: interRisk.riskScore,
      riskLevel: interRisk.riskLevel,
      recommendedIntervention: actionSpec.recommendedIntervention,
      action: actionSpec.recommendedIntervention,
      interventionReason: actionSpec.interventionReason,
      expectedModeledImpact: actionSpec.expectedModeledImpact,
      riskFactors: interRisk.riskFactors,
      riskFactorScores: interRisk.riskFactorScores,
    };
  });

  // Aggregate Baseline Simulation
  const baselineResult = aggregateSimulation(
    baselineZoneAnalyses,
    zones,
    {
      rainfallMm,
      durationHours,
      storageCapacityMultiplier: 1.0,
      captureUpgradePercent: 0,
      stormProfile,
      activeInterventions: [],
    },
    'Baseline Monsoon'
  );

  // Aggregate Intervention Simulation
  const interventionResult = aggregateSimulation(
    interventionZoneAnalyses,
    zones,
    {
      rainfallMm,
      durationHours,
      storageCapacityMultiplier: intervention.storageCapacityMultiplier,
      captureUpgradePercent: intervention.captureUpgradePercent,
      stormProfile,
      activeInterventions,
    },
    scenarioName
  );

  // Comparison & Impact
  const comparison = buildScenarioComparison(baselineResult, interventionResult);

  // This legacy field represents modeled excess-runoff reduction,
  // not capture efficiency.
  interventionResult.floodReductionPct = comparison.impact.excessReductionPct;

  return {
    simulation: interventionResult,
    comparison,
  };
}

function aggregateSimulation(
  zoneAnalyses: ZoneAnalysis[],
  zones: CampusZone[],
  params: ScenarioParams,
  scenarioName: string
): SimulationResult {
  let totalRainfallVolumeM3 = 0;
  let totalRunoffM3 = 0;
  let totalCapturedM3 = 0;
  let totalExcessM3 = 0;
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;

  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    const a = zoneAnalyses[i];
    totalRainfallVolumeM3 += (params.rainfallMm * z.totalAreaSqM) / 1000;
    totalRunoffM3 += a.runoffVolumeM3;
    totalCapturedM3 += a.capturedVolumeM3;
    totalExcessM3 += a.excessOverflowM3;

    if (a.riskLevel === 'HIGH') highRiskCount++;
    else if (a.riskLevel === 'MEDIUM') mediumRiskCount++;
    else lowRiskCount++;
  }

  totalRainfallVolumeM3 = Math.round(totalRainfallVolumeM3 * 10) / 10;
  totalRunoffM3 = Math.round(totalRunoffM3 * 10) / 10;
  totalCapturedM3 = Math.round(totalCapturedM3 * 10) / 10;
  totalExcessM3 = Math.round(totalExcessM3 * 10) / 10;

  const captureEfficiencyPct = totalRunoffM3 > 0
    ? Math.round((totalCapturedM3 / totalRunoffM3) * 1000) / 10
    : 0;

  let overallRisk: RiskLevel = 'LOW';
  if (highRiskCount >= 2 || totalExcessM3 > 350) {
    overallRisk = 'HIGH';
  } else if (highRiskCount >= 1 || mediumRiskCount >= 3 || totalExcessM3 > 80) {
    overallRisk = 'MEDIUM';
  }


const floodReductionPct = 0; // Requires a baseline comparison; capture efficiency is reported separately.


  return {
    id: `sim-${Date.now()}`,
    scenarioName,
    timestamp: new Date().toISOString(),
    params,
    zones: zoneAnalyses,
    totalRainfallVolumeM3,
    totalRunoffM3,
    totalCapturedM3,
    totalExcessM3,
    overallRisk,
    highRiskCount: Math.min(zones.length, highRiskCount),
    mediumRiskCount: Math.min(zones.length, mediumRiskCount),
    lowRiskCount: Math.min(zones.length, lowRiskCount),
    captureEfficiencyPct,
    floodReductionPct,
  };
}

function buildScenarioComparison(
  baseline: SimulationResult,
  simulated: SimulationResult
): ScenarioComparison {
  const capturedVolumeM3Delta = Math.round((simulated.totalCapturedM3 - baseline.totalCapturedM3) * 10) / 10;
  const excessOverflowM3Delta = Math.round((baseline.totalExcessM3 - simulated.totalExcessM3) * 10) / 10;
  const highRiskZonesReduced = Math.max(0, baseline.highRiskCount - simulated.highRiskCount);
  const efficiencyGainPct = Math.round((simulated.captureEfficiencyPct - baseline.captureEfficiencyPct) * 10) / 10;

  const waterCapturedM3 = simulated.totalCapturedM3;
  const waterCapturedLiters = Math.round(waterCapturedM3 * 1000);
  const campusDaysSupplyEquivalent = Math.round(
    (waterCapturedLiters / INSTITUTIONAL_WATER_ASSUMPTIONS.CAMPUS_DAILY_NON_POTABLE_DEMAND_LITERS) * 10
  ) / 10;

  const excessReductionM3 = Math.max(0, baseline.totalExcessM3 - simulated.totalExcessM3);
  const excessReductionPct = baseline.totalExcessM3 > 0
    ? Math.round((excessReductionM3 / baseline.totalExcessM3) * 100)
    : 0;

  const groundwaterRechargeEstimateM3 = Math.round(
    simulated.totalCapturedM3 * INSTITUTIONAL_WATER_ASSUMPTIONS.AQUIFER_PERCOLATION_FACTOR
  );

  const municipalWaterOffsetINR = Math.round(
    waterCapturedM3 * INSTITUTIONAL_WATER_ASSUMPTIONS.MUNICIPAL_WATER_TARIFF_INR_PER_M3
  );

  const totalPossibleZones = baseline.zones.length || 7;
  const riskStateImprovementCount = Math.min(
    totalPossibleZones,
    highRiskZonesReduced + Math.max(0, baseline.mediumRiskCount - simulated.mediumRiskCount)
  );

  const impact: ImpactMetrics = {
    waterCapturedM3,
    waterCapturedLiters,
    campusDaysSupplyEquivalent,
    excessReductionM3,
    excessReductionPct,
    riskStateImprovementCount,
    priorityZonesProtected: Math.min(totalPossibleZones, highRiskZonesReduced),
    groundwaterRechargeEstimateM3,
    municipalWaterOffsetINR,
  };

  return {
    baseline,
    simulated,
    deltas: {
      capturedVolumeM3Delta,
      excessOverflowM3Delta,
      highRiskZonesReduced,
      efficiencyGainPct,
    },
    impact,
  };
}
