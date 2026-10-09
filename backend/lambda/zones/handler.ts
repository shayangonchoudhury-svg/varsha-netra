/**
 * AWS Lambda Handler: GET /zones
 *
 * Returns the bounded campus zone topology and demonstration digital twin parameters.
 */

import { KIIT_CAMPUS_ZONES } from '../../../src/data/kiitCampusData';
import { DEMO_PROVENANCE_METADATA } from '../../../shared/hydrology/constants';

export interface APIGatewayEvent {
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
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
};

export async function handler(event: APIGatewayEvent): Promise<APIGatewayResponse> {
  const requestId = event.requestContext?.requestId || `req_${Date.now()}`;

  console.log(JSON.stringify({
    level: 'INFO',
    type: 'ZONE_RETRIEVAL_REQUEST',
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

    let returnedZones = KIIT_CAMPUS_ZONES;
    const zonesTable = process.env.DYNAMODB_ZONES_TABLE;

    if (zonesTable) {
      try {
        const { DynamoDBClient, ScanCommand } = await import('@aws-sdk/client-dynamodb');
        const { unmarshall } = await import('@aws-sdk/util-dynamodb');
        const client = new DynamoDBClient({ region: process.env.AWS_REGION || process.env.APP_REGION || 'ap-south-1' });
        const scanRes = await client.send(new ScanCommand({ TableName: zonesTable }));
        if (scanRes.Items && scanRes.Items.length > 0) {
          returnedZones = scanRes.Items.map((item) => unmarshall(item) as any);
        }
      } catch (dbErr) {
        // Fall back gracefully to demonstration dataset
      }
    }

    const responseData = {
      metadata: DEMO_PROVENANCE_METADATA,
      totalZones: returnedZones.length,
      zones: returnedZones,
    };

    console.log(JSON.stringify({
      level: 'INFO',
      type: 'ZONE_RETRIEVAL_SUCCESS',
      requestId,
      totalZones: returnedZones.length,
    }));

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(responseData),
    };
  } catch (error: any) {
    console.error(JSON.stringify({
      level: 'ERROR',
      type: 'ZONE_RETRIEVAL_FAILURE',
      requestId,
      error: error.message,
    }));

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'LAMBDA_EXECUTION_ERROR',
        message: error.message || 'Internal error retrieving campus zones',
      }),
    };
  }
}
