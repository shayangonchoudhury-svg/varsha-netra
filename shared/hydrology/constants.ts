/**
 * Transparent Physical and Mathematical Constants for Varshaনেত্র.
 * No magic numbers; all weights and thresholds are strictly documented.
 */

// Risk Scoring Weights (sum to 1.0)
export const RISK_WEIGHTS = {
  DRAINAGE_STRESS: 0.35,       // Peak runoff rate divided by drainage throughput
  EXCESS_VOLUME_RATIO: 0.30,   // Unmanaged excess water divided by total runoff
  ELEVATION_VULNERABILITY: 0.15, // Low elevation basins subject to hydraulic backpressure
  INFRASTRUCTURE_SENSITIVITY: 0.12, // Co-located critical electrical and transit infrastructure
  STORAGE_SATURATION: 0.08,    // Fraction of local tank/pond storage filled
};

// Risk Level Classification Thresholds
export const RISK_THRESHOLDS = {
  HIGH_RISK_SCORE: 65,         // Score >= 65 -> HIGH
  MEDIUM_RISK_SCORE: 35,       // Score >= 35 and < 65 -> MEDIUM
  LOW_RISK_SCORE: 0,           // Score < 35 -> LOW

  // Critical override limits
  CRITICAL_STRESS_RATIO: 1.40, // Immediate HIGH if peak rate > 140% of drainage cap with >80m³ excess
  CRITICAL_EXCESS_M3: 90,
};

// Surface Substrate Runoff Coefficients (Rational Method C)
export const SURFACE_RUNOFF_COEFFICIENTS = {
  ROOFTOP_CONCRETE: 0.90,
  IMPERVIOUS_ASPHALT: 0.92,
  PERMEABLE_TURF: 0.25,
  BIO_RETENTION_SWALE: 0.18,
};

// Baseline institutional campus consumption assumption
export const INSTITUTIONAL_WATER_ASSUMPTIONS = {
  CAMPUS_DAILY_NON_POTABLE_DEMAND_LITERS: 120_000, // Toilet flush, cooling tower makeup, gardens
  MUNICIPAL_WATER_TARIFF_INR_PER_M3: 65,           // ₹65 per 1,000 Liters (₹65/m³)
  AQUIFER_PERCOLATION_FACTOR: 0.38,                // 38% of swale-infiltrated water reaches shallow aquifer
};

// Storm Intensity Scaling Profiles
export const STORM_PROFILE_CONFIG = {
  monsoon_steady: {
    name: 'Monsoon Steady',
    peakMultiplier: 1.25,
    description: 'Steady monsoon scenario with sustained uniform precipitation over 12-24 hours.',
  },
  tropical_downpour: {
    name: 'Tropical Downpour',
    peakMultiplier: 2.10,
    description: 'High intensity convective storm with rapid accumulation spikes.',
  },
  cloudburst: {
    name: 'Cloudburst Flash Storm',
    peakMultiplier: 3.40,
    description: 'Extremely intense localized downpour overwhelming standard gravity drainage.',
  },
  cyclonic_surge: {
    name: 'Cyclonic Surge (Super Cyclone Class)',
    peakMultiplier: 2.60,
    description: 'Multi-band cyclonic storm with sustained gale winds and severe continuous flooding.',
  },
};

export const DEMO_PROVENANCE_METADATA = {
  datasetName: 'KIIT Campus Demonstration Digital Twin',
  location: 'Bhubaneswar, Odisha',
  coordinates: '20.354° N, 85.818° E',
  dataClassification: 'DEMONSTRATION_PARAMETER_SET',
  disclaimer: 'Demonstration digital twin parameterization for hackathon verification. Not claimed as measured institutional telemetry without on-site sensor validation.',
};
