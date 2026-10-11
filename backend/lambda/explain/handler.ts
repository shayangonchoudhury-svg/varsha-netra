/**
 * AWS Lambda Handler: POST /explain
 *
 * Amazon Bedrock Natural Language Explanation Layer.
 *
 * CRITICAL PRINCIPLE:
 * "AI explains the model. It does not invent the risk."
 *
 * Numerical values and risk classifications come from the deterministic
 * hydrology engine. Capture efficiency is not the same as flood reduction.
 * Excess-runoff reduction is reported only when a baseline comparison exists.
 */

import {
  ExplanationRequest,
  ExplanationResponse,
  RiskLevel,
} from '../../../shared/hydrology/types';

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
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
};

export async function handler(
  event: APIGatewayEvent
): Promise<APIGatewayResponse> {
  const requestId =
    event.requestContext?.requestId || `req_${Date.now()}`;

  console.log(
    JSON.stringify({
      level: 'INFO',
      type: 'BEDROCK_EXPLANATION_REQUEST',
      requestId,
      timestamp: new Date().toISOString(),
    })
  );

  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'OK' }),
      };
    }

    const payload: ExplanationRequest = event.body
      ? JSON.parse(event.body)
      : ({} as ExplanationRequest);

    if (!payload.simulation) {
      console.warn(
        JSON.stringify({
          level: 'WARN',
          type: 'MISSING_SIMULATION_PAYLOAD',
          requestId,
        })
      );

      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'MISSING_SIMULATION_DATA',
          message:
            'A validated simulation object is required for explanation',
        }),
      };
    }

    const sim = payload.simulation;
    const comparison = payload.comparison;

    const highRiskZones = sim.zones.filter(
      (z) => z.riskLevel === 'HIGH'
    );

    const mediumRiskZones = sim.zones.filter(
      (z) => z.riskLevel === 'MEDIUM'
    );

    const excessReductionPct =
      comparison?.impact.excessReductionPct;

    const excessReductionSummary =
      typeof excessReductionPct === 'number'
        ? `The modeled excess-runoff reduction relative to the baseline is ${excessReductionPct}%.`
        : 'A baseline comparison was not provided, so excess-runoff reduction cannot be reported.';

    const waterSupplyDays = (
      (sim.totalCapturedM3 * 1000) / 120000
    ).toFixed(1);

    const storageUpgradePct = Math.round(
      (sim.params.storageCapacityMultiplier - 1) * 100
    );

    // Bedrock explains authoritative model outputs; it does not calculate them.
    const isAwsBedrockConfigured = Boolean(
      (process.env.AWS_REGION || process.env.APP_REGION) &&
        process.env.BEDROCK_ENABLED === 'true'
    );

    let generatedBy:
      | 'Amazon Bedrock (Claude 3.5 Sonnet)'
      | 'Local Fallback Engine' = 'Local Fallback Engine';

    let bedrockExecutiveSummary: string | null = null;

    if (isAwsBedrockConfigured) {
      try {
        const modelId =
          process.env.BEDROCK_MODEL_ID ||
          'anthropic.claude-3-5-sonnet-20241022-v2:0';

        console.log(
          JSON.stringify({
            level: 'INFO',
            type: 'BEDROCK_INVOKE_START',
            requestId,
            modelId,
          })
        );

        const {
          BedrockRuntimeClient,
          InvokeModelCommand,
        } = await import('@aws-sdk/client-bedrock-runtime');

        const client = new BedrockRuntimeClient({
          region:
            process.env.AWS_REGION ||
            process.env.APP_REGION ||
            'ap-south-1',
        });

        const promptText = `You are the environmental operations explanation assistant for Varshaনেত্র, a campus rainwater and flood-risk modeling system.

Write a concise, two-sentence executive summary using only the supplied simulation data.

Rules:
1. Do not calculate or invent numerical values.
2. Capture efficiency describes the share of runoff captured; it is NOT flood reduction.
3. Report excess-runoff reduction only when a baseline comparison percentage is explicitly provided.
4. If the baseline comparison is unavailable, explicitly say that excess-runoff reduction cannot be determined from the supplied data.
5. Do not claim flooding was eliminated, risk zones were de-escalated, or real-world outcomes were verified.
6. Describe these values as modeled estimates, not measured field observations.

Simulation data:
- Storm: ${sim.params.rainfallMm} mm over ${sim.params.durationHours} hours
- Modeled total runoff: ${sim.totalRunoffM3.toLocaleString()} m³
- Modeled captured water: ${sim.totalCapturedM3.toLocaleString()} m³
- Capture efficiency: ${sim.captureEfficiencyPct}%
- Modeled excess overflow: ${sim.totalExcessM3.toLocaleString()} m³
- Baseline-relative excess-runoff reduction: ${
          typeof excessReductionPct === 'number'
            ? `${excessReductionPct}%`
            : 'NOT AVAILABLE — no baseline comparison supplied'
        }
- Estimated non-potable supply equivalent: ${waterSupplyDays} days, assuming demand of 120,000 litres per day
- High-risk zones in this scenario: ${
          highRiskZones.map((z) => z.zoneCode).join(', ') || 'None'
        }
- Configured storage-capacity change: ${storageUpgradePct}%
- Configured capture upgrade: ${sim.params.captureUpgradePercent}%`;

        const payloadBody = JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content: promptText,
            },
          ],
        });

        const command = new InvokeModelCommand({
          modelId,
          contentType: 'application/json',
          accept: 'application/json',
          body: new TextEncoder().encode(payloadBody),
        });

        const response = await client.send(command);
        const responseJson = JSON.parse(
          new TextDecoder().decode(response.body)
        );

        if (responseJson?.content?.[0]?.text) {
          bedrockExecutiveSummary =
            responseJson.content[0].text.trim();

          generatedBy =
            'Amazon Bedrock (Claude 3.5 Sonnet)';
        }
      } catch (bedrockErr: any) {
        console.warn(
          JSON.stringify({
            level: 'WARN',
            type: 'BEDROCK_FALLBACK_TRIGGERED',
            requestId,
            reason: bedrockErr?.message || 'Unknown Bedrock error',
          })
        );
      }
    } else {
      console.log(
        JSON.stringify({
          level: 'INFO',
          type: 'BEDROCK_LOCAL_FALLBACK_APPLIED',
          requestId,
        })
      );
    }

    // Deterministic fallback summary.
    // Never use sim.floodReductionPct as excess-runoff reduction here.
    const fallbackExecutiveSummary =
      `Under the modeled ${sim.params.rainfallMm} mm storm over ${sim.params.durationHours} hours, KIIT Campus produces an estimated ${sim.totalRunoffM3.toLocaleString()} m³ of runoff. The model captures ${sim.totalCapturedM3.toLocaleString()} m³ of water (${sim.captureEfficiencyPct}% capture efficiency), equivalent to approximately ${waterSupplyDays} days of non-potable supply at an assumed demand of 120,000 litres per day. ${excessReductionSummary}`;

    const executiveSummary =
      bedrockExecutiveSummary || fallbackExecutiveSummary;

    const highRiskCausality = sim.zones.map((z) => {
      let explanation: string;

      if (z.riskLevel === 'HIGH') {
        explanation =
          `Zone ${z.zoneCode} (${z.zoneName}) is classified HIGH risk in this modeled scenario. Its drainage-stress ratio is ${z.drainageStressRatio.toFixed(2)}x, with ${z.excessOverflowM3.toFixed(1)} m³ of modeled excess overflow.`;
      } else if (z.riskLevel === 'MEDIUM') {
        explanation =
          `Zone ${z.zoneCode} (${z.zoneName}) is classified MEDIUM risk in this modeled scenario, with ${z.runoffVolumeM3.toFixed(1)} m³ of modeled runoff. Further site assessment can help determine suitable drainage or diversion measures.`;
      } else {
        explanation =
          `Zone ${z.zoneCode} (${z.zoneName}) is classified LOW risk under the current modeled scenario. This classification is a model result and does not establish that all rainfall is captured or that on-site conditions have been verified.`;
      }

      return {
        zoneName: `${z.zoneCode} · ${z.zoneName}`,
        riskLevel: z.riskLevel as RiskLevel,
        explanation,
      };
    });

    const interventionBenefits =
      `Configured settings for this scenario: storage capacity multiplier ${sim.params.storageCapacityMultiplier}x (${storageUpgradePct >= 0 ? '+' : ''}${storageUpgradePct}% relative to the 1x reference) and capture upgrade ${sim.params.captureUpgradePercent}%. ${highRiskZones.length} zones remain classified as HIGH risk in the current simulation. These settings do not, by themselves, demonstrate that flooding has been eliminated or that any zone has been de-escalated.`;

    const actionPrioritiesSummary =
      highRiskZones.length > 0
        ? `Priority: assess the modeled high-risk zones (${highRiskZones.map((z) => z.zoneCode).join(', ')}) for drainage capacity, overflow pathways, and site conditions before selecting mitigation measures.${mediumRiskZones.length > 0 ? ` Also review the medium-risk zones (${mediumRiskZones.map((z) => z.zoneCode).join(', ')}).` : ''}`
        : `No zones are classified as HIGH risk in this modeled scenario. Continue routine drainage inspections and verify site conditions before relying on the model for operational decisions.`;

    const response: ExplanationResponse = {
      executiveSummary,
      highRiskCausality,
      interventionBenefits,
      actionPrioritiesSummary,
      modelTimestamp: new Date().toISOString(),
      generatedBy,
    };

    console.log(
      JSON.stringify({
        level: 'INFO',
        type: 'BEDROCK_EXPLANATION_SUCCESS',
        requestId,
        generatedBy,
      })
    );

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        type: 'BEDROCK_EXPLANATION_FAILURE',
        requestId,
        error: error?.message || 'Unknown error',
      })
    );

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'EXPLANATION_FAILED',
        message:
          error?.message || 'Failed to generate explanation',
      }),
    };
  }
}