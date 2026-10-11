/**
 * Frontend API Abstraction Layer for Varshaনেত্র.
 *
 * Provides a clean interface between the React UI and the AWS backend.
 * Supports both Live AWS API Gateway mode and Local Deterministic Engine mode.
 *
 * CRITICAL PRINCIPLE:
 * The local and AWS calculations use the SAME deterministic hydrology engine.
 */

import {
  CampusZone,
  SimulationInput,
  SimulationResponse,
  ExplanationRequest,
  ExplanationResponse,
  DynamoSimulationRecord,
} from '../../shared/hydrology/types';
import { executeHydrologySimulation } from '../../shared/hydrology/deterministicHydrology';
import { KIIT_CAMPUS_ZONES } from '../data/kiitCampusData';

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : (typeof process !== 'undefined' ? process.env : {});
const API_BASE_URL = env?.VITE_API_BASE_URL || '/api';
const USE_MOCK_API = env?.VITE_USE_MOCK_API !== 'false'; // Defaults to true for local dev

export class VarshaNetraApiClient {
  private useLocalEngine = USE_MOCK_API;

  /**
   * Toggle between Local Deterministic Mode and AWS API Gateway Mode.
   */
  public setMockMode(enable: boolean) {
    this.useLocalEngine = enable;
  }

  public isMockMode(): boolean {
    return this.useLocalEngine;
  }

  /**
   * POST /simulate
   */
  public async simulateStorm(input: SimulationInput): Promise<SimulationResponse> {
    if (this.useLocalEngine) {
      return this.localSimulate(input);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`API Gateway error (${response.status}): ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('AWS API Gateway unavailable, falling back to local deterministic engine:', error);
      return this.localSimulate(input);
    }
  }

  /**
   * GET /zones
   */
  public async getZones(): Promise<CampusZone[]> {
    if (this.useLocalEngine) {
      return KIIT_CAMPUS_ZONES;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/zones`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch zones (${response.status})`);
      }

      const data = await response.json();
      return data.zones || KIIT_CAMPUS_ZONES;
    } catch (error) {
      return KIIT_CAMPUS_ZONES;
    }
  }

  /**
   * POST /explain
   * Amazon Bedrock Explanation Layer
   */
  public async explainSimulation(request: ExplanationRequest): Promise<ExplanationResponse> {
    if (this.useLocalEngine) {
      return this.localExplain(request);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Explanation API error (${response.status})`);
      }

      return await response.json();
    } catch (error) {
      return this.localExplain(request);
    }
  }

  /**
   * POST /simulations (DynamoDB Persistence)
   */
  public async saveSimulationRun(record: DynamoSimulationRecord): Promise<{ success: boolean; id: string }> {
    try {
      const stored = localStorage.getItem('varshanetra_simulation_history');
      const history = stored ? JSON.parse(stored) : [];
      history.unshift(record);
      localStorage.setItem('varshanetra_simulation_history', JSON.stringify(history.slice(0, 20)));
    } catch (e) {
      // ignore storage errors
    }

    if (!this.useLocalEngine) {
      try {
        await fetch(`${API_BASE_URL}/simulations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        });
      } catch (e) {
        // fail silently for offline dev
      }
    }

    return { success: true, id: record.simulationId };
  }

  // --- Local Fallback Handlers (Using exact same engine) ---

  private localSimulate(input: SimulationInput): SimulationResponse {
    const { simulation, comparison } = executeHydrologySimulation(
      KIIT_CAMPUS_ZONES,
      input,
      'Local Deterministic Run'
    );

    return {
      rainfallMm: simulation.params.rainfallMm,
      durationHours: simulation.params.durationHours,
      totalRainVolumeM3: simulation.totalRainfallVolumeM3,
      totalRunoffM3: simulation.totalRunoffM3,
      totalCapturedM3: simulation.totalCapturedM3,
      totalExcessM3: simulation.totalExcessM3,
      floodReductionPercent: comparison.impact.excessReductionPct,
      highRiskZoneCount: simulation.highRiskCount,
      mediumRiskZoneCount: simulation.mediumRiskCount,
      lowRiskZoneCount: simulation.lowRiskCount,
      zones: simulation.zones,
      simulation,
      comparison,
    };
  }

  private localExplain(request: ExplanationRequest): ExplanationResponse {
    const sim = request.simulation;
    const comparison = request.comparison;

    const highRisk = sim.zones.filter((z) => z.riskLevel === 'HIGH');
    const mediumRisk = sim.zones.filter((z) => z.riskLevel === 'MEDIUM');

    const excessReductionPct = comparison?.impact.excessReductionPct;

    const floodImpactSummary =
      typeof excessReductionPct === 'number'
        ? `The modeled excess-runoff reduction relative to the baseline is ${excessReductionPct}%.`
        : 'A baseline comparison was not provided, so excess-runoff reduction cannot be reported.';

    const waterSupplyDays = (
      (sim.totalCapturedM3 * 1000) / 120000
    ).toFixed(1);

    return {
      executiveSummary: `Under the modeled ${sim.params.rainfallMm} mm storm (${sim.params.durationHours}h), KIIT Campus produces ${sim.totalRunoffM3.toLocaleString()} m³ of runoff. The simulation captures ${sim.totalCapturedM3.toLocaleString()} m³ of water (${sim.captureEfficiencyPct}% capture efficiency), equivalent to approximately ${waterSupplyDays} days of non-potable campus utility supply under the assumed 120,000-litre daily demand. ${floodImpactSummary}`,

      highRiskCausality: sim.zones.map((z) => ({
        zoneName: `${z.zoneCode} · ${z.zoneName}`,
        riskLevel: z.riskLevel,
        explanation:
          z.riskLevel === 'HIGH'
            ? `Zone ${z.zoneCode} has elevated modeled drainage stress (${z.drainageStressRatio.toFixed(2)}x) and ${z.excessOverflowM3.toFixed(1)} m³ of modeled excess overflow.`
            : `Zone ${z.zoneCode} maintains adequate modeled drainage throughput under the ${sim.params.rainfallMm} mm event.`,
      })),

      interventionBenefits: `Configured intervention settings: storage capacity multiplier ${sim.params.storageCapacityMultiplier}x and capture upgrade ${sim.params.captureUpgradePercent}%. ${highRisk.length} zones remain classified as HIGH risk in this scenario. These settings alone do not establish that flooding has been eliminated.`,

      actionPrioritiesSummary:
        highRisk.length > 0
          ? `Prioritize further assessment of high-risk zones: ${highRisk.map((z) => z.zoneCode).join(', ')}. Review drainage and overflow conditions before selecting mitigation measures.${mediumRisk.length > 0 ? ` Also assess medium-risk zones: ${mediumRisk.map((z) => z.zoneCode).join(', ')}.` : ''}`
          : `No zones are classified as HIGH risk in this modeled scenario. Maintain drainage inspections and standard silt-trap clearance.`,

      modelTimestamp: new Date().toISOString(),
      generatedBy: 'Local Fallback Engine',
    };
  }
}

export const apiClient = new VarshaNetraApiClient();
