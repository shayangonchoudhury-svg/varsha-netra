/**
 * AWS Lambda Handler: POST /explain
 *
 * Amazon Bedrock Natural Language Explanation Layer.
 *
 * CRITICAL PRINCIPLE:
 * "AI explains the model. It does not invent the risk."
 *
 * The model NEVER calculates flood risk, runoff, storage, excess water, or intervention numbers.
 * It receives already-validated deterministic hydrology results and synthesizes a plain-language
 * operational dispatch narrative for campus facilities management.
 */

import { ExplanationRequest, ExplanationResponse, RiskLevel } from '../../../shared/hydrology/types';

export interface APIGatewayEvent {
  body: string | null;
  headers?: Record<string, string>;
  httpMethod?: string;
  path?: string;
  requestContext?: {
    requestId?: string;
  };
}

export interface APIGatewayResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
};

export async function handler(event: APIGatewayEvent): Promise<APIGatewayResponse> {
  const requestId = event.requestContext?.requestId || `req_${Date.now()}`;

  console.log(JSON.stringify({
    level: 'INFO',
    type: 'BEDROCK_EXPLANATION_REQUEST',
    requestId,
    timestamp: new Date().toISOString(),
  }));

  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'OK' }),
      };
    }

    const payload: ExplanationRequest = event.body ? JSON.parse(event.body) : ({} as any);

    if (!payload.simulation) {
      console.warn(JSON.stringify({
        level: 'WARN',
        type: 'MISSING_SIMULATION_PAYLOAD',
        requestId,
      }));

      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'MISSING_SIMULATION_DATA',
          message: 'A validated simulation object is required for explanation',
        }),
      };
    }

    const sim = payload.simulation;
    const highRiskZones = sim.zones.filter((z) => z.riskLevel === 'HIGH');
    const mediumRiskZones = sim.zones.filter((z) => z.riskLevel === 'MEDIUM');

    // Bedrock Invocation Structure (when running in AWS with IAM role)
    const isAwsBedrockConfigured = Boolean((process.env.AWS_REGION || process.env.APP_REGION) && process.env.BEDROCK_ENABLED === 'true');
    let generatedBy: 'Amazon Bedrock (Claude 3.5 Sonnet)' | 'Local Fallback Engine' = 'Local Fallback Engine';
    let bedrockExecutiveSummary: string | null = null;

    if (isAwsBedrockConfigured) {
      try {
        const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
        console.log(JSON.stringify({
          level: 'INFO',
          type: 'BEDROCK_INVOKE_START',
          requestId,
          modelId,
        }));

        const { BedrockRuntimeClient, InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
        const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || process.env.APP_REGION || 'ap-south-1' });

        const promptText = `You are the environmental operations dispatcher for Varshaনেত্র (Rain-to-Reserve Intelligence System).
CRITICAL PRINCIPLE: The following numerical values and risk classifications are authoritative civil engineering outputs. Do NOT calculate, change, or dispute any numbers. Synthesize a concise 2-sentence operational executive summary.

Simulation Data:
- Storm: ${sim.params.rainfallMm} mm over ${sim.params.durationHours} hours
- Total Gross Stormwater Runoff: ${sim.totalRunoffM3.toLocaleString()} m³
- Captured/Harvested Water: ${sim.totalCapturedM3.toLocaleString()} m³ (${sim.captureEfficiencyPct}% harvest efficiency)
- Remaining Flood Excess: ${sim.totalExcessM3.toLocaleString()} m³
- Flood Excess Reduction: ${sim.floodReductionPct}%
- Campus Supply Equivalent: ${(sim.totalCapturedM3 * 1000 / 120000).toFixed(1)} days of non-potable autonomy
- High Risk Zones: ${highRiskZones.map(z => z.zoneCode).join(', ') || 'None'}
- Storage Upgrade: +${Math.round((sim.params.storageCapacityMultiplier - 1) * 100)}%
- Infiltration Retrofits: +${sim.params.captureUpgradePercent}%`;

        const payloadBody = JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 300,
          messages: [{ role: 'user', content: promptText }],
        });

        const command = new InvokeModelCommand({
          modelId,
          contentType: 'application/json',
          accept: 'application/json',
          body: new TextEncoder().encode(payloadBody),
        });

        const response = await client.send(command);
        const responseJson = JSON.parse(new TextDecoder().decode(response.body));
        if (responseJson?.content?.[0]?.text) {
          bedrockExecutiveSummary = responseJson.content[0].text.trim();
          generatedBy = 'Amazon Bedrock (Claude 3.5 Sonnet)';
        }
      } catch (bedrockErr: any) {
        console.warn(JSON.stringify({
          level: 'WARN',
          type: 'BEDROCK_FALLBACK_TRIGGERED',
          requestId,
          reason: bedrockErr.message,
        }));
      }
    } else {
      console.log(JSON.stringify({
        level: 'INFO',
        type: 'BEDROCK_LOCAL_FALLBACK_APPLIED',
        requestId,
      }));
    }

    // High-fidelity deterministic narrative synthesis (guaranteed exact numerical fidelity)
    const executiveSummary = bedrockExecutiveSummary || `Under the modeled ${sim.params.rainfallMm} mm storm event (${sim.params.durationHours}h window), KIIT Campus generates ${sim.totalRunoffM3.toLocaleString()} m³ of gross stormwater runoff. Proactive storage and diversion interventions capture ${sim.totalCapturedM3.toLocaleString()} m³ (${sim.captureEfficiencyPct}% harvest efficiency), providing ${(sim.totalCapturedM3 * 1000 / 120000).toFixed(1)} days of non-potable utility reserve autonomy while reducing localized surface flooding by ${sim.floodReductionPct}%.`;

    const highRiskCausality = sim.zones.map((z) => {
      let explanation = '';
      if (z.riskLevel === 'HIGH') {
        explanation = `Zone ${z.zoneCode} (${z.zoneName}) suffers acute hydraulic stress (${z.drainageStressRatio.toFixed(2)}x capacity ratio) with ${z.excessOverflowM3.toFixed(1)} m³ of standing surface water, threatening critical low-elevation infrastructure.`;
      } else if (z.riskLevel === 'MEDIUM') {
        explanation = `Zone ${z.zoneCode} experiences elevated surface runoff (${z.runoffVolumeM3.toFixed(1)} m³) due to impervious paving; manageable via swale redirection.`;
      } else {
        explanation = `Zone ${z.zoneCode} exhibits stable drainage with high infiltration and complete rainwater harvesting capture.`;
      }

      return {
        zoneName: `${z.zoneCode} · ${z.zoneName}`,
        riskLevel: z.riskLevel as RiskLevel,
        explanation,
      };
    });

    const interventionBenefits = `The resilience intervention expands campus storage capacity by ${Math.round((sim.params.storageCapacityMultiplier - 1) * 100)}% and adds +${sim.params.captureUpgradePercent}% infiltration retrofits. This de-escalates ${highRiskZones.length} critical zones and creates an additional harvest reserve for cooling towers and sanitation.`;

    const actionPrioritiesSummary = highRiskZones.length > 0
      ? `Priority P1: Immediate submersible sump pump activation and barrier deployment at ${highRiskZones.map((z) => z.zoneCode).join(', ')}. Priority P2: Open bio-swale bypass gates at ${mediumRiskZones.map((z) => z.zoneCode).join(', ')}.`
      : `All zones within acceptable operating thresholds. Maintain standard pre-storm vortex silt trap clearance and reserve cistern routing.`;

    const response: ExplanationResponse = {
      executiveSummary,
      highRiskCausality,
      interventionBenefits,
      actionPrioritiesSummary,
      modelTimestamp: new Date().toISOString(),
      generatedBy,
    };

    console.log(JSON.stringify({
      level: 'INFO',
      type: 'BEDROCK_EXPLANATION_SUCCESS',
      requestId,
      generatedBy,
    }));

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    console.error(JSON.stringify({
      level: 'ERROR',
      type: 'BEDROCK_EXPLANATION_FAILURE',
      requestId,
      error: error.message,
    }));

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'EXPLANATION_FAILED',
        message: error.message || 'Failed to generate explanation',
      }),
    };
  }
}
