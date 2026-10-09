# Varshaনেত্র — AWS Production Integration Checklist

This checklist verifies the deployment of the serverless backend on AWS (`ap-south-1`) and its integration with the React/Amplify frontend.

---

## 1. REST API & Route Verification

- [ ] **GET `/health`**: Returns `200 OK` with `{ status: "ok", service: "varsha-netra-api", region: "ap-south-1" }` without external dependencies.
- [ ] **GET `/zones`**: Returns `200 OK` with 7 bounded digital twin zones and demonstration provenance metadata.
- [ ] **POST `/simulate` (35mm Moderate Shower)**: Returns `200 OK` with deterministic runoff, zero excess, and baseline vs intervention deltas.
- [ ] **POST `/simulate` (72mm Heavy Monsoon Baseline)**: Returns `200 OK` with accurate flood excess and risk categorization.
- [ ] **POST `/simulate` (125mm Cloudburst Flash Storm)**: Returns `200 OK` with peak flow rate scaling and local choke point identification.
- [ ] **POST `/simulate` (195mm Cyclonic Surge)**: Returns `200 OK` with campus-wide high risk triggering and intervention mitigation.
- [ ] **POST `/explain`**: Returns `200 OK` with natural language narrative synthesized from authoritative simulation results.

---

## 2. Model & Bedrock Guardrail Verification

- [ ] **Bedrock Uses Authoritative Numbers**: Explanation quotes exact model numbers (e.g. `12,902.4 m³`, `2,727.2 m³`) without modifying, rounding, or fabricating values.
- [ ] **Bedrock Cannot Alter Hydrology**: Bedrock prompt strictly enforces that LLM does not calculate flood risk or runoff.
- [ ] **Graceful Bedrock Fallback**: If Bedrock is disabled or model quota is exhausted, Lambda seamlessly returns the deterministic fallback summary.

---

## 3. Data Persistence & Invariants

- [ ] **Baseline Simulation Persists**: Record saved to `VarshaNetra_SimulationRuns` with `simulationId` [PK] and `createdAt` [SK].
- [ ] **Intervention Simulation Persists**: Dynamic delta metrics and intervention parameters stored in DynamoDB.
- [ ] **Action Plan Persists**: Dispatched directives saved to `VarshaNetra_ActionPlans`.
- [ ] **Conservation of Mass Holds in Production**: $V_{\text{runoff}} = V_{\text{captured}} + V_{\text{infiltrated}} + V_{\text{drained}} + V_{\text{excess}}$ verified across all records.

---

## 4. Error Handling & Security Verification

- [ ] **Invalid Input Rejection (`400 Bad Request`)**: Negative rainfall (`-50 mm`) or negative duration returns structured `{ "error": "INVALID_INPUT", "message": "..." }`.
- [ ] **Lambda Execution Errors (`500 Server Error`)**: Unhandled exceptions return structured JSON error payloads instead of raw stack traces.
- [ ] **CORS Verification**: API Gateway responds with configured `Access-Control-Allow-Origin` for the deployed AWS Amplify frontend.
- [ ] **Zero Credential Leakage**: No AWS access keys, secret keys, or Bedrock tokens exist in frontend bundle or client-side storage.
- [ ] **CloudWatch Structured Logging**: CloudWatch logs record `SIMULATION_START`, `SIMULATION_COMPLETED`, and `BEDROCK_EXPLANATION_REQUEST` without logging sensitive data.
