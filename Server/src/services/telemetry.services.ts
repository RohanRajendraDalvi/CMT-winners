import { findNearbySlips } from "./slip.services";
import { getWeatherByCoords } from "./weather.services";
import { computeSlipProbabilityFromHistory , weatherMultiplier, finalSlipProbability, mapSlipsToRiskInputs, extractWeatherFactors} from "./risk.services"

export async function calculateSlipProbability(lat: number, lon: number, timestamp: string) {
  const now = new Date(timestamp);

  // 1. history
  const slips = await findNearbySlips(lat, lon, now);
  const historyInputs = mapSlipsToRiskInputs(slips, lat, lon, now);
  const { raw, probSlips } = computeSlipProbabilityFromHistory(historyInputs);

  // 2. current weather
  const weather = await getWeatherByCoords(lat, lon);
  const { tempC, precip } = extractWeatherFactors(weather);
  const weatherMult = weatherMultiplier(tempC, precip);

  // 3. final probability
  const finalProb = finalSlipProbability(probSlips, weatherMult);

  return {
    slipsFound: slips.length,
    rawHistoryScore: raw,
    probSlipsHistoryOnly: probSlips,
    weather: { tempC, precip, weatherMult },
    finalProb
  };
}
