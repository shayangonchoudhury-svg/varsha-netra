/**
 * AWS Lambda Handler: POST /simulate
 *
 * Authoritative Deterministic Hydrology Simulator.
 * Receives storm parameters and intervention plans, executes the pure
 * mathematical engine, and returns comprehensive baseline vs intervention deltas.
 */

import { executeHydrologySimulation } from '../../../shared/hydrology/deterministicHydrology';
import { generateActionPlan } from '../../../shared/hydrology/interventions';
import { SimulationInput, SimulationResponse, DynamoSimulationRecord, DynamoActionPlanRecord } from '../../../shared/hydrology/types';
import { KIIT_CAMPUS_ZONES } from '../../../src/data/kiitCampusData';

export interface APIGatewayEvent {
  body: string | null;
  headers?: Record<string, string>;
  httpMethod?: string;
  path?: string;
  requestContext?: {
    requestId?: string;
    identity?: {
      sourceIp?: string;
    };
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
  const startTime = Date.now();
  const requestId = event.requestContext?.requestId || `req_${Date.now()}`;

  // Structured Logging: Simulation Start
  console.log(JSON.stringify({
    level: 'INFO',
    type: 'SIMULATION_START',
    requestId,
    timestamp: new Date().toISOString(),
  }));

  try {
    // Handle OPTIONS Preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'OK' }),
      };
    }

    const payload: SimulationInput = event.body ? JSON.parse(event.body) : {};

    // Validate Input
    const rainfallMm = Number(payload.rainfallMm);
    const durationHours = Number(payload.durationHours);

    if (isNaN(rainfallMm) || rainfallMm < 0) {
      console.warn(JSON.stringify({
        level: 'WARN',
        type: 'INVALID_INPUT_REJECTION',
        requestId,
        rainfallMm: payload.rainfallMm,
      }));

      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'INVALID_INPUT',
          message: 'rainfallMm must be a non-negative number',
        }),
      };
    }

    if (isNaN(durationHours) || durationHours <= 0) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'INVALID_INPUT',
          message: 'durationHours must be greater than 0',
        }),
      };
    }

    // Execute Authoritative Deterministic Hydrology Engine
    const { simulation, comparison } = executeHydrologySimulation(
      KIIT_CAMPUS_ZONES,
      payload,
      'AWS Lambda Simulation'
    );

    const executionDurationMs = Date.now() - startTime;

    // Optional DynamoDB Persistence
    const simTable = process.env.DYNAMODB_SIMULATION_TABLE;
    if (simTable) {
      try {
        const record: DynamoSimulationRecord = {
          simulationId: simulation.id,
          createdAt: simulation.timestamp,
          rainfallMm: simulation.params.rainfallMm,
          durationHours: simulation.params.durationHours,
          intervention: {
            storageCapacityMultiplier: simulation.params.storageCapacityMultiplier,
            captureUpgradePercent: simulation.params.captureUpgradePercent,
            drainageEfficiencyImprovementPercent: 0,
            targetedZones: simulation.params.activeInterventions,
          },
          totalRunoffM3: simulation.totalRunoffM3,
          totalCapturedM3: simulation.totalCapturedM3,
          totalExcessM3: simulation.totalExcessM3,
          floodReductionPercent: comparison.impact.excessReductionPct,
          highRiskZoneCount: simulation.highRiskCount,
          resultsSummary: {
            overallRisk: simulation.overallRisk,
            zonesCount: simulation.zones.length,
            campusDaysSupply: comparison.impact.campusDaysSupplyEquivalent,
          },
        };

        // Persist to DynamoDB when running in AWS Lambda environment
        const { DynamoDBClient, PutItemCommand } = await import('@aws-sdk/client-dynamodb');
        const { marshall } = await import('@aws-sdk/util-dynamodb');
        const client = new DynamoDBClient({ region: process.env.AWS_REGION || process.env.APP_REGION || 'ap-south-1' });
        await client.send(new PutItemCommand({ TableName: simTable, Item: marshall(record) }));

        // Optional Action Plans Persistence
        const actionTable = process.env.DYNAMODB_ACTION_PLANS_TABLE;
        const planItems = generateActionPlan(simulation, KIIT_CAMPUS_ZONES);
        if (actionTable && planItems.length > 0) {
          const actionRecord: DynamoActionPlanRecord = {
            actionPlanId: `plan_${simulation.id}`,
            simulationId: simulation.id,
            createdAt: simulation.timestamp,
            rainfallMm: simulation.params.rainfallMm,
            items: planItems,
            totalDirectives: planItems.length,
            urgentP1Count: planItems.filter((i) => i.priority === 'P1').length,
          };
          await client.send(new PutItemCommand({ TableName: actionTable, Item: marshall(actionRecord) }));
        }

        console.log(JSON.stringify({
          level: 'INFO',
          type: 'DYNAMODB_PERSISTENCE_SUCCESS',
          requestId,
          simulationId: simulation.id,
        }));
      } catch (dbErr) {
        console.error(JSON.stringify({
          level: 'ERROR',
          type: 'DYNAMODB_PERSISTENCE_FAILURE',
          requestId,
          message: (dbErr as Error).message,
        }));
      }
    }

    const responseData: SimulationResponse = {
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
      simulation: {
        ...simulation,
        executionDurationMs,
      },
      comparison,
    };

    // Structured Logging: Simulation Completion
    console.log(JSON.stringify({
      level: 'INFO',
      type: 'SIMULATION_COMPLETED',
      requestId,
      rainfallMm,
      totalRunoffM3: simulation.totalRunoffM3,
      totalCapturedM3: simulation.totalCapturedM3,
      totalExcessM3: simulation.totalExcessM3,
      highRiskCount: simulation.highRiskCount,
      durationMs: executionDurationMs,
    }));

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(responseData),
    };
  } catch (error: any) {
    console.error(JSON.stringify({
      level: 'ERROR',
      type: 'SIMULATION_EXECUTION_FAILURE',
      requestId,
      error: error.message,
      stack: error.stack,
    }));

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'LAMBDA_EXECUTION_ERROR',
        message: error.message || 'Internal simulation error occurred in Lambda',
      }),
    };
  }
}
