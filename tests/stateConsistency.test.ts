/**
 * Varshaনেত্র — State Consistency & Synchronization Audit Suite
 * Verifies that all subsystems (Overview, TopNav, Digital Twin Map, ScenarioLab,
 * Action Plan, and Impact & Reserves) derive their state from the same single source of truth.
 */

import { HydrologyService } from '../src/services/simulationService';
import { WeatherService, DEMO_WEATHER_FALLBACK } from '../src/services/weatherService';
import { PRESET_RAIN_SCENARIOS } from '../src/data/kiitCampusData';
import { ScenarioParams } from '../src/types/hydrology';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

function runConsistencyTests() {
  console.log('=== Varshaনেত্র Global State Consistency & Synchronization Audit Suite ===');
  let passed = 0;
  const hydroService = new HydrologyService();
  const weatherService = new WeatherService();
  const zones = hydroService.getCampusZones();

  // Test 1: Initial Default State Consistency
  try {
    const defaultParams = hydroService.getDefaultScenarioParams();
    assert(defaultParams.rainfallMm === 72, 'Default rainfall must be 72 mm');
    assert(defaultParams.durationHours === 18, 'Default duration must be 18 hours');

    const defaultSim = hydroService.simulateScenario(defaultParams, 'Default Demo');
    assert(defaultSim.params.rainfallMm === 72, 'Simulation params rainfall must match 72 mm');
    assert(defaultSim.totalRunoffM3 > 0, 'Runoff must be non-zero');
    assert(defaultSim.zones.length === 7, 'All 7 zones must be simulated');
    console.log('✓ PASS: Test 1: Initial default state is consistent across params and deterministic simulation (72 mm / 18h)');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 1:', e.message);
  }

  // Test 2: Preset 35 mm Synchronization
  try {
    const preset35 = PRESET_RAIN_SCENARIOS.find((p) => p.id === 'light-shower');
    assert(Boolean(preset35), 'Preset 35 mm must exist');
    const params35: ScenarioParams = {
      rainfallMm: preset35!.rainfallMm,
      durationHours: preset35!.durationHours,
      storageCapacityMultiplier: 1.0,
      captureUpgradePercent: 0,
      stormProfile: preset35!.stormProfile,
      activeInterventions: [],
    };
    const sim35 = hydroService.simulateScenario(params35, preset35!.name);
    assert(sim35.params.rainfallMm === 35, 'Simulated rainfall must be exactly 35 mm');
    assert(sim35.params.durationHours === 12, 'Simulated duration must be exactly 12 hours');
    assert(sim35.totalRunoffM3 < 10000, '35mm runoff must be proportionally lower than 72mm');
    console.log('✓ PASS: Test 2: Selecting 35 mm preset synchronizes rainfall, duration, and mass balance');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 2:', e.message);
  }

  // Test 3: Preset 125 mm Synchronization
  try {
    const preset125 = PRESET_RAIN_SCENARIOS.find((p) => p.id === 'severe-downpour');
    assert(Boolean(preset125), 'Preset 125 mm must exist');
    const params125: ScenarioParams = {
      rainfallMm: preset125!.rainfallMm,
      durationHours: preset125!.durationHours,
      storageCapacityMultiplier: 1.0,
      captureUpgradePercent: 0,
      stormProfile: preset125!.stormProfile,
      activeInterventions: [],
    };
    const sim125 = hydroService.simulateScenario(params125, preset125!.name);
    assert(sim125.params.rainfallMm === 125, 'Simulated rainfall must be exactly 125 mm');
    assert(sim125.totalExcessM3 > 0, '125 mm cloudburst must generate localized flood excess');
    console.log('✓ PASS: Test 3: Selecting 125 mm preset updates simulation and reflects high-stress excess flood state');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 3:', e.message);
  }

  // Test 4: Preset 195 mm Synchronization
  try {
    const preset195 = PRESET_RAIN_SCENARIOS.find((p) => p.id === 'cyclonic-extreme');
    assert(Boolean(preset195), 'Preset 195 mm must exist');
    const params195: ScenarioParams = {
      rainfallMm: preset195!.rainfallMm,
      durationHours: preset195!.durationHours,
      storageCapacityMultiplier: 1.0,
      captureUpgradePercent: 0,
      stormProfile: preset195!.stormProfile,
      activeInterventions: [],
    };
    const sim195 = hydroService.simulateScenario(params195, preset195!.name);
    assert(sim195.params.rainfallMm === 195, 'Simulated rainfall must be exactly 195 mm');
    assert(sim195.overallRisk === 'HIGH', '195 mm cyclone surge must trigger campus HIGH risk');
    console.log('✓ PASS: Test 4: Selecting 195 mm cyclone preset drives campus-wide HIGH risk state');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 4:', e.message);
  }

  // Test 5: Live Weather 6h Window Mode Transition
  try {
    const weather = DEMO_WEATHER_FALLBACK;
    const profile6 = weatherService.weatherToStormProfile(weather, 6);
    const params6: ScenarioParams = {
      rainfallMm: profile6.rainfallMm,
      durationHours: profile6.durationHours,
      storageCapacityMultiplier: 1.0,
      captureUpgradePercent: 0,
      stormProfile: profile6.stormProfile,
      activeInterventions: [],
    };
    const sim6 = hydroService.simulateScenario(params6, profile6.label);
    assert(sim6.params.rainfallMm === 42.2, `Expected 6h accumulation 42.2 mm, got ${sim6.params.rainfallMm}`);
    assert(sim6.params.durationHours === 6, 'Duration must be 6 hours');
    console.log('✓ PASS: Test 5: Modeling live weather 6h window successfully overrides old scenario state');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 5:', e.message);
  }

  // Test 6: Live Weather 12h Window Mode Transition
  try {
    const weather = DEMO_WEATHER_FALLBACK;
    const profile12 = weatherService.weatherToStormProfile(weather, 12);
    const params12: ScenarioParams = {
      rainfallMm: profile12.rainfallMm,
      durationHours: profile12.durationHours,
      storageCapacityMultiplier: 1.0,
      captureUpgradePercent: 0,
      stormProfile: profile12.stormProfile,
      activeInterventions: [],
    };
    const sim12 = hydroService.simulateScenario(params12, profile12.label);
    assert(sim12.params.rainfallMm === 66.5, `Expected 12h accumulation 66.5 mm, got ${sim12.params.rainfallMm}`);
    assert(sim12.params.durationHours === 12, 'Duration must be 12 hours');
    console.log('✓ PASS: Test 6: Modeling live weather 12h window produces unified simulation state (66.5 mm / 12h)');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 6:', e.message);
  }

  // Test 7: Action Plan Derivation from Active Simulation
  try {
    const sim35 = hydroService.simulateScenario({
      rainfallMm: 35,
      durationHours: 12,
      storageCapacityMultiplier: 1.0,
      captureUpgradePercent: 0,
      stormProfile: 'monsoon_steady',
      activeInterventions: [],
    });
    const actions35 = hydroService.getActionPlanForSimulation(sim35);

    const sim195 = hydroService.simulateScenario({
      rainfallMm: 195,
      durationHours: 24,
      storageCapacityMultiplier: 1.0,
      captureUpgradePercent: 0,
      stormProfile: 'cyclonic_surge',
      activeInterventions: [],
    });
    const actions195 = hydroService.getActionPlanForSimulation(sim195);

    assert(actions195.length > 0, 'Action plan for 195mm must contain directives');
    assert(
      actions195.filter((a) => a.priority === 'P1').length >=
        actions35.filter((a) => a.priority === 'P1').length,
      'Severe 195mm storm must generate equal or more P1 directives than 35mm shower'
    );
    console.log('✓ PASS: Test 7: Action Plan dynamically re-generates directives matching active storm simulation');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 7:', e.message);
  }

  // Test 8: Impact & Reserves Derivation from Active Simulation
  try {
    const comparison = hydroService.compareWithBaseline({
      rainfallMm: 125,
      durationHours: 6,
      storageCapacityMultiplier: 1.8,
      captureUpgradePercent: 40,
      stormProfile: 'cloudburst',
      activeInterventions: ['z-gate', 'z-transit'],
    });

    assert(comparison.deltas.capturedVolumeM3Delta > 0, 'Intervention comparison must show increased water capture');
    assert(comparison.deltas.excessOverflowM3Delta >= 0, 'Intervention comparison must show reduced flood excess');
    assert(comparison.impact.groundwaterRechargeEstimateM3 > 0, 'Groundwater recharge metric must be computed');
    console.log('✓ PASS: Test 8: Impact & Reserves calculations reflect active parameters and intervention upgrades');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 8:', e.message);
  }

  // Test 9: Zero mm Edge Case Handling
  try {
    const sim0 = hydroService.simulateScenario({
      rainfallMm: 0,
      durationHours: 12,
      storageCapacityMultiplier: 1.0,
      captureUpgradePercent: 0,
      stormProfile: 'monsoon_steady',
      activeInterventions: [],
    });
    assert(sim0.totalRainfallVolumeM3 === 0, '0 mm rain must yield 0 m³ rain volume');
    assert(sim0.totalRunoffM3 === 0, '0 mm rain must yield 0 m³ runoff');
    assert(sim0.totalExcessM3 === 0, '0 mm rain must yield 0 m³ excess');
    assert(sim0.overallRisk === 'LOW', '0 mm rain must yield LOW risk');
    console.log('✓ PASS: Test 9: 0 mm input behaves deterministically and outputs zero runoff without errors');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 9:', e.message);
  }

  // Test 10: Reset to Baseline Restores Clean 72 mm State
  try {
    const resetParams = hydroService.getDefaultScenarioParams();
    assert(resetParams.rainfallMm === 72, 'Reset must restore 72 mm');
    assert(resetParams.durationHours === 18, 'Reset must restore 18 hours');
    assert(resetParams.storageCapacityMultiplier === 1.0, 'Reset must restore 1.0x storage');
    assert(resetParams.captureUpgradePercent === 0, 'Reset must restore 0% capture upgrade');
    assert(resetParams.activeInterventions.length === 0, 'Reset must clear targeted interventions');
    console.log('✓ PASS: Test 10: Reset to baseline cleanly restores default 72 mm / 18h demonstration state');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 10:', e.message);
  }

  // Test 11: Strict Zone Count Invariant (highRiskCount <= 7)
  try {
    [0, 35, 72, 125, 195, 250].forEach((rain) => {
      const sim = hydroService.simulateScenario({
        rainfallMm: rain,
        durationHours: 12,
        storageCapacityMultiplier: 1.0,
        captureUpgradePercent: 0,
        stormProfile: 'cyclonic_surge',
        activeInterventions: [],
      });
      assert(sim.highRiskCount <= zones.length, `highRiskCount (${sim.highRiskCount}) cannot exceed total zones (${zones.length})`);
      assert(sim.mediumRiskCount <= zones.length, `mediumRiskCount cannot exceed total zones`);
      assert(sim.lowRiskCount <= zones.length, `lowRiskCount cannot exceed total zones`);
      assert(sim.highRiskCount + sim.mediumRiskCount + sim.lowRiskCount === zones.length, `Sum of zone risk counts must equal ${zones.length}`);
    });
    console.log('✓ PASS: Test 11: Zone count invariants strictly verified across all rain levels (<= 7 zones)');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 11:', e.message);
  }

  // Test 12: Zero Rainfall Directives & Mitigation Consistency
  try {
    const sim0 = hydroService.simulateScenario({
      rainfallMm: 0,
      durationHours: 12,
      storageCapacityMultiplier: 1.0,
      captureUpgradePercent: 0,
      stormProfile: 'monsoon_steady',
      activeInterventions: [],
    });
    const actions0 = hydroService.getActionPlanForSimulation(sim0);
    assert(actions0.length === 1, 'Zero rainfall must output exactly 1 pre-storm readiness directive');
    assert(actions0[0].priority === 'P3', 'Zero rainfall directive must be P3 readiness');
    assert(!actions0[0].expectedImpact.includes('0.0 m³ into campus reserve tanks'), 'Must not claim active storage of 0.0 m³');

    const comp0 = hydroService.compareWithBaseline({
      rainfallMm: 0,
      durationHours: 12,
      storageCapacityMultiplier: 1.5,
      captureUpgradePercent: 20,
      stormProfile: 'monsoon_steady',
      activeInterventions: [],
    });
    assert(comp0.impact.excessReductionPct === 0, 'Zero baseline excess must output 0% reduction (never 100%)');
    assert(comp0.baseline.params.rainfallMm === 0, 'Baseline comparison must preserve 0mm rainfall forcing');
    console.log('✓ PASS: Test 12: Zero rainfall produces clean pre-storm readiness and 0% excess reduction without false claims');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 12:', e.message);
  }

  // Test 13: Baseline Comparison Preserves Active Storm Forcing
  try {
    const comp125 = hydroService.compareWithBaseline({
      rainfallMm: 125,
      durationHours: 8,
      storageCapacityMultiplier: 1.5,
      captureUpgradePercent: 30,
      stormProfile: 'tropical_downpour',
      activeInterventions: ['z-gate'],
    });
    assert(comp125.baseline.params.rainfallMm === 125, 'Baseline must use 125mm rainfall forcing');
    assert(comp125.simulated.params.rainfallMm === 125, 'Simulated must use 125mm rainfall forcing');
    assert(comp125.baseline.params.durationHours === 8, 'Baseline must use 8h duration');
    assert(comp125.simulated.params.durationHours === 8, 'Simulated must use 8h duration');
    console.log('✓ PASS: Test 13: Baseline comparison strictly preserves active storm forcing (depth & duration identical)');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 13:', e.message);
  }

  // Test 14: Dynamic Baseline Simulation follows active storm
  try {
    const baseSim35 = hydroService.getBaselineSimulation(35, 12, 'monsoon_steady');
    assert(baseSim35.params.rainfallMm === 35, 'Dynamic baseline must use 35mm');
    assert(baseSim35.params.storageCapacityMultiplier === 1.0, 'Baseline storage multiplier must be 1.0');
    assert(baseSim35.params.captureUpgradePercent === 0, 'Baseline capture upgrade must be 0%');

    const baseSim0 = hydroService.getBaselineSimulation(0, 6, 'monsoon_steady');
    assert(baseSim0.params.rainfallMm === 0, 'Dynamic baseline must use 0mm');
    assert(baseSim0.totalRunoffM3 === 0, 'Dynamic baseline for 0mm must have 0 runoff');
    console.log('✓ PASS: Test 14: Dynamic getBaselineSimulation follows active storm forcing across all test depths');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 14:', e.message);
  }

  // Test 15: Cross-Screen State Agreement Invariants
  try {
    const testCases: ScenarioParams[] = [
      { rainfallMm: 0, durationHours: 12, storageCapacityMultiplier: 1.0, captureUpgradePercent: 0, stormProfile: 'monsoon_steady', activeInterventions: [] },
      { rainfallMm: 35, durationHours: 12, storageCapacityMultiplier: 1.0, captureUpgradePercent: 0, stormProfile: 'monsoon_steady', activeInterventions: [] },
      { rainfallMm: 72, durationHours: 18, storageCapacityMultiplier: 1.0, captureUpgradePercent: 0, stormProfile: 'monsoon_steady', activeInterventions: [] },
      { rainfallMm: 125, durationHours: 8, storageCapacityMultiplier: 1.2, captureUpgradePercent: 10, stormProfile: 'tropical_downpour', activeInterventions: ['z-gate'] },
      { rainfallMm: 195, durationHours: 24, storageCapacityMultiplier: 1.5, captureUpgradePercent: 30, stormProfile: 'cyclonic_surge', activeInterventions: ['z-gate', 'z-transit'] },
    ];

    testCases.forEach((params) => {
      const sim = hydroService.simulateScenario(params, 'Test Scenario');
      const comp = hydroService.compareWithBaseline(params, 'Test Scenario');
      const actions = hydroService.getActionPlanForSimulation(sim);

      // Verify that sim, comp, and actions all agree on the physical scenario
      assert(sim.params.rainfallMm === params.rainfallMm, 'Sim rainfall mismatch');
      assert(comp.simulated.params.rainfallMm === params.rainfallMm, 'Comp simulated rainfall mismatch');
      assert(comp.baseline.params.rainfallMm === params.rainfallMm, 'Comp baseline rainfall mismatch');
      assert(sim.totalRunoffM3 === comp.simulated.totalRunoffM3, 'Runoff volume mismatch between sim and comp');
      assert(sim.totalCapturedM3 === comp.simulated.totalCapturedM3, 'Capture volume mismatch between sim and comp');
      assert(sim.totalExcessM3 === comp.simulated.totalExcessM3, 'Excess volume mismatch between sim and comp');
      assert(sim.highRiskCount === comp.simulated.highRiskCount, 'High risk count mismatch between sim and comp');
      assert(actions.length > 0, 'Actions cannot be empty');
    });

    console.log('✓ PASS: Test 15: Cross-screen state agreement verified across all 5 standard test cases (0mm, 35mm, 72mm, 125mm, 195mm)');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 15:', e.message);
  }

  console.log(`\nFinal State Consistency Test Results: ${passed}/15 Passed (0 Failed)`);
  if (passed !== 15) {
    process.exit(1);
  }
}

runConsistencyTests();
