# Varshaনেত্র Infrastructure & Deployment Guide

> **CURRENT STATUS**: AWS deployment-ready; not yet deployed.
> The platform runs seamlessly in local standalone mode using the embedded authoritative deterministic hydrology engine, and is architected to deploy onto AWS serverless infrastructure (`ap-south-1`).

## Quick Start (Local Development)

Varshaনেত্র includes an embedded deterministic calculation engine so it runs seamlessly out-of-the-box without requiring active AWS credentials.

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Run automated deterministic engine test suite
npx tsx tests/hydrologyEngine.test.ts
```

---

## Environment Configuration (`.env`)

```ini
# API Gateway Endpoint (Leave empty for Local Mode)
VITE_API_BASE_URL=""

# Use embedded deterministic engine (true for local dev, false for AWS deployment)
VITE_USE_MOCK_API="true"

# AWS Region (for Lambda deployment)
AWS_REGION="ap-south-1"
```

---

## AWS Deployment Steps

### 1. Build and Deploy Lambda Handlers via AWS SAM
```bash
# Navigate to infrastructure directory
cd infrastructure

# SAM automatically compiles all TypeScript handlers using esbuild (no manual backend build step required)
sam build

# Deploy to AWS (ap-south-1) using preconfigured samconfig.toml
sam deploy
```

### 2. Deploy Frontend to AWS Amplify
1. Connect your repository to AWS Amplify Console.
2. Build Settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add Environment Variable:
   - `VITE_USE_MOCK_API`: `false`
   - `VITE_API_BASE_URL`: `https://your-api-gateway-id.execute-api.ap-south-1.amazonaws.com/prod`
