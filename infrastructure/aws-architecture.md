# Varshaনেত্র — AWS Cloud Architecture Specification

## 1. Executive Summary & Core Principle

**Varshaনেত্র** (*"See the rain. Shape the outcome."*) is an institutional Rain-to-Reserve Intelligence Platform engineered to convert heavy rainfall events into proactive flood risk mitigation and non-potable water capture strategies.

**CURRENT STATUS**: AWS deployment-ready; not yet deployed. Full standalone execution supported via local embedded deterministic engine.

### The Governing Principle
> **"AI explains the model. It does not invent the risk."**

All flood risk scores, runoff volumes, storage saturation kinetics, and excess overflow calculations are strictly **deterministic**—computed by pure mathematical civil engineering models running inside AWS Lambda. Amazon Bedrock is used exclusively as an asynchronous human-language synthesis layer to explain the authoritative model outputs.

---

## 2. Cloud Architecture Diagram

```
[ Institutional Weather Radar / Rainfall Forecast ]
                         │
                         ▼
        ┌───────────────────────────────────┐
        │       React 19 SPA (Vite)         │
        │    Hosted via AWS Amplify         │
        └─────────────────┬─────────────────┘
                          │ HTTPS REST API
                          ▼
        ┌───────────────────────────────────┐
        │      Amazon API Gateway           │
        │  (Throttling, Validation, CORS)   │
        └───────┬───────────────────┬───────┘
                │                   │
    POST /simulate                  POST /explain
    GET  /zones                     │
                │                   ▼
                │        ┌────────────────────────┐
                │        │  AWS Lambda (Explain)  │
                │        └──────────┬─────────────┘
                │                   │
                ▼                   ▼
    ┌────────────────────────┐   ┌────────────────────────┐
    │ AWS Lambda (Simulate)  │   │     Amazon Bedrock     │
    │  ├── Hydrology Engine  │   │ (Claude 3.5 Sonnet v2) │
    │  ├── Risk Engine       │   │  Authoritative Context │
    │  └── Intervention Model│   └────────────────────────┘
    └───────────┬────────────┘
                │ PutItem / Query
                ▼
    ┌────────────────────────┐
    │    Amazon DynamoDB     │
    │  (Simulations/History) │
    └────────────────────────┘
                │
                ▼
    ┌────────────────────────┐
    │    Amazon CloudWatch   │
    │ (Telemetry & Logging)  │
    └────────────────────────┘
```

---

## 3. Component Rationale & Service Roles

| AWS Service | Architecture Function | Rationale |
| :--- | :--- | :--- |
| **AWS Amplify** | Global CDN Frontend Hosting | Zero-configuration continuous deployment for React/Vite SPA with automated branch previews and TLS termination. |
| **Amazon API Gateway** | Managed REST API Proxy | Provides rate-limiting, schema validation, API key enforcement, and seamless CORS decoupling between frontend and compute. |
| **AWS Lambda** | Stateless Deterministic Compute | Runs isolated TypeScript mathematical models in sub-50ms with zero server maintenance overhead. |
| **Amazon DynamoDB** | High-Throughput NoSQL Store | Millisecond latency persistence for digital twin zones, historical simulation runs, and dispatched operational action plans. |
| **Amazon Bedrock** | Controlled Natural-Language Synthesis | Generates facility management briefs from validated model numbers without exposing privileged API keys to the browser. |
| **Amazon CloudWatch** | Unified Observability | Structured metric alarms for runoff computation errors, Lambda latency budgets, and API Gateway traffic. |

---

## 4. DynamoDB Schema & Table Design

### A. `VarshaNetra_SimulationRuns` Table
Stores immutable records of computed storm events and intervention scenarios.

- **Primary Partition Key (`PK`)**: `simulationId` (String, e.g. `sim_20261004_kiit_72mm`)
- **Primary Sort Key (`SK`)**: `createdAt` (String, ISO 8601 Timestamp)
- **Attributes**:
  ```json
  {
    "simulationId": "sim_1791104800000",
    "createdAt": "2026-10-04T08:00:00Z",
    "rainfallMm": 72,
    "durationHours": 18,
    "stormProfile": "monsoon_steady",
    "totalRunoffM3": 12902.4,
    "totalCapturedM3": 2727.2,
    "totalExcessM3": 675.7,
    "floodReductionPercent": 42.5,
    "highRiskZoneCount": 1,
    "intervention": {
      "storageCapacityMultiplier": 1.5,
      "captureUpgradePercent": 40,
      "drainageEfficiencyImprovementPercent": 15,
      "targetedZones": ["z-gate", "z-park"]
    },
    "resultsSummary": {
      "overallRisk": "MEDIUM",
      "zonesCount": 7,
      "campusDaysSupply": 22.7
    }
  }
  ```

