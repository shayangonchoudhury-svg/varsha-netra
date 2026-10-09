/**
 * Varshaনেত্র — Live Weather Intelligence Test Suite
 * Validates Open-Meteo parsing, 6h/12h/24h accumulation sums,
 * peak intensity extraction, storm profile mapping, and fallback resilience.
 */

import { WeatherService, DEMO_WEATHER_FALLBACK } from '../src/services/weatherService';
import { WeatherForecast } from '../src/types/weather';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

function runWeatherTests() {
  console.log('=== Varshaনেত্র Live Weather Intelligence Test Suite ===');
  let passed = 0;
  const service = new WeatherService();

  // Mock Open-Meteo payload with known numbers
  const mockNow = new Date('2026-10-04T12:00:00Z');
  const mockHourlyTimes = Array.from({ length: 48 }, (_, i) => {
    const d = new Date(mockNow.getTime() + i * 3600 * 1000);
    return d.toISOString();
  });

  // 24 hours of known rain:
  // Hours 0..5: [2.0, 3.0, 5.0, 8.0, 12.0, 6.0] -> 6h sum = 36.0 mm, peak = 12.0 mm/h
  // Hours 6..11: [4.0, 2.0, 1.0, 1.0, 0.5, 0.5] -> 12h sum = 36.0 + 9.0 = 45.0 mm
  // Hours 12..23: 12 hours of 1.0 mm each -> 24h sum = 45.0 + 12.0 = 57.0 mm
  const mockHourlyPrecip = [
    2.0, 3.0, 5.0, 8.0, 12.0, 6.0,
    4.0, 2.0, 1.0, 1.0, 0.5, 0.5,
    1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
    ...Array(24).fill(0),
  ];

  const mockOpenMeteoJson = {
    current: {
      time: mockNow.toISOString(),
      temperature_2m: 29.5,
      precipitation: 4.5, // Current instantaneous rate
      rain: 4.0,
      showers: 0.5,
      weather_code: 63,
      wind_speed_10m: 22.0,
    },
    hourly: {
      time: mockHourlyTimes,
      precipitation: mockHourlyPrecip,
      rain: mockHourlyPrecip.map((p) => p * 0.9),
      showers: mockHourlyPrecip.map((p) => p * 0.1),
      precipitation_probability: Array(48).fill(75),
      wind_speed_10m: Array(48).fill(20),
      weather_code: Array(48).fill(63),
    },
  };

  // Test 1: Response Parsing
  try {
    const parsed = service.parseOpenMeteoResponse(
      mockOpenMeteoJson,
      'KIIT Campus · Bhubaneswar',
      20.3538,
      85.8175
    );
    assert(parsed.isLive === true, 'Parsed weather should be marked isLive = true');
    assert(parsed.current.temperatureC === 29.5, 'Current temperature must match');
    assert(parsed.current.currentPrecipitationMm === 4.5, 'Current instantaneous precip must match');
    assert(parsed.hourly.length === 24, 'Hourly forecast should extract next 24 hours');
    console.log('✓ PASS: Test 1: Open-Meteo payload successfully parsed into typed WeatherForecast');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 1:', e.message);
  }

  // Test 2: 6-hour rainfall accumulation calculation
  try {
    const parsed = service.parseOpenMeteoResponse(
      mockOpenMeteoJson,
      'KIIT Campus',
      20.3538,
      85.8175
    );
    assert(parsed.totalNext6hMm === 36.0, `Expected 6h accumulation to be 36.0mm, got ${parsed.totalNext6hMm}`);
    console.log('✓ PASS: Test 2: 6-hour rainfall accumulation correctly sums 6 hourly forecast values (36.0 mm)');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 2:', e.message);
  }

  // Test 3: 12-hour rainfall accumulation calculation
  try {
    const parsed = service.parseOpenMeteoResponse(
      mockOpenMeteoJson,
      'KIIT Campus',
      20.3538,
      85.8175
    );
    assert(parsed.totalNext12hMm === 45.0, `Expected 12h accumulation to be 45.0mm, got ${parsed.totalNext12hMm}`);
    console.log('✓ PASS: Test 3: 12-hour rainfall accumulation correctly sums 12 hourly forecast values (45.0 mm)');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 3:', e.message);
  }

  // Test 4: 24-hour rainfall accumulation calculation
  try {
    const parsed = service.parseOpenMeteoResponse(
      mockOpenMeteoJson,
      'KIIT Campus',
      20.3538,
      85.8175
    );
    assert(parsed.totalNext24hMm === 57.0, `Expected 24h accumulation to be 57.0mm, got ${parsed.totalNext24hMm}`);
    console.log('✓ PASS: Test 4: 24-hour rainfall accumulation correctly sums 24 hourly forecast values (57.0 mm)');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 4:', e.message);
  }

  // Test 5: Peak hourly rainfall and timestamp detection
  try {
    const parsed = service.parseOpenMeteoResponse(
      mockOpenMeteoJson,
      'KIIT Campus',
      20.3538,
      85.8175
    );
    assert(parsed.peakHourlyRainfallMm === 12.0, `Expected peak hourly rain to be 12.0mm/h, got ${parsed.peakHourlyRainfallMm}`);
    assert(parsed.peakHourlyTimestamp === mockHourlyTimes[4], 'Peak hourly timestamp should point to the 12.0mm peak index');
    console.log('✓ PASS: Test 5: Peak hourly rainfall correctly extracted (12.0 mm/h) with corresponding timestamp');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 5:', e.message);
  }

  // Test 6: Weather -> Storm Profile for 6h Window
  try {
    const parsed = service.parseOpenMeteoResponse(
      mockOpenMeteoJson,
      'KIIT Campus',
      20.3538,
      85.8175
    );
    const profile6 = service.weatherToStormProfile(parsed, 6);
    assert(profile6.rainfallMm === 36.0, `Profile 6h rainfall must equal 36.0, got ${profile6.rainfallMm}`);
    assert(profile6.durationHours === 6, 'Profile duration must equal 6');
    assert(profile6.peakIntensityMmHr === 12.0, 'Profile peak intensity must equal 12.0');
    console.log('✓ PASS: Test 6: Weather-to-Storm conversion correctly translates 6h window into storm profile');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 6:', e.message);
  }

  // Test 7: Weather -> Storm Profile for 12h Window
  try {
    const parsed = service.parseOpenMeteoResponse(
      mockOpenMeteoJson,
      'KIIT Campus',
      20.3538,
      85.8175
    );
    const profile12 = service.weatherToStormProfile(parsed, 12);
    assert(profile12.rainfallMm === 45.0, `Profile 12h rainfall must equal 45.0, got ${profile12.rainfallMm}`);
    assert(profile12.durationHours === 12, 'Profile duration must equal 12');
    console.log('✓ PASS: Test 7: Weather-to-Storm conversion correctly translates 12h window into storm profile');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 7:', e.message);
  }

  // Test 8: Critical Event Depth vs Current Rain Separation
  try {
    const parsed = service.parseOpenMeteoResponse(
      mockOpenMeteoJson,
      'KIIT Campus',
      20.3538,
      85.8175
    );
    const profile = service.weatherToStormProfile(parsed, 12);
    // Instantaneous rate is 4.5 mm/h, but 12h event depth is 45.0 mm.
    assert(
      profile.rainfallMm !== parsed.current.currentPrecipitationMm,
      'Critical: Storm event rainfall must NOT be confused with instantaneous current precipitation!'
    );
    assert(
      profile.rainfallMm === 45.0,
      'Storm event rainfall must strictly reflect accumulated forecast depth'
    );
    console.log('✓ PASS: Test 8: Verified instantaneous current rain is strictly decoupled from event rainfall depth');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 8:', e.message);
  }

  // Test 9: Deterministic Demo Fallback Structure
  try {
    const fallback = DEMO_WEATHER_FALLBACK;
    assert(fallback.isLive === false, 'Fallback must have isLive: false');
    assert(fallback.totalNext12hMm > 0, 'Fallback must provide non-zero 12h accumulation');
    assert(fallback.hourly.length === 24, 'Fallback must provide 24 hours');
    assert(fallback.source.includes('Demo'), 'Fallback source must be clearly identified as Demo');
    console.log('✓ PASS: Test 9: Demo weather fallback is deterministically structured and clearly marked isLive: false');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 9:', e.message);
  }

  // Test 10: Malformed Open-Meteo payload error safety
  try {
    let threw = false;
    try {
      service.parseOpenMeteoResponse({}, 'KIIT', 0, 0);
    } catch {
      threw = true;
    }
    assert(threw, 'Malformed empty payload should throw parsing error to trigger safe fallback');
    console.log('✓ PASS: Test 10: Malformed payloads safely caught to route to offline demo fallback');
    passed++;
  } catch (e: any) {
    console.error('✗ FAIL: Test 10:', e.message);
  }

  console.log(`\nFinal Weather Test Results: ${passed}/10 Passed (0 Failed)`);
  if (passed !== 10) {
    process.exit(1);
  }
}

runWeatherTests();
