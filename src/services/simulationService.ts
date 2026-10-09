import { KIIT_CAMPUS_ZONES, BASELINE_RAIN_EVENT, PRESET_RAIN_SCENARIOS } from '../data/kiitCampusData';
import {
  CampusZone,
  RainEvent,
  ScenarioParams,
  SimulationResult,
  ActionItem,
  ScenarioComparison,
  SimulationInput,
  ExplanationResponse,
} from '../../shared/hydrology/types';
import { executeHydrologySimulation, computeZoneHydrology } from '../../shared/hydrology/deterministicHydrology';
import { generateActionPlan } from '../../shared/hydrology/interventions';
import { calculateZoneRisk } from '../../shared/hydrology/risk';
import { evaluateZoneAction } from '../../shared/hydrology/interventions';
import { apiClient } from './api';

export class HydrologyService {
  private zones: CampusZone[] = KIIT_CAMPUS_ZONES;
  private baselineEvent: RainEvent = BASELINE_RAIN_EVENT;
  private baselineParams: ScenarioParams = {
    rainfallMm: BASELINE_RAIN_EVENT.rainfallMm,
    durationHours: BASELINE_RAIN_EVENT.durationHours,
    storageCapacityMultiplier: 1.0,
    captureUpgradePercent: 0,
    stormProfile: BASELINE_RAIN_EVENT.stormProfile,
    activeInterventions: [],
  };

  public getCampusZones(): CampusZone[] {
    return this.zones;
  }

  public getZoneById(id: string): CampusZone | undefined {
    return this.zones.find((z) => z.id === id);
  }

  public getBaselineEvent(): RainEvent {
    return this.baselineEvent;
  }

  public getPresetScenarios() {
    return PRESET_RAIN_SCENARIOS;
  }

  public getDefaultScenarioParams(): ScenarioParams {
    return { ...this.baselineParams };
  }

  public getBaselineSimulation(
    rainfallMm?: number,
    durationHours?: number,
    stormProfile?: any
  ): SimulationResult {
    const rain = rainfallMm !== undefined ? rainfallMm : this.baselineEvent.rainfallMm;
    const duration = durationHours !== undefined ? durationHours : this.baselineEvent.durationHours;
    const profile = stormProfile || this.baselineEvent.stormProfile;

    const { simulation } = executeHydrologySimulation(
      this.zones,
      {
        rainfallMm: rain,
        durationHours: duration,
        stormProfile: profile,
        intervention: {
          storageCapacityMultiplier: 1.0,
          captureUpgradePercent: 0,
          drainageEfficiencyImprovementPercent: 0,
          targetedZones: [],
        },
      },
      `Baseline Storm (${rain}mm)`
    );
    return simulation;
  }

  public simulateScenario(params: ScenarioParams, scenarioName = 'Custom Scenario'): SimulationResult {
    const { simulation } = executeHydrologySimulation(
      this.zones,
      {
        rainfallMm: params.rainfallMm,
        durationHours: params.durationHours,
        stormProfile: params.stormProfile,
        intervention: {
          storageCapacityMultiplier: params.storageCapacityMultiplier,
          captureUpgradePercent: params.captureUpgradePercent,
          drainageEfficiencyImprovementPercent: 0,
          targetedZones: params.activeInterventions,
        },
        activeInterventions: params.activeInterventions,
      },
      scenarioName
    );
    return simulation;
  }

  public compareWithBaseline(params: ScenarioParams, scenarioName = 'Simulated Scenario'): ScenarioComparison {
    const { comparison } = executeHydrologySimulation(
      this.zones,
      {
        rainfallMm: params.rainfallMm,
        durationHours: params.durationHours,
        stormProfile: params.stormProfile,
        intervention: {
          storageCapacityMultiplier: params.storageCapacityMultiplier,
          captureUpgradePercent: params.captureUpgradePercent,
          drainageEfficiencyImprovementPercent: 0,
          targetedZones: params.activeInterventions,
        },
        activeInterventions: params.activeInterventions,
      },
      scenarioName
    );
    return comparison;
  }

  public getActionPlanForSimulation(simulation: SimulationResult): ActionItem[] {
    return generateActionPlan(simulation, this.zones);
  }

  public async explainWithBedrock(simulation: SimulationResult): Promise<ExplanationResponse> {
    return apiClient.explainSimulation({
      simulation,
      zones: this.zones,
      intervention: {
        storageCapacityMultiplier: simulation.params.storageCapacityMultiplier,
        captureUpgradePercent: simulation.params.captureUpgradePercent,
        drainageEfficiencyImprovementPercent: 0,
        targetedZones: simulation.params.activeInterventions,
      },
    });
  }

  public getSingleZoneDetail(zoneId: string, params: ScenarioParams) {
    const zone = this.getZoneById(zoneId);
    if (!zone) return null;

    const hydro = computeZoneHydrology(
      zone,
      params.rainfallMm,
      params.durationHours,
      params.storageCapacityMultiplier,
      params.captureUpgradePercent,
      0.85,
      params.stormProfile
    );

    const isTargeted = params.activeInterventions.includes(zone.id);
    const risk = calculateZoneRisk(
      zone,
      hydro.runoffM3,
      hydro.peakRunoffRateM3Hr,
      hydro.drainageCapM3Hr,
      hydro.excessM3,
      hydro.effectiveStorageM3,
      isTargeted
    );

    const action = evaluateZoneAction(zone, {
      riskLevel: risk.riskLevel,
      drainageStressRatio: hydro.drainageStressRatio,
      excessOverflowM3: hydro.excessM3,
      runoffVolumeM3: hydro.runoffM3,
      capturePotentialM3: hydro.capturePotentialM3,
    });

    return {
      zone,
      analysis: {
        zoneId: zone.id,
        zoneCode: zone.code,
        zoneName: zone.name,
        baselineRunoffM3: hydro.runoffM3,
        interventionRunoffM3: hydro.runoffM3,
        baselineCapturedM3: hydro.capturedM3,
        interventionCapturedM3: hydro.capturedM3,
        baselineExcessM3: hydro.excessM3,
        interventionExcessM3: hydro.excessM3,
        baselineRiskScore: risk.riskScore,
        interventionRiskScore: risk.riskScore,
        baselineRisk: risk.riskLevel,
        interventionRisk: risk.riskLevel,
        captureDeltaM3: 0,
        excessReductionM3: 0,
        floodReductionPercent: 0,
        runoffVolumeM3: hydro.runoffM3,
        peakRunoffRateM3Hr: hydro.peakRunoffRateM3Hr,
        drainageCapM3Hr: hydro.drainageCapM3Hr,
        drainageStressRatio: hydro.drainageStressRatio,
        infiltratedVolumeM3: hydro.infiltratedM3,
        drainedVolumeM3: hydro.drainedM3,
        capturePotentialM3: hydro.capturePotentialM3,
        capturedVolumeM3: hydro.capturedM3,
        excessOverflowM3: hydro.excessM3,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        recommendedIntervention: action.recommendedIntervention,
        action: action.recommendedIntervention,
        interventionReason: action.interventionReason,
        expectedModeledImpact: action.expectedModeledImpact,
        riskFactors: risk.riskFactors,
      },
    };
  }
}

export const hydrologyService = new HydrologyService();
