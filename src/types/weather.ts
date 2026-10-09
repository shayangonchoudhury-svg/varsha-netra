/**
 * Live Weather Data Types for Varshaনেত্র.
 * Provides strongly typed representations for Open-Meteo observations and forecast windows.
 */

export interface WeatherSnapshot {
  location: string;
  latitude: number;
  longitude: number;
  fetchedAt: string;
  temperatureC: number;
  currentPrecipitationMm: number;
  currentRainMm: number;
  currentShowersMm: number;
  windSpeedKmh: number;
  weatherCode: number;
  source: string;
  isLive: boolean;
}

export interface HourlyWeather {
  timestamp: string;
  precipitationMm: number;
  rainMm: number;
  showersMm: number;
  precipitationProbability: number;
  windSpeedKmh: number;
  weatherCode: number;
}

export interface WeatherForecast {
  current: WeatherSnapshot;
  hourly: HourlyWeather[];
  totalNext6hMm: number;
  totalNext12hMm: number;
  totalNext24hMm: number;
  peakHourlyRainfallMm: number;
  peakHourlyTimestamp: string;
  maxPrecipitationProbability: number;
  source: string;
  fetchedAt: string;
  isLive: boolean;
  error?: string;
}

export type ForecastWindowHours = 6 | 12 | 24;

export interface WeatherDerivedStormProfile {
  rainfallMm: number;
  durationHours: number;
  peakIntensityMmHr: number;
  stormProfile: 'monsoon_steady' | 'tropical_downpour' | 'cloudburst' | 'cyclonic_surge';
  label: string;
  isLive: boolean;
  windowHours: ForecastWindowHours;
}
