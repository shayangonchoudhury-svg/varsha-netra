/**
 * Shared Hydrology Types for Varshaনেত্র.
 * Used across React Frontend and AWS Lambda Handlers.
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type InterventionType = 'PROTECT' | 'REDIRECT' | 'STORE';

export type StormProfileType = 'monsoon_steady' | 'tropical_downpour' | 'cloudburst' | 'cyclonic_surge';

export interface SurfaceBreakdown {
  roofSqM: number;
  imperviousPavedSqM: number;
  permeableTurfSqM: number;
  bioRetentionSqM: number;
}

export interface CriticalAsset {
  name: string;
  type: 'substation' | 'server_room' | 'library_basement' | 'transit_access' | 'lab_complex';
  elevationRisk: 'critical' | 'moderate' | 'safe';
}

/**
 * Demonstration Zone Parameter Model.
 * Clearly identified as demonstration digital twin parameters for KIIT Campus.
 */
export interface CampusZone {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  description: string;
  elevationMeters: number;
  totalAreaSqM: number;
  runoffCoefficient: number; // 0.0 - 1.0 (Composite C)
  surfaceBreakdown: SurfaceBreakdown;
  baseDrainageCapM3PerHour: number;
  baseStorageCapM3: number; // Baseline cistern/pond storage
  baseInfiltrationM3: number; // Natural soil absorption baseline
  maxStoragePotentialM3: number;
  elevationStress: 'low' | 'moderate' | 'severe';
  infrastructureSensitivity: number; // 0.0 - 1.0
  flowDestinationId: string | null;
  criticalAssets: CriticalAsset[];
  mapCoordinates: {
    cx: number;
    cy: number;
    labelX: number;
    labelY: number;
  };
  svgPath: string;
}

export interface RainEvent {
  id: string;
  name: string;
  location: string;
  rainfallMm: number;
  durationHours: number;
  peakIntensityMmHr: number;
  stormProfile: StormProfileType;
  forecastWindow: string;
  statusHeadline: string;
  timestamp: string;
}

export interface InterventionPlan {
  storageCapacityMultiplier: number; // e.g. 1.0 to 2.5 (+0% to +150%)
  captureUpgradePercent: number; // e.g. 0% to 80% (permeable pavement & bio-swales)
  drainageEfficiencyImprovementPercent: number; // e.g. 0% to 40% (desilting & pump automation)
  targetedZones: string[]; // specific zone IDs with localized deployable barriers / sumps
}

export interface ScenarioParams {
  rainfallMm: number;
  durationHours: number;
  storageCapacityMultiplier: number;
  captureUpgradePercent: number;
  stormProfile: StormProfileType;
  activeInterventions: string[];
}

export interface SimulationInput {
  rainfallMm: number;
  durationHours: number;
  stormProfile?: StormProfileType;
  intervention?: Partial<InterventionPlan>;
  activeInterventions?: string[];
}

export interface ZoneRiskFactorsBreakdown {
  runoffStress: number;
  drainageStress: number;
  excessStress: number;
  storageStress: number;
  elevationStress: number;
  infrastructureSensitivity: number;
}

export interface ZoneAnalysis {
  zoneId: string;
  zoneCode: string;
  zoneName: string;

  // Baseline vs Intervention outputs
  baselineRunoffM3: number;
  interventionRunoffM3: number;

  baselineCapturedM3: number;
  interventionCapturedM3: number;

  baselineExcessM3: number;
  interventionExcessM3: number;

  baselineRiskScore: number;
  interventionRiskScore: number;

  baselineRisk: RiskLevel;
  interventionRisk: RiskLevel;

  // Deltas
  captureDeltaM3: number;
  excessReductionM3: number;
  floodReductionPercent: number;

