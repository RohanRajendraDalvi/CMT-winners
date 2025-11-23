import { findNearbySlips } from "./slip.services";
import { getWeatherByCoords } from "./weather.services";
import { getPopulationByCoords } from "./population.services";
import { 
  computeSlipProbabilityFromHistory, 
  weatherMultiplier, 
  finalSlipProbability, 
  mapSlipsToRiskInputs, 
  extractWeatherFactors 
} from "./risk.services";

export async function calculateSlipProbability(
  lat: number, 
  lon: number, 
  timestamp: string
) {
  const now = new Date(timestamp);

  // 1. Get population density for the location
  const populationData = await getPopulationByCoords(lat, lon);
  const populationPerKm2 = populationData.population_per_km2;

  // 2. History-based probability (now population-adjusted)
  const slips = await findNearbySlips(lat, lon, now);
  const historyInputs = mapSlipsToRiskInputs(slips, lat, lon, now);
  const { raw, probSlips, requiredSlips, normalizer } = computeSlipProbabilityFromHistory(
    historyInputs,
    populationPerKm2
  );

  // 3. Current weather
  const weather = await getWeatherByCoords(lat, lon);
  const { tempC, precip } = extractWeatherFactors(weather);
  const weatherMult = weatherMultiplier(tempC, precip);

  // 4. Final probability
  const finalProb = finalSlipProbability(probSlips, weatherMult);

  return {
    slipsFound: slips.length,
    populationPerKm2,
    requiredSlipsFor100Percent: Math.round(requiredSlips * 10) / 10, // rounded to 1 decimal
    rawHistoryScore: raw,
    normalizer,
    probSlipsHistoryOnly: probSlips,
    weather: { tempC, precip, weatherMult },
    finalProb
  };
}