/**
 * AWS Lambda Handler: GET /health
 *
 * Health check probe for uptime monitoring and API Gateway connectivity verification.
 * Independent of third-party external services.
 */

export interface APIGatewayEvent {
  headers?: Record<string, string>;
  httpMethod?: string;
  path?: string;
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
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key',
};

export async function handler(event: APIGatewayEvent): Promise<APIGatewayResponse> {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'OK' }),
    };
  }

  const response = {
    status: 'ok',
    service: 'varsha-netra-api',
    version: '1.0.0',
    region: process.env.AWS_REGION || process.env.APP_REGION || 'ap-south-1',
    environment: 'production',
    timestamp: new Date().toISOString(),
  };

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(response),
  };
}
