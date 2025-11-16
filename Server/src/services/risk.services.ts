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