### B. `VarshaNetra_Zones` Table
Stores digital twin topology for bounded institutional zones.

- **Primary Partition Key (`PK`)**: `zoneId` (String, e.g. `z-gate`, `z-acad`)
- **Attributes**:
  - `name`, `code`, `elevationMeters`, `totalAreaSqM`, `runoffCoefficient`, `baseDrainageCapM3PerHour`, `baseStorageCapM3`, `baseInfiltrationM3`, `criticalAssets` (Array).

### C. `VarshaNetra_ActionPlans` Table
Stores generated and dispatched physical mitigation action plans.

- **Primary Partition Key (`PK`)**: `actionPlanId` (String, e.g. `act_20261004_kiit_72mm`)
- **Primary Sort Key (`SK`)**: `simulationId` (String, links directly to simulation run)
- **Attributes**:
  ```json
  {
    "actionPlanId": "act_1791104800000",
    "simulationId": "sim_1791104800000",
    "createdAt": "2026-10-04T08:00:00Z",
    "rainfallMm": 72,
    "totalDirectives": 7,
    "urgentP1Count": 1,
    "items": [
      {
        "id": "act-z-gate",
        "priority": "P1",
        "action": "PROTECT",
        "zoneId": "z-gate",
        "zoneName": "Main Gate & Welcome Plaza",
        "reason": "Critical low-elevation infrastructure under hydraulic stress.",
        "expectedImpact": "Deploy automated barriers and submersible sumps.",
        "status": "recommended"
      }
    ]
  }
  ```

---

## 5. API Contracts & Endpoint Specifications

### A. `POST /simulate`
- **Request Body**:
  ```json
  {
    "rainfallMm": 72,
    "durationHours": 18,
    "stormProfile": "monsoon_steady",
    "intervention": {
      "storageCapacityMultiplier": 1.5,
      "captureUpgradePercent": 40,
      "drainageEfficiencyImprovementPercent": 15,
      "targetedZones": ["z-gate", "z-park"]
    }
  }
  ```
- **Validation**:
  - `rainfallMm`: required, non-negative number ($\ge 0$).
  - `durationHours`: required, positive number ($> 0$).
- **Success Response (`200 OK`)**: Structured `SimulationResponse` containing `rainfallMm`, `totalRunoffM3`, `totalCapturedM3`, `totalExcessM3`, `floodReductionPercent`, `zones` array (with `baselineRunoffM3`, `interventionRunoffM3`, `captureDeltaM3`, `excessReductionM3`, `action`), and `comparison`.
- **Error Response (`400 Bad Request` / `500 Server Error`)**:
  ```json
  {
    "error": "INVALID_INPUT",
    "message": "rainfallMm must be a non-negative number"
  }
  ```

### B. `GET /zones`
- **Success Response (`200 OK`)**:
  ```json
  {
    "metadata": {
      "datasetName": "KIIT Campus Demonstration Digital Twin",
      "dataClassification": "DEMONSTRATION_PARAMETER_SET"
    },
    "totalZones": 7,
    "zones": [...]
  }
  ```

### C. `POST /explain`
- **Request Body**:
  ```json
  {
    "simulation": { ... },
    "zones": [ ... ],
    "intervention": { ... }
  }
  ```
- **Prompt Constraints**: Authoritative numerical fidelity; LLM only formats human-readable narrative.
- **Success Response (`200 OK`)**:
  ```json
  {
    "executiveSummary": "...",
    "highRiskCausality": [...],
    "interventionBenefits": "...",
    "actionPrioritiesSummary": "...",
    "modelTimestamp": "2026-10-04T08:00:00Z",
    "generatedBy": "Amazon Bedrock (Claude 3.5 Sonnet)"
  }
  ```

---

## 6. Security & IAM Execution Policies

### Lambda Execution Role Policy for Bedrock Access
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*:*:model/anthropic.claude-3-5-sonnet-20241022-v2:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/VarshaNetra_*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

---

## 6. Local Development vs. Production Mode

- **Local Mock Mode (`VITE_USE_MOCK_API=true`)**:
  Frontend calls `src/services/api.ts` which evaluates the shared `shared/hydrology/deterministicHydrology.ts` engine entirely in-memory. Zero network latency, instant iteration.
- **AWS Live Mode (`VITE_USE_MOCK_API=false`, `VITE_API_BASE_URL=https://api.yourdomain.com/v1`)**:
  Frontend issues authenticated HTTPS calls to Amazon API Gateway, which invokes AWS Lambda and DynamoDB.
