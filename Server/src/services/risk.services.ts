import { getDistance } from "geolib";
import { WeatherData } from "../types/weather.types.js";
// src/services/risk.service.ts
export function halfLifeWeight(distanceKm: number, hoursAgo: number) {
  const d = Math.min(distanceKm, 100);
  const t = Math.min(hoursAgo, 96);
  const exponent = d / 25 + t / 36;
  return Math.pow(0.5, exponent); // 0.5^(d/25 + t/36)
}

const W_REF = Math.pow(0.5, 1/25 + 1/36); // slip at d=1km, t=1hr
const NORMALIZER = 3 * W_REF; // sum that maps to 1.0

export function computeSlipProbabilityFromHistory(
  slips: Array<{ distanceKm: number; hoursAgo: number }>
) {
  const raw = slips.reduce((acc, s) => acc + halfLifeWeight(s.distanceKm, s.hoursAgo), 0);
  const probSlips = Math.min(1, raw / NORMALIZER);
  return { raw, probSlips };
}

/** weather model: returns M_weather in [0,1] */
export function weatherMultiplier(tempC: number, precip?: string) {
  let tempFactor = 0;
  if (tempC <= 0) tempFactor = 1;
  else if (tempC > 0 && tempC <= 5) tempFactor = 1 - tempC / 5;
  else tempFactor = 0;

  let precipFactor = 0;
  const p = (precip || "").toLowerCase();
  if (["snow", "sleet", "freezing_rain"].includes(p)) precipFactor = 1;
  else if (["rain", "drizzle"].includes(p) && tempC <= 2) precipFactor = 0.8;
  else precipFactor = 0;

  return Math.max(tempFactor, precipFactor);
}

/** final prob combining history + weather */
export function finalSlipProbability(probSlips: number, weatherMult: number) {
  const scale = 0.6 + 0.4 * weatherMult; // tune these constants as needed
  return Math.min(1, probSlips * scale);
}



export function mapSlipsToRiskInputs(
  slips: any[],
  currentLat: number,
  currentLon: number,
  now: Date
) {
  return slips.map(slip => {
    const slipLat = slip.geoPoint.coordinates[1];
    const slipLon = slip.geoPoint.coordinates[0];

    const distanceMeters = getDistance(
      { latitude: currentLat, longitude: currentLon },
      { latitude: slipLat, longitude: slipLon }
    );

    const distanceKm = distanceMeters / 1000;

    const hoursAgo =
      (now.getTime() - new Date(slip.timestamp).getTime()) / (1000 * 60 * 60);

    return { distanceKm, hoursAgo };
  });
}


export function extractWeatherFactors(weather: WeatherData) {
  const tempC = weather.main.temp;
  const precipType = weather.weather?.[0]?.main?.toLowerCase() || "";

  // Normalize types
  let precip = "";
  if (precipType.includes("snow")) precip = "snow";
  else if (precipType.includes("sleet")) precip = "sleet";
  else if (precipType.includes("freezing")) precip = "freezing_rain";
  else if (precipType.includes("rain")) precip = "rain";
  else if (precipType.includes("drizzle")) precip = "drizzle";

  return { tempC, precip };
}