  // Single active view metrics (matching current UI)
  runoffVolumeM3: number;
  peakRunoffRateM3Hr: number;
  drainageCapM3Hr: number;
  drainageStressRatio: number;
  capturePotentialM3: number;
  capturedVolumeM3: number;
  infiltratedVolumeM3: number;
  drainedVolumeM3: number;
  excessOverflowM3: number;
  riskScore: number;
  riskLevel: RiskLevel;

  // Action recommendation
  recommendedIntervention: InterventionType;
  action: InterventionType;
  interventionReason: string;
  expectedModeledImpact: string;
  riskFactors: string[];
  riskFactorScores?: ZoneRiskFactorsBreakdown;
}

export interface SimulationResult {
  id: string;
  scenarioName: string;
  timestamp: string;
  params: ScenarioParams;
  zones: ZoneAnalysis[];
  totalRainfallVolumeM3: number;
  totalRunoffM3: number;
  totalCapturedM3: number;
  totalExcessM3: number;
  overallRisk: RiskLevel;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  captureEfficiencyPct: number;
  floodReductionPct: number;
  executionDurationMs?: number;
}

export interface SimulationResponse {
  rainfallMm: number;
  durationHours: number;
  totalRainVolumeM3: number;
  totalRunoffM3: number;
  totalCapturedM3: number;
  totalExcessM3: number;
  floodReductionPercent: number;
  highRiskZoneCount: number;
  mediumRiskZoneCount: number;
  lowRiskZoneCount: number;
  zones: ZoneAnalysis[];
  simulation: SimulationResult;
  comparison: ScenarioComparison;
}

export interface ActionItem {
  id: string;
  priority: 'P1' | 'P2' | 'P3';
  action: InterventionType;
  zoneId: string;
  zoneName: string;
  reason: string;
  expectedImpact: string;
  specificMeasure: string;
  estimatedEffort: 'Immediate (0-2h)' | 'Short-Term (2-6h)' | 'Pre-Storm Staging';
  status: 'recommended' | 'staged' | 'deployed';
}

export interface ImpactMetrics {
  waterCapturedM3: number;
  waterCapturedLiters: number;
  campusDaysSupplyEquivalent: number;
  excessReductionM3: number;
  excessReductionPct: number;
  riskStateImprovementCount: number;
  priorityZonesProtected: number;
  groundwaterRechargeEstimateM3: number;
  municipalWaterOffsetINR: number;
}

export interface ScenarioComparison {
  baseline: SimulationResult;
  simulated: SimulationResult;
  deltas: {
    capturedVolumeM3Delta: number;
    excessOverflowM3Delta: number;
    highRiskZonesReduced: number;
    efficiencyGainPct: number;
  };
  impact: ImpactMetrics;
}

export interface ExplanationRequest {
  simulation: SimulationResult;
  zones: CampusZone[];
  intervention?: InterventionPlan;
}

export interface ExplanationResponse {
  executiveSummary: string;
  highRiskCausality: {
    zoneName: string;
    riskLevel: RiskLevel;
    explanation: string;
  }[];
  interventionBenefits: string;
  actionPrioritiesSummary: string;
  modelTimestamp: string;
  generatedBy: 'Amazon Bedrock (Claude 3.5 Sonnet)' | 'Local Fallback Engine';
}

/**
 * DynamoDB Entity Schemas
 */
export interface DynamoSimulationRecord {
  simulationId: string;
  createdAt: string;
  rainfallMm: number;
  durationHours: number;
  intervention: InterventionPlan;
  totalRunoffM3: number;
  totalCapturedM3: number;
  totalExcessM3: number;
  floodReductionPercent: number;
  highRiskZoneCount: number;
  resultsSummary: {
    overallRisk: RiskLevel;
    zonesCount: number;
    campusDaysSupply: number;
  };
}

export interface DynamoActionPlanRecord {
  actionPlanId: string;
  simulationId: string;
  createdAt: string;
  rainfallMm: number;
  items: ActionItem[];
  totalDirectives: number;
  urgentP1Count: number;
}
