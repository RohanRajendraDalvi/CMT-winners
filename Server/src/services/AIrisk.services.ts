// src/services/AIrisk.service.ts
import { findNearbySlips } from "./slip.services";
import { getWeatherByCoords } from "./weather.services";
import { getPopulationByCoords } from "./population.services";
import { analyzeWeatherImage } from "./imageAI.services";
import { 
  mapSlipsToRiskInputs, 
  extractWeatherFactors,
  halfLifeWeight,
  calculateRequiredSlips
} from "./risk.services";

/**
 * Physics-based temperature friction coefficient
 * Based on ice formation and friction research:
 * - Ice forms at 0°C or below
 * - Most slippery at -7°C (minimum friction)
 * - Less slippery below -10°C (sandlike)
 * - Warmer than 0°C: reduced risk but still dangerous with moisture
 */
export function temperatureFrictionCoefficient(tempC: number): number {
  // Above 4°C: minimal ice risk
  if (tempC > 4) return 0.1;
  
  // 0°C to 4°C: transition zone, ice can form with moisture
  if (tempC > 0) {
    // Linear increase from 0.1 at 4°C to 0.5 at 0°C
    return 0.1 + (4 - tempC) * 0.1;
  }
  
  // -7°C: peak slipperiness (maximum risk)
  if (tempC >= -7) {
    // Parabolic curve peaking at -7°C
    // Risk increases from 0.5 at 0°C to 1.0 at -7°C
    const normalized = (0 - tempC) / 7; // 0 to 1 as temp drops from 0 to -7
    return 0.5 + 0.5 * Math.pow(normalized, 0.8);
  }
  
  // Below -7°C: decreasing slipperiness (sandlike ice)
  if (tempC >= -30) {
    // Exponential decay from 1.0 at -7°C to 0.4 at -30°C
    const normalized = (-7 - tempC) / 23; // 0 to 1 as temp drops from -7 to -30
    return 1.0 - 0.6 * Math.pow(normalized, 1.2);
  }
  
  // Extremely cold: minimal slipperiness
  return 0.4;
}

/**
 * Moisture and precipitation risk factor
 * Considers both precipitation type and surface moisture
 */
export function moistureRiskFactor(
  tempC: number, 
  precip: string,
  aiMoistureIndicator: number // from AI vision (1-10)
): number {
  let precipScore = 0;
  
  // Precipitation type scoring
  if (precip === "snow") {
    // Fresh snow at near-freezing is most dangerous
    precipScore = tempC > -5 ? 0.9 : 0.7;
  } else if (precip === "sleet" || precip === "freezing_rain") {
    // Freezing rain is extremely dangerous
    precipScore = 1.0;
  } else if (precip === "rain") {
    // Rain is dangerous when temp is near or below freezing
    if (tempC <= 2) precipScore = 0.85;
    else if (tempC <= 5) precipScore = 0.5;
    else precipScore = 0.3;
  } else if (precip === "drizzle") {
    // Light moisture can create black ice
    if (tempC <= 1) precipScore = 0.7;
    else if (tempC <= 4) precipScore = 0.4;
    else precipScore = 0.2;
  }
  
  // AI vision moisture score (normalized 0-1)
  const visionMoisture = aiMoistureIndicator / 10;
  
  // Combine with emphasis on actual precipitation
  // If precipitation is detected, trust it more than vision
  // If no precipitation, rely more on vision
  if (precipScore > 0.5) {
    return Math.max(precipScore, visionMoisture * 0.7);
  } else {
    return Math.max(precipScore * 0.5, visionMoisture * 0.8);
  }
}

/**
 * Multi-dimensional gradient function for combining risk factors
 * Uses sigmoid and exponential functions for smooth transitions
 */
export function multiDimensionalRiskGradient(
  historicalWeight: number,    // 0-1: from slip history
  tempCoefficient: number,      // 0-1: from temperature
  moistureRisk: number,         // 0-1: from moisture/precip
  aiVisionScore: number,        // 0-1: from AI road analysis
  populationDensityFactor: number // 0-1: urban vs rural adjustment
): {
  environmentalRisk: number;
  historicalRisk: number;
  combinedRisk: number;
  confidence: number;
} {
  // 1. Environmental Risk (temperature + moisture + AI vision)
  // Use weighted geometric mean for multiplicative effects
  const tempWeight = 0.4;
  const moistureWeight = 0.3;
  const visionWeight = 0.3;
  
  const environmentalRisk = Math.pow(
    Math.pow(tempCoefficient, tempWeight) *
    Math.pow(moistureRisk, moistureWeight) *
    Math.pow(aiVisionScore, visionWeight),
    1.0 // Normalize
  );
  
  // 2. Historical Risk (slip history)
  // Sigmoid transformation for smooth scaling
  const historicalRisk = 1 / (1 + Math.exp(-8 * (historicalWeight - 0.5)));
  
  // 3. Combined Risk - Non-linear integration
  // Use maximum as base (pessimistic but safe)
  const maxRisk = Math.max(environmentalRisk, historicalRisk);
  
  // Add contribution from the lower value with diminishing returns
  const minRisk = Math.min(environmentalRisk, historicalRisk);
  const additiveBonus = minRisk * 0.4 * (1 - maxRisk); // More bonus when maxRisk is lower
  
  // Population density adjustment (urban areas = more caution)
  const densityMultiplier = 0.8 + 0.2 * populationDensityFactor;
  
  let combinedRisk = (maxRisk + additiveBonus) * densityMultiplier;
  
  // Ensure bounds
  combinedRisk = Math.max(0, Math.min(1, combinedRisk));
  
  // 4. Confidence score based on data availability
  // Higher when environmental and historical agree
  const agreement = 1 - Math.abs(environmentalRisk - historicalRisk);
  const confidence = 0.6 + 0.4 * agreement;
  
  return {
    environmentalRisk,
    historicalRisk,
    combinedRisk,
    confidence
  };
}

