# Varshaনেত্র | VarshaNetra

### Rain-to-Reserve Intelligence System

> **See the rain. Shape the outcome.**

VarshaNetra is a full-stack environmental intelligence system designed to transform localized rainfall into actionable flood-risk insights and rainwater-harvesting strategies for the KIIT campus.

Instead of treating rainfall as just a weather measurement, VarshaNetra explores what happens when rain meets the campus: how much runoff may be generated, which zones could experience drainage stress, how much water could potentially be captured, and what interventions could reduce excess runoff.

By combining **deterministic hydrological modelling, interactive campus visualization, scenario simulation, and AWS serverless infrastructure**, VarshaNetra connects rainfall data with practical environmental decision-making.

## Live Demo

**Website:** https://main.d1g4s9nly1yiuu.amplifyapp.com/

**Backend API:** https://c0mx5vup91.execute-api.ap-south-1.amazonaws.com/prod

**GitHub:** https://github.com/shayangonchoudhury-svg/varsha-netra

---

## The Problem

Rainfall can create two challenges for campuses: excess surface runoff that increases localized flooding risk, and rainwater that could otherwise be captured for non-potable uses.

Yet rainfall measurements alone do not answer the questions that matter for planning:

- How much runoff might a rainfall event generate?
- Which campus zones may experience higher hydrological stress?
- How much rainwater could potentially be captured?
- How might additional storage or capture capacity change the outcome?
- Which areas should receive attention first?
- How can rainfall scenarios support better campus water planning?

VarshaNetra approaches these questions through a simulation-driven environmental decision system.

**The goal is not simply to observe rainfall — it is to understand its possible consequences and explore better responses.**

---

## How VarshaNetra Works

```text
          Rainfall Conditions
                  ↓
       Campus Zone Parameters
                  ↓
       Deterministic Hydrology
                  ↓
      Runoff & Storage Modelling
                  ↓
       Zone-Level Risk Analysis
                  ↓
       Capture Potential Analysis
                  ↓
       Intervention Simulation
                  ↓
        Actionable Insights
       ┌──────────┴──────────┐
       ↓                     ↓
 Flood-Risk Mitigation   Water Conservation
```

The hydrology engine performs the quantitative calculations. The interface presents the resulting estimates, while the explanation layer can help communicate their meaning when available.

This separation keeps numerical modelling distinct from narrative interpretation.

---

## The Core Intelligence

### Deterministic Hydrology Engine

At the heart of VarshaNetra is a dedicated TypeScript hydrology engine designed around explicit calculations rather than relying on an AI model to invent numerical results.

The engine combines rainfall inputs with configured campus-zone parameters to estimate runoff, evaluate storage constraints, and explore rainwater-capture scenarios.

Its design uses pure TypeScript functions, making the calculations testable and suitable for execution in the frontend or migration behind a serverless API.

### Hydrological Modelling

The engine incorporates concepts including:

- **Rational Method** — estimating peak runoff using rainfall intensity, drainage area, and runoff characteristics.
- **Volumetric mass balance** — reasoning about rainfall-derived water volumes and their potential distribution.
- **Storage saturation limits** — accounting for finite capture capacity.
- **Drainage stress ratios** — evaluating stress relative to configured drainage assumptions.
- **Capture and intervention scenarios** — examining how modified water-capture capacity may influence modelled outcomes.

These calculations provide a consistent foundation for comparing scenarios. Their accuracy depends on the quality of the inputs, assumptions, and calibration data.

---

## Explore the Website

### 1. Overview — Environmental Intelligence at a Glance

The main dashboard introduces the current scenario and brings the major environmental indicators into one place.

It provides a starting point for understanding rainfall conditions, potential runoff, capture opportunities, and campus-level risk insights.

### 2. Digital Twin — A Spatial View of the Campus

The Digital Twin presents a zone-based view of the KIIT campus, connecting configured hydrological parameters with a visual campus representation.

It helps users explore how different campus zones may respond differently to the same rainfall scenario.

The current implementation uses a **demonstration digital twin**, not a verified, sensor-connected digital replica of the physical campus.

### 3. Storm Simulator — Explore Different Rainfall Scenarios

The Storm Simulator allows users to investigate hypothetical rainfall conditions and observe how the modelled hydrological outcome changes.

By adjusting scenario inputs, users can explore the relationship between rainfall, runoff, storage, and capture capacity without waiting for an actual storm.

This makes the application useful for demonstrations, comparative analysis, and early-stage planning experiments.

### 4. Action Plan — From Modelling to Possible Intervention

The Action Plan translates scenario results into potential areas of attention.

It connects the modelled risk picture with possible mitigation and capture interventions, helping users explore where improvements might be worth investigating.

These are simulation-informed planning suggestions, not certified engineering recommendations.

### 5. Impact & Reserves — Understand the Potential Benefits

This page focuses on the water-conservation side of the problem.

It presents modelled capture potential and scenario-based indicators to help communicate how rainwater harvesting and increased storage could contribute to non-potable water reserves while potentially reducing excess runoff.

### 6. Equations — Transparency Behind the Results

Environmental decisions should not depend on unexplained numbers.

The Equations page exposes the mathematical concepts behind the hydrological estimates, helping users connect the displayed results to the model's underlying assumptions and calculations.

This emphasis on transparency is central to VarshaNetra: **the numbers should be explainable, testable, and open to scrutiny.**

---

## AWS Architecture

VarshaNetra combines a responsive web application with a serverless backend and a dedicated quantitative modelling layer.

