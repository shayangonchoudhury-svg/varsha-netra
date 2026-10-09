import {
  WeatherForecast,
  WeatherSnapshot,
  HourlyWeather,
  ForecastWindowHours,
  WeatherDerivedStormProfile,
} from '../types/weather';
import { StormProfileType } from '../../shared/hydrology/types';

// KIIT Campus Anchor Coordinates (Bhubaneswar, Odisha)
export const KIIT_WEATHER_COORDINATES = {
  latitude: 20.3538,
  longitude: 85.8175,
  locationName: 'KIIT Campus · Bhubaneswar, Odisha',
};

// Deterministic Demo Weather Fallback (Clearly labeled fallback)
export const DEMO_WEATHER_FALLBACK: WeatherForecast = {
  current: {
    location: KIIT_WEATHER_COORDINATES.locationName,
    latitude: KIIT_WEATHER_COORDINATES.latitude,
    longitude: KIIT_WEATHER_COORDINATES.longitude,
    fetchedAt: new Date().toISOString(),
    temperatureC: 28.4,
    currentPrecipitationMm: 3.2,
    currentRainMm: 2.8,
    currentShowersMm: 0.4,
    windSpeedKmh: 18.5,
    weatherCode: 63, // Moderate Rain
    source: 'Demo Weather Profile',
    isLive: false,
  },
  hourly: Array.from({ length: 24 }, (_, i) => {
    const d = new Date();
    d.setHours(d.getHours() + i);
    // Profile with realistic monsoon accumulation curve
    const rainCurve = [1.2, 2.5, 4.8, 7.2, 14.5, 12.0, 9.5, 6.2, 4.0, 3.1, 2.0, 1.5, 1.0, 0.8, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0];
    const precip = rainCurve[i] ?? 0.5;
    return {
      timestamp: d.toISOString(),
      precipitationMm: precip,
      rainMm: precip * 0.9,
      showersMm: precip * 0.1,
      precipitationProbability: Math.min(95, 40 + i * 2),
      windSpeedKmh: 16 + (i % 5),
      weatherCode: precip > 5 ? 65 : precip > 1 ? 63 : 61,
    };
  }),
  totalNext6hMm: 42.2,
  totalNext12hMm: 66.5,
  totalNext24hMm: 72.0,
  peakHourlyRainfallMm: 14.5,
  peakHourlyTimestamp: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
  maxPrecipitationProbability: 88,
  source: 'Demo Weather Profile',
  fetchedAt: new Date().toISOString(),
  isLive: false,
};

export class WeatherService {
  private cache: WeatherForecast | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_TTL_MS = 120_000; // 2 minutes cache