/**
 * Main AI-powered risk assessment service
 */
export async function calculateAIRiskAssessment(
  vehicleId: string,
  lat: number,
  lon: number,
  timestamp: string,
  imagePath: string
) {
  const now = new Date(timestamp);
  
  // 1. Gather all data sources
  const [slips, weather, population, aiVisionScore] = await Promise.all([
    findNearbySlips(lat, lon, now),
    getWeatherByCoords(lat, lon),
    getPopulationByCoords(lat, lon),
    analyzeWeatherImage(imagePath)
  ]);
  
  const populationPerKm2 = population.population_per_km2;
  const { tempC, precip } = extractWeatherFactors(weather);
  
  // 2. Calculate population normalizer
  const requiredSlips = calculateRequiredSlips(populationPerKm2);
  const populationNormalizerFor100Percent = requiredSlips;
  
  // 3. Process historical slip data
  const historyInputs = mapSlipsToRiskInputs(slips, lat, lon, now);
  const rawHistoryScore = historyInputs.reduce(
    (acc, s) => acc + halfLifeWeight(s.distanceKm, s.hoursAgo), 
    0
  );
  
  // Normalize historical weight by population-adjusted threshold
  const historicalWeight = Math.min(1, rawHistoryScore / requiredSlips);
  
  // 4. Calculate physics-based environmental factors
  const tempCoefficient = temperatureFrictionCoefficient(tempC);
  const moistureRisk = moistureRiskFactor(tempC, precip, aiVisionScore);
  const aiVisionNormalized = aiVisionScore / 10;
  
  // 5. Population density factor (0-1 scale)
  // Log scale: 100/km² = 0.33, 1000/km² = 0.55, 10000/km² = 0.77
  const populationDensityFactor = Math.min(1, Math.log10(populationPerKm2) / 5);
  
  // 6. Multi-dimensional gradient calculation
  const riskAnalysis = multiDimensionalRiskGradient(
    historicalWeight,
    tempCoefficient,
    moistureRisk,
    aiVisionNormalized,
    populationDensityFactor
  );
  
  // 7. Weather + AI coefficient (for compatibility)
  const weatherAICoefficient = (tempCoefficient + moistureRisk + aiVisionNormalized) / 3;
  
  // 8. Final cumulative slip score (0-100 scale)
  const cumulativeSlipScore = Math.round(riskAnalysis.combinedRisk * 100);
  
  return {
    vehicleId,
    location: { lat, lon },
    timestamp: now.toISOString(),
    
    // Data sources
    slipsData: {
      nearbySlipsCount: slips.length,
      slips: slips.map(s => ({
        id: s._id,
        vehicleId: s.vehicleId,
        timestamp: s.timestamp,
        geoPoint: s.geoPoint,
        weather: s.weather
      }))
    },
    
    currentWeather: {
      temperature_C: tempC,
      precipitation: precip || "none",
      description: weather.weather?.[0]?.description || "unknown"
    },
    
    populationData: {
      population_per_km2: populationPerKm2,
      densityFactor: populationDensityFactor,
      normalizerFor100Percent: Math.round(populationNormalizerFor100Percent * 10) / 10
    },
    
    // AI and environmental analysis
    aiRoadSlipAssessment: {
      visionScore: aiVisionScore,
      normalized: aiVisionNormalized
    },
    
    riskFactors: {
      temperatureFrictionCoeff: Math.round(tempCoefficient * 1000) / 1000,
      moistureRiskFactor: Math.round(moistureRisk * 1000) / 1000,
      historicalWeight: Math.round(historicalWeight * 1000) / 1000,
      weatherAICoefficient: Math.round(weatherAICoefficient * 1000) / 1000
    },
    
    // Risk scores
    rawHistoryScore: Math.round(rawHistoryScore * 100) / 100,
    
    gradientAnalysis: {
      environmentalRisk: Math.round(riskAnalysis.environmentalRisk * 1000) / 1000,
      historicalRisk: Math.round(riskAnalysis.historicalRisk * 1000) / 1000,
      combinedRisk: Math.round(riskAnalysis.combinedRisk * 1000) / 1000,
      confidence: Math.round(riskAnalysis.confidence * 1000) / 1000
    },
    
    // Final output
    cumulativeSlipScore, // 0-100
    riskLevel: cumulativeSlipScore < 20 ? "LOW" : 
               cumulativeSlipScore < 40 ? "MODERATE" :
               cumulativeSlipScore < 60 ? "ELEVATED" :
               cumulativeSlipScore < 80 ? "HIGH" : "CRITICAL"
  };
}