```text
                 ┌──────────────────────────┐
                 │     React 19 + Vite      │
                 │    TypeScript Frontend   │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │     AWS Amplify          │
                 │    Frontend Hosting      │
                 └──────────────────────────┘

                              │ HTTPS
                              ▼
                 ┌──────────────────────────┐
                 │    Amazon API Gateway    │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │       AWS Lambda         │
                 │    Serverless Backend    │
                 └────────────┬─────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
          ┌──────────────────┐  ┌──────────────────┐
          │ Amazon DynamoDB  │  │ Amazon Bedrock   │
          │ Application Data │  │ Explanation Layer│
          └──────────────────┘  └──────────────────┘

                  Independent Quantitative Layer
                 ┌──────────────────────────┐
                 │ Deterministic Hydrology  │
                 │       TypeScript         │
                 └──────────────────────────┘
```

### AWS Services and Their Roles

**AWS Amplify Hosting**

Hosts the production web application and provides the public-facing interface.

**Amazon API Gateway**

Provides the HTTPS entry point for the serverless backend.

**AWS Lambda**

Runs backend functionality without requiring a continuously running application server.

**Amazon DynamoDB**

Provides a managed data-storage component for the application architecture.

**Amazon Bedrock**

Designed as an explanation layer for communicating hydrological insights. Its successful live generation is not claimed as verified in the current demonstration.

**Open-Meteo**

Provides weather data used by the application. Weather data availability should not be confused with on-campus rain-gauge measurements.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Visual interface | Responsive UI, interactive environmental visualization |
| Hydrological engine | TypeScript, deterministic calculations |
| Mapping | Leaflet, React-Leaflet |
| Weather data | Open-Meteo |
| API | Amazon API Gateway |
| Compute | AWS Lambda |
| Data storage | Amazon DynamoDB |
| Hosting | AWS Amplify |
| Explanation layer | Amazon Bedrock integration |

---

## What Makes VarshaNetra Different?

### Rainfall Becomes a Scenario, Not Just a Number

The application connects rainfall inputs to potential runoff, storage constraints, and capture opportunities.

### One System, Two Environmental Outcomes

VarshaNetra explores both sides of rainfall management: mitigating excess runoff and retaining water for potential reuse.

### Deterministic Calculations, Not AI-Generated Numbers

The quantitative engine is designed to calculate its outputs explicitly. AI-assisted explanations are conceptually separate from the core hydrological calculations.

### Interactive Environmental Exploration

The Digital Twin and Storm Simulator make it possible to explore hypothetical conditions and compare interventions through a visual interface.

### Transparency by Design

The Equations page helps connect model outputs with their mathematical foundations and assumptions.

### Built as a Full-Stack AWS Project

VarshaNetra brings together frontend engineering, hydrological modelling, external weather data, serverless APIs, and cloud-hosted application infrastructure.

---

## Demonstration Scope & Scientific Responsibility

VarshaNetra currently uses a **KIIT Campus Demonstration Digital Twin** with configured zone parameters.

The results should be interpreted as modelled estimates, not measured campus-wide environmental conditions.

Important limitations include:

- Zone parameters are demonstration inputs, not independently verified on-site measurements.
- The digital twin is not presented as a fully surveyed or sensor-connected campus model.
- Rainfall data from a weather provider may not represent rainfall at every location on campus.
- Runoff and capture estimates depend on model assumptions and configured parameters.
- Real-world flood prediction requires calibration, validation, and reliable local observations.
- Planning suggestions require review by qualified professionals before real-world implementation.

These limitations define the next stage of development: improving the underlying data and validation rather than treating simulated results as ground truth.

---

## Testing & Engineering Quality

The deterministic hydrology engine and application were tested during development.

**Latest recorded test result: 38/38 tests passed.**

The production frontend build also completed successfully during the recorded validation.

These results support the tested implementation, but they do not independently validate the model against real campus rainfall, drainage measurements, or observed flood events.

---

## Future Scope

VarshaNetra can evolve from a demonstration system into a more data-grounded campus water intelligence platform.

Potential directions include:

- Integration of on-campus rain gauges and weather stations.
- Surveyed campus boundaries, elevation data, and drainage-network mapping.
- Calibration against observed runoff and historical waterlogging events.
- More detailed zone-level water-balance modelling.
- Rainwater-harvesting capacity planning for non-potable demand.
- Forecast-driven scenario analysis.
- Sensor-informed storage and drainage monitoring.
- Validation of intervention recommendations with environmental and civil-engineering experts.

The long-term vision is to connect rainfall observation, hydrological modelling, and practical water management in one transparent system.

---

## Individual Project

VarshaNetra was designed, developed, tested, and prepared for demonstration as an **individual project**.

The project brings together:

- Environmental problem identification
- Product concept and interface design
- Frontend and full-stack development
- Deterministic hydrological modelling
- Interactive campus-zone visualization
- Rainfall scenario simulation
- AWS serverless architecture
- Weather-data integration
- Testing, validation, and demonstration preparation

---

## Project Links

- **Live Application:** https://main.d1g4s9nly1yiuu.amplifyapp.com/
- **GitHub Repository:** https://github.com/shayangonchoudhury-svg/varsha-netra
- **Backend API:** https://c0mx5vup91.execute-api.ap-south-1.amazonaws.com/prod

---

## Closing Vision

Rain should not be understood only as a threat to manage or a resource to collect.

It can be both — and better decisions begin by understanding how water moves through the environment.

**VarshaNetra aims to turn rainfall into insight, insight into intervention, and intervention into a more resilient, water-conscious campus.**

*See the rain. Shape the outcome.*