  /**
   * Fetches real-time weather and 24-hour hourly forecast from Open-Meteo API.
   * Gracefully returns marked fallback data on timeout, network error, or invalid payload.
   */
  public async getLiveWeather(forceRefresh = false, timeoutMs = 6000): Promise<WeatherForecast> {
    const now = Date.now();
    if (!forceRefresh && this.cache && now - this.lastFetchTime < this.CACHE_TTL_MS) {
      return this.cache;
    }

    const { latitude, longitude, locationName } = KIIT_WEATHER_COORDINATES;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,rain,showers,weather_code,wind_speed_10m&hourly=precipitation,rain,showers,precipitation_probability,wind_speed_10m,weather_code&forecast_days=2&timezone=auto`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const parsed = this.parseOpenMeteoResponse(data, locationName, latitude, longitude);
      this.cache = parsed;
      this.lastFetchTime = Date.now();
      return parsed;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const errorMessage = err instanceof Error ? err.message : 'Unknown weather fetch error';
      console.warn('[WeatherService] Live weather fetch failed, using demo fallback:', errorMessage);

      // Return demo fallback with explicit error note and isLive: false
      const fallback: WeatherForecast = {
        ...DEMO_WEATHER_FALLBACK,
        fetchedAt: new Date().toISOString(),
        error: errorMessage,
        isLive: false,
        source: 'Demo Weather Profile (Offline Fallback)',
      };
      return fallback;
    }
  }

  /**
   * Parses raw Open-Meteo JSON into structured WeatherForecast model.
   */
  public parseOpenMeteoResponse(
    data: any,
    locationName: string,
    latitude: number,
    longitude: number
  ): WeatherForecast {
    if (!data || !data.current || !data.hourly || !Array.isArray(data.hourly.time)) {
      throw new Error('Malformed Open-Meteo response structure');
    }

    const fetchedAt = new Date().toISOString();
    const currentRaw = data.current;
    const hourlyRaw = data.hourly;

    const current: WeatherSnapshot = {
      location: locationName,
      latitude,
      longitude,
      fetchedAt,
      temperatureC: Number(currentRaw.temperature_2m ?? 28),
      currentPrecipitationMm: Number(currentRaw.precipitation ?? 0),
      currentRainMm: Number(currentRaw.rain ?? 0),
      currentShowersMm: Number(currentRaw.showers ?? 0),
      windSpeedKmh: Number(currentRaw.wind_speed_10m ?? 0),
      weatherCode: Number(currentRaw.weather_code ?? 0),
      source: 'Open-Meteo',
      isLive: true,
    };

    // Find the hourly index closest to the current time
    const currentTimeStr = currentRaw.time;
    let startIndex = hourlyRaw.time.findIndex((t: string) => t >= currentTimeStr);
    if (startIndex === -1) startIndex = 0;

    // Extract the next 24 hourly periods
    const hourly: HourlyWeather[] = [];
    const maxHours = Math.min(24, hourlyRaw.time.length - startIndex);

    for (let i = 0; i < maxHours; i++) {
      const idx = startIndex + i;
      hourly.push({
        timestamp: hourlyRaw.time[idx],
        precipitationMm: Number(hourlyRaw.precipitation?.[idx] ?? 0),
        rainMm: Number(hourlyRaw.rain?.[idx] ?? 0),
        showersMm: Number(hourlyRaw.showers?.[idx] ?? 0),
        precipitationProbability: Number(hourlyRaw.precipitation_probability?.[idx] ?? 0),
        windSpeedKmh: Number(hourlyRaw.wind_speed_10m?.[idx] ?? 0),
        weatherCode: Number(hourlyRaw.weather_code?.[idx] ?? 0),
      });
    }

    // Accumulation calculations (sum of hourly forecast, NOT current rate)
    const next6h = hourly.slice(0, 6);
    const next12h = hourly.slice(0, 12);
    const next24h = hourly.slice(0, 24);

    const totalNext6hMm = Number(next6h.reduce((acc, h) => acc + h.precipitationMm, 0).toFixed(1));
    const totalNext12hMm = Number(next12h.reduce((acc, h) => acc + h.precipitationMm, 0).toFixed(1));
    const totalNext24hMm = Number(next24h.reduce((acc, h) => acc + h.precipitationMm, 0).toFixed(1));

    // Peak hourly precipitation & time
    let peakHourlyRainfallMm = 0;
    let peakHourlyTimestamp = hourly[0]?.timestamp || fetchedAt;

    for (const h of next24h) {
      if (h.precipitationMm > peakHourlyRainfallMm) {
        peakHourlyRainfallMm = h.precipitationMm;
        peakHourlyTimestamp = h.timestamp;
      }
    }
    peakHourlyRainfallMm = Number(peakHourlyRainfallMm.toFixed(1));

    const maxPrecipitationProbability = Math.max(
      0,
      ...next24h.map((h) => h.precipitationProbability)
    );

    return {
      current,
      hourly,
      totalNext6hMm,
      totalNext12hMm,
      totalNext24hMm,
      peakHourlyRainfallMm,
      peakHourlyTimestamp,
      maxPrecipitationProbability,
      source: 'Open-Meteo',
      fetchedAt,
      isLive: true,
    };
  }

  /**
   * Converts a WeatherForecast and selected forecast window into a standardized storm profile
   * for the deterministic hydrology engine.
   *
   * CRITICAL RULE:
   * Event rainfall depth is the forecast accumulation across the selected window (6h, 12h, or 24h),
   * NOT the instantaneous current precipitation.
   */
  public weatherToStormProfile(
    forecast: WeatherForecast,
    windowHours: ForecastWindowHours = 12
  ): WeatherDerivedStormProfile {
    let rainfallMm = forecast.totalNext12hMm;
    let windowHourly = forecast.hourly.slice(0, 12);

    if (windowHours === 6) {
      rainfallMm = forecast.totalNext6hMm;
      windowHourly = forecast.hourly.slice(0, 6);
    } else if (windowHours === 24) {
      rainfallMm = forecast.totalNext24hMm;
      windowHourly = forecast.hourly.slice(0, 24);
    }

    // Window-specific peak intensity
    let peakIntensityMmHr = 0;
    for (const h of windowHourly) {
      if (h.precipitationMm > peakIntensityMmHr) {
        peakIntensityMmHr = h.precipitationMm;
      }
    }

    // Default minimum physical values if forecast has 0mm (to allow simulation)
    const effectiveRainMm = Math.max(0, rainfallMm);
    const effectivePeak = Math.max(effectiveRainMm > 0 ? 1 : 0, peakIntensityMmHr);

    // Classify storm profile based on intensity dynamics
    let stormProfile: StormProfileType = 'monsoon_steady';
    if (effectivePeak >= 45) {
      stormProfile = 'cloudburst';
    } else if (effectivePeak >= 20 || (effectiveRainMm >= 80 && windowHours <= 12)) {
      stormProfile = 'tropical_downpour';
    } else if (effectiveRainMm >= 120 && windowHours === 24) {
      stormProfile = 'cyclonic_surge';
    } else {
      stormProfile = 'monsoon_steady';
    }

    const label = forecast.isLive
      ? `Live Weather (${effectiveRainMm}mm · ${windowHours}h Window)`
      : `Demo Weather (${effectiveRainMm}mm · ${windowHours}h Window)`;

    return {
      rainfallMm: effectiveRainMm,
      durationHours: windowHours,
      peakIntensityMmHr: Number(effectivePeak.toFixed(1)),
      stormProfile,
      label,
      isLive: forecast.isLive,
      windowHours,
    };
  }
}

export const weatherService = new WeatherService();
