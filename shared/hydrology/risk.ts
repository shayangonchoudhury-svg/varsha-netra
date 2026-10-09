/**
 * Deterministic Risk Engine for Varshaনেত্র.
 *
 * Computes transparent, verifiable risk scores and risk levels based strictly
 * on hydrological model outputs, drainage throughput limits, and physical asset exposure.
 * ZERO stochastic/LLM inference.
 */

import { CampusZone, RiskLevel, ZoneRiskFactorsBreakdown } from './types';
import { RISK_WEIGHTS, RISK_THRESHOLDS } from './constants';

export interface ZoneRiskEvaluation {
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  riskFactorScores: ZoneRiskFactorsBreakdown;
}

export function calculateZoneRisk(
  zone: CampusZone,
  runoffM3: number,
  peakRateM3Hr: number,
  drainageCapM3Hr: number,
  excessM3: number,
  effectiveStorageM3: number,
  isTargetedInterventionActive: boolean
): ZoneRiskEvaluation {
  // If there is zero runoff and zero excess, zone is in strict zero-risk standby state
  if (runoffM3 <= 0 && excessM3 <= 0) {
    return {
      riskScore: 0,
      riskLevel: 'LOW',
      riskFactors: ['No active surface runoff under current precipitation conditions.'],
      riskFactorScores: {
        runoffStress: 0,
        drainageStress: 0,
        excessStress: 0,
        storageStress: 0,
        elevationStress: 0,
        infrastructureSensitivity: 0,
      },
    };
  }

  const riskFactors: string[] = [];

  // Guard against division by zero
  const safeDrainageCap = Math.max(1, drainageCapM3Hr);
  const stressRatio = peakRateM3Hr / safeDrainageCap;
  const excessRatio = runoffM3 > 0 ? excessM3 / runoffM3 : 0;
  const storageSaturationRatio = effectiveStorageM3 > 0 ? Math.min(1.0, runoffM3 / effectiveStorageM3) : 1.0;

  // 1. Normalized Drainage Stress Score (0 to 100)
  let drainageStressScore = 0;
  if (peakRateM3Hr <= 0) drainageStressScore = 0;
  else if (stressRatio >= 1.6) drainageStressScore = 100;
  else if (stressRatio >= 1.2) drainageStressScore = 75;
  else if (stressRatio >= 0.9) drainageStressScore = 50;
  else if (stressRatio >= 0.6) drainageStressScore = 25;
  else drainageStressScore = 10;

  if (stressRatio > 1.0) {
    riskFactors.push(`Peak runoff (${peakRateM3Hr.toFixed(1)} m³/h) exceeds drainage capacity (${drainageCapM3Hr} m³/h) by ${Math.round((stressRatio - 1) * 100)}%`);
  }

  // 2. Normalized Excess Water Score (0 to 100)
  let excessStressScore = 0;
  if (excessRatio >= 0.40 || excessM3 > 150) excessStressScore = 100;
  else if (excessRatio >= 0.20 || excessM3 > 60) excessStressScore = 70;
  else if (excessRatio > 0.05 || excessM3 > 15) excessStressScore = 40;
  else excessStressScore = 0;

  if (excessM3 > 0) {
    riskFactors.push(`Modeled standing surface water excess of ${excessM3.toFixed(1)} m³`);
  }

  // 3. Elevation Vulnerability Score (0 to 100)
  let elevationStressScore = 0;
  if (zone.elevationMeters <= 42.5 || zone.elevationStress === 'severe') {
    elevationStressScore = 100;
    riskFactors.push(`Low-lying elevation contour (${zone.elevationMeters}m MSL) subject to hydraulic backpressure`);
  } else if (zone.elevationMeters <= 47.0 || zone.elevationStress === 'moderate') {
    elevationStressScore = 50;
  } else {
    elevationStressScore = 15;
  }

  // 4. Infrastructure Sensitivity Score (0 to 100)
  const hasCriticalAsset = zone.criticalAssets.some((a) => a.elevationRisk === 'critical');
  let infrastructureScore = hasCriticalAsset ? 100 : Math.round(zone.infrastructureSensitivity * 100);

  if (hasCriticalAsset) {
    const criticalName = zone.criticalAssets.find((a) => a.elevationRisk === 'critical')?.name;
    riskFactors.push(`Co-located with critical facility: ${criticalName || 'Substation'}`);
  }

  // 5. Storage Saturation Score (0 to 100)
  const storageStressScore = Math.round(storageSaturationRatio * 100);

  // 6. Runoff Stress Score based on impervious area and runoff volume (0 to 100)
  const runoffStressScore = Math.min(100, Math.round((runoffM3 / Math.max(100, zone.totalAreaSqM * 0.05)) * 100));

  // Weighted Combination
  let rawScore =
    drainageStressScore * RISK_WEIGHTS.DRAINAGE_STRESS +
    excessStressScore * RISK_WEIGHTS.EXCESS_VOLUME_RATIO +
    elevationStressScore * RISK_WEIGHTS.ELEVATION_VULNERABILITY +
    infrastructureScore * RISK_WEIGHTS.INFRASTRUCTURE_SENSITIVITY +
    storageStressScore * RISK_WEIGHTS.STORAGE_SATURATION;

  // Active targeted physical intervention attenuates score
  if (isTargetedInterventionActive) {
    rawScore = Math.max(12, rawScore - 26);
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Deterministic Threshold Mapping: strictly derived from finalScore & stress overrides
  let riskLevel: RiskLevel = 'LOW';
  if (
    finalScore >= RISK_THRESHOLDS.HIGH_RISK_SCORE ||
    (stressRatio >= RISK_THRESHOLDS.CRITICAL_STRESS_RATIO && excessM3 >= RISK_THRESHOLDS.CRITICAL_EXCESS_M3)
  ) {
    riskLevel = 'HIGH';
  } else if (
    finalScore >= RISK_THRESHOLDS.MEDIUM_RISK_SCORE ||
    stressRatio >= 0.95 ||
    excessM3 > 25
  ) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  if (riskFactors.length === 0) {
    riskFactors.push('Runoff throughput fully contained within local drainage and infiltration capacity');
  }

  return {
    riskScore: finalScore,
    riskLevel,
    riskFactors,
    riskFactorScores: {
      runoffStress: runoffStressScore,
      drainageStress: drainageStressScore,
      excessStress: excessStressScore,
      storageStress: storageStressScore,
      elevationStress: elevationStressScore,
      infrastructureSensitivity: infrastructureScore,
    },
  };
}
