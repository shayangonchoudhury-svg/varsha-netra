/**
 * Comprehensive Automated Verification & Mass-Balance Test Suite for Varshaনেত্র.
 *
 * Validates:
 * 1. 0 mm rainfall parity
 * 2. Moderate rainfall (35 mm)
 * 3. Heavy rainfall (72 mm)
 * 4. Cloudburst flash storm (125 mm)
 * 5. Cyclonic surge (195 mm)
 * 6. Storage-only intervention (A)
 * 7. Infiltration-only intervention (B)
 * 8. Drainage-only intervention (C)
 * 9. Storage + Infiltration (D)
 * 10. Storage + Drainage (E)
 * 11. Combined full resilience plan (F)
 * 12. Strict Volumetric Conservation of Mass Parity: Runoff = Captured + Infiltrated + Drained + Excess
 * 13. Peak intensity multiplier bounds (does not inflate rain volume)
 * 14. Negative and invalid input rejection
 */

import {
  computeZoneHydrology,
  executeHydrologySimulation,
} from '../shared/hydrology/deterministicHydrology';
import { KIIT_CAMPUS_ZONES } from '../src/data/kiitCampusData';

export function runHydrologyTestSuite(): {
  total: number;
  passed: number;
  failed: number;
  results: { testName: string; passed: boolean; details?: string }[];
} {
  const results: { testName: string; passed: boolean; details?: string }[] = [];
  const testZone = KIIT_CAMPUS_ZONES[0]; // Z1 Gate (Impervious depression)
  const turfZone = KIIT_CAMPUS_ZONES[2]; // Z3 Sports (Permeable turf)

  // Test 1: 0 mm Rainfall
  try {
    const res = computeZoneHydrology(testZone, 0, 18, 1.0, 0, 0.85, 'monsoon_steady');
    const passed = res.rainVolumeM3 === 0 && res.runoffM3 === 0 && res.excessM3 === 0 && res.capturedM3 === 0;
    results.push({
      testName: 'Test 1: 0 mm Rainfall outputs zero rain volume, runoff, and excess',
      passed,
      details: passed ? undefined : `Runoff: ${res.runoffM3}, Excess: ${res.excessM3}`,
    });
  } catch (e: any) {
    results.push({ testName: 'Test 1: 0 mm Rainfall', passed: false, details: e.message });
  }

  // Test 2: Moderate Rainfall (35 mm)
  try {
    const res = computeZoneHydrology(testZone, 35, 12, 1.0, 0, 0.85, 'monsoon_steady');
    const passed = res.runoffM3 > 0 && res.runoffM3 <= res.rainVolumeM3 && res.capturedM3 <= res.runoffM3;
    results.push({
      testName: 'Test 2: Moderate Rainfall (35 mm) adheres to physical bounds',
      passed,
      details: passed ? undefined : `Runoff: ${res.runoffM3}, Rain: ${res.rainVolumeM3}`,
    });
  } catch (e: any) {
    results.push({ testName: 'Test 2: Moderate Rainfall', passed: false, details: e.message });
  }

  // Test 3: Heavy Rainfall (72 mm Baseline)
  try {
    const { simulation } = executeHydrologySimulation(KIIT_CAMPUS_ZONES, {
      rainfallMm: 72,
      durationHours: 18,
      stormProfile: 'monsoon_steady',
    });
    const passed = simulation.totalRunoffM3 > 5000 && simulation.totalCapturedM3 > 1000 && simulation.highRiskCount >= 1;
    results.push({
      testName: 'Test 3: Heavy Rainfall (72 mm) triggers baseline risk and capture thresholds',
      passed,
      details: passed ? undefined : `Runoff: ${simulation.totalRunoffM3}, Captured: ${simulation.totalCapturedM3}`,
    });
  } catch (e: any) {
    results.push({ testName: 'Test 3: Heavy Rainfall', passed: false, details: e.message });
  }

  // Test 4: Cloudburst Flash Storm (125 mm / 6h)
  try {
    const cloudRes = computeZoneHydrology(testZone, 125, 6, 1.0, 0, 0.85, 'cloudburst');
    const steadyRes = computeZoneHydrology(testZone, 125, 6, 1.0, 0, 0.85, 'monsoon_steady');
    // Peak rate should be higher under cloudburst profile, but rain volume must be identical
    const passed = cloudRes.peakRunoffRateM3Hr > steadyRes.peakRunoffRateM3Hr && cloudRes.rainVolumeM3 === steadyRes.rainVolumeM3;
    results.push({
      testName: 'Test 4: Cloudburst flash storm scales peak rate without inflating total event rain volume',
      passed,
      details: passed ? undefined : `Cloudburst Peak: ${cloudRes.peakRunoffRateM3Hr}, Steady Peak: ${steadyRes.peakRunoffRateM3Hr}`,
    });
  } catch (e: any) {
    results.push({ testName: 'Test 4: Cloudburst', passed: false, details: e.message });
  }

  // Test 5: Cyclonic Extreme Rainfall (195 mm / 24h)
  try {
    const { simulation } = executeHydrologySimulation(KIIT_CAMPUS_ZONES, {
      rainfallMm: 195,
      durationHours: 24,
      stormProfile: 'cyclonic_surge',
    });
    const passed = simulation.totalExcessM3 > 400 && simulation.overallRisk === 'HIGH';
    results.push({
      testName: 'Test 5: Cyclonic Surge triggers overall campus HIGH risk state',
      passed,
      details: passed ? undefined : `Excess: ${simulation.totalExcessM3}, Overall Risk: ${simulation.overallRisk}`,
    });
  } catch (e: any) {
    results.push({ testName: 'Test 5: Cyclonic Rainfall', passed: false, details: e.message });
  }

  // Test 6: Intervention Mode A — Storage Only (+50%)
  try {
    const { comparison } = executeHydrologySimulation(KIIT_CAMPUS_ZONES, {
      rainfallMm: 72,
      durationHours: 18,
      intervention: {
        storageCapacityMultiplier: 1.5,
        captureUpgradePercent: 0,
        drainageEfficiencyImprovementPercent: 0,
        targetedZones: [],
      },
    });
    const passed = comparison.deltas.capturedVolumeM3Delta > 0 && comparison.deltas.excessOverflowM3Delta >= 0;
    results.push({
      testName: 'Test 6: Intervention Mode A (Storage Only) increases captured water and reduces excess',
      passed,
      details: passed ? undefined : `Delta Captured: ${comparison.deltas.capturedVolumeM3Delta}`,
    });
  } catch (e: any) {
    results.push({ testName: 'Test 6: Storage Only', passed: false, details: e.message });
  }

  // Test 7: Intervention Mode B — Infiltration Only (+40%)
  try {
    const base = computeZoneHydrology(turfZone, 72, 18, 1.0, 0, 0.85, 'monsoon_steady');
    const upgraded = computeZoneHydrology(turfZone, 72, 18, 1.0, 40, 0.85, 'monsoon_steady');
    const passed = upgraded.infiltratedM3 >= base.infiltratedM3 && upgraded.excessM3 <= base.excessM3;
    results.push({
      testName: 'Test 7: Intervention Mode B (Infiltration Only) expands post-runoff sub-surface percolation',
      passed,
      details: passed ? undefined : `Base Infiltrated: ${base.infiltratedM3}, Upgraded: ${upgraded.infiltratedM3}`,
    });
  } catch (e: any) {
    results.push({ testName: 'Test 7: Infiltration Only', passed: false, details: e.message });
  }

  // Test 8: Intervention Mode C — Drainage Only (+25%)
  try {
    const base = computeZoneHydrology(testZone, 72, 18, 1.0, 0, 0.85, 'monsoon_steady');
    const upgraded = computeZoneHydrology(testZone, 72, 18, 1.0, 0, 0.85 * 1.25, 'monsoon_steady');
    const passed = upgraded.drainedM3 >= base.drainedM3 && upgraded.excessM3 <= base.excessM3;
    results.push({
      testName: 'Test 8: Intervention Mode C (Drainage Only) increases gravity line discharge and reduces flood excess',
      passed,
      details: passed ? undefined : `Base Drained: ${base.drainedM3}, Upgraded: ${upgraded.drainedM3}`,
    });
  } catch (e: any) {
    results.push({ testName: 'Test 8: Drainage Only', passed: false, details: e.message });
  }

  // Test 9: Intervention Mode D — Storage + Infiltration
  try {
    const { comparison } = executeHydrologySimulation(KIIT_CAMPUS_ZONES, {
      rainfallMm: 72,
      durationHours: 18,
      intervention: {
        storageCapacityMultiplier: 1.5,
        captureUpgradePercent: 40,
        drainageEfficiencyImprovementPercent: 0,
        targetedZones: [],
      },
    });
    const passed = comparison.deltas.capturedVolumeM3Delta > 0 && comparison.deltas.excessOverflowM3Delta >= 0;
    results.push({
      testName: 'Test 9: Intervention Mode D (Storage + Infiltration) delivers combined reserve and flood reduction gains',
      passed,
      details: passed ? undefined : `Captured Delta: ${comparison.deltas.capturedVolumeM3Delta}`,
    });
  } catch (e: any) {
    results.push({ testName: 'Test 9: Storage + Infiltration', passed: false, details: e.message });
  }

  // Test 10: Intervention Mode E — Storage + Drainage
  try {
    const { comparison } = executeHydrologySimulation(KIIT_CAMPUS_ZONES, {
      rainfallMm: 72,
      durationHours: 18,
      intervention: {
        storageCapacityMultiplier: 1.5,
        captureUpgradePercent: 0,
        drainageEfficiencyImprovementPercent: 20,
        targetedZones: [],
      },
    });
    const passed = comparison.deltas.capturedVolumeM3Delta > 0 && comparison.deltas.excessOverflowM3Delta >= 0;
    results.push({
      testName: 'Test 10: Intervention Mode E (Storage + Drainage) increases capture and accelerates sluice clearance',
      passed,
      details: passed ? undefined : `Captured Delta: ${comparison.deltas.capturedVolumeM3Delta}`,
    });
  } catch (e: any) {
    results.push({ testName: 'Test 10: Storage + Drainage', passed: false, details: e.message });
  }

  // Test 11: Intervention Mode F — Combined Full Resilience Plan
  try {
    const { simulation, comparison } = executeHydrologySimulation(KIIT_CAMPUS_ZONES, {
      rainfallMm: 72,
      durationHours: 18,
      intervention: {
        storageCapacityMultiplier: 1.5,
        captureUpgradePercent: 50,
        drainageEfficiencyImprovementPercent: 20,
        targetedZones: ['z-gate', 'z-park'],
      },
    });
    const passed =
      comparison.deltas.capturedVolumeM3Delta > 0 &&
      comparison.deltas.excessOverflowM3Delta >= 0 &&
      simulation.highRiskCount <= comparison.baseline.highRiskCount;
    results.push({
      testName: 'Test 11: Intervention Mode F (Combined Plan) achieves maximal flood reduction and high-risk de-escalation',
      passed,
      details: passed ? undefined : `High Risk Before: ${comparison.baseline.highRiskCount}, After: ${simulation.highRiskCount}`,
    });
  } catch (e: any) {
    results.push({ testName: 'Test 11: Combined Plan', passed: false, details: e.message });
  }

  // Test 12: Strict Volumetric Conservation of Mass Parity
  try {
    let allZonesConserved = true;
    let maxDiscrepancy = 0;

    KIIT_CAMPUS_ZONES.forEach((z) => {
      const hydro = computeZoneHydrology(z, 90, 18, 1.3, 30, 0.90, 'monsoon_steady');
      const partitionSum = Math.round((hydro.capturedM3 + hydro.infiltratedM3 + hydro.drainedM3 + hydro.excessM3) * 10) / 10;
      const discrepancy = Math.abs(hydro.runoffM3 - partitionSum);
      if (discrepancy > 0.1) {
        allZonesConserved = false;
        maxDiscrepancy = Math.max(maxDiscrepancy, discrepancy);
      }
    });

    results.push({
      testName: 'Test 12: Conservation of Mass: V_runoff == V_captured + V_infiltrated + V_drained + V_excess across all 7 zones',
      passed: allZonesConserved,
      details: allZonesConserved ? undefined : `Max Discrepancy: ${maxDiscrepancy} m³`,
    });
  } catch (e: any) {
    results.push({ testName: 'Test 12: Conservation of Mass', passed: false, details: e.message });
  }

  // Test 13: Negative & Invalid Input Sanitization
  try {
    const res = computeZoneHydrology(testZone, -80, -4, -1, -50, -0.5, 'invalid_storm');
    const passed = res.rainVolumeM3 >= 0 && res.runoffM3 >= 0 && res.capturedM3 >= 0 && res.excessM3 >= 0;
    results.push({
      testName: 'Test 13: Negative and malformed inputs are safely bounded to non-negative physical values',
      passed,
      details: passed ? undefined : `Rain: ${res.rainVolumeM3}, Runoff: ${res.runoffM3}`,
    });
  } catch (e: any) {
    results.push({ testName: 'Test 13: Input Sanitization', passed: false, details: e.message });
  }

  const passedCount = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passed: passedCount,
    failed: results.length - passedCount,
    results,
  };
}

// Self-execution
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('hydrologyEngine.test')) {
  console.log('=== Varshaনেত্র Authoritative Hydrology Engine Audit Suite ===\n');
  const res = runHydrologyTestSuite();
  res.results.forEach((r) => {
    console.log(`${r.passed ? '✓ PASS' : '✗ FAIL'}: ${r.testName}`);
    if (r.details) console.log(`  Details: ${r.details}`);
  });
  console.log(`\nFinal Audit Results: ${res.passed}/${res.total} Passed (${res.failed} Failed)`);
}
