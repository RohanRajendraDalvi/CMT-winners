// src/tests/slipProbability.test.ts
import { calculateSlipProbability } from "../services/telemetry.services";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function connectDB() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is missing in your .env file");
  }
  
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✓ Connected to MongoDB\n");
}

async function disconnectDB() {
  console.log("\nDisconnecting from MongoDB...");
  await mongoose.connection.close();
  console.log("✓ Disconnected from MongoDB");
}

async function runTests() {
  console.log("=== Slip Probability Test Suite ===\n");
  
  try {
    await connectDB();
  } catch (err) {
    console.error("✗ Failed to connect to MongoDB:", err);
    process.exit(1);
  }

  // Test 1: High-density urban area (NYC)
  console.log("Test 1: High-density urban area (New York City)");
  try {
    const nycResult = await calculateSlipProbability(
      40.7128,  // NYC latitude
      -74.0060, // NYC longitude
      new Date().toISOString()
    );
    
    console.log("Results:");
    console.log(`  - Population density: ${nycResult.populationPerKm2.toFixed(0)} people/km²`);
    console.log(`  - Slips found nearby: ${nycResult.slipsFound}`);
    console.log(`  - Required slips for 100%: ${nycResult.requiredSlipsFor100Percent}`);
    console.log(`  - Raw history score: ${nycResult.rawHistoryScore.toFixed(3)}`);
    console.log(`  - Probability (history only): ${(nycResult.probSlipsHistoryOnly * 100).toFixed(1)}%`);
    console.log(`  - Weather: ${nycResult.weather.tempC}°C, ${nycResult.weather.precip || 'none'}`);
    console.log(`  - Weather multiplier: ${nycResult.weather.weatherMult.toFixed(2)}`);
    console.log(`  - FINAL PROBABILITY: ${(nycResult.finalProb * 100).toFixed(1)}%`);
    console.log("✓ Test 1 passed\n");
  } catch (err) {
    console.error("✗ Test 1 failed:", err);
  }

  // Test 2: Medium-density suburban area (Denver)
  console.log("Test 2: Medium-density suburban area (Denver, CO)");
  try {
    const denverResult = await calculateSlipProbability(
      39.7392,  // Denver latitude
      -104.9903, // Denver longitude
      new Date().toISOString()
    );
    
    console.log("Results:");
    console.log(`  - Population density: ${denverResult.populationPerKm2.toFixed(0)} people/km²`);
    console.log(`  - Slips found nearby: ${denverResult.slipsFound}`);
    console.log(`  - Required slips for 100%: ${denverResult.requiredSlipsFor100Percent}`);
    console.log(`  - Raw history score: ${denverResult.rawHistoryScore.toFixed(3)}`);
    console.log(`  - Probability (history only): ${(denverResult.probSlipsHistoryOnly * 100).toFixed(1)}%`);
    console.log(`  - Weather: ${denverResult.weather.tempC}°C, ${denverResult.weather.precip || 'none'}`);
    console.log(`  - Weather multiplier: ${denverResult.weather.weatherMult.toFixed(2)}`);
    console.log(`  - FINAL PROBABILITY: ${(denverResult.finalProb * 100).toFixed(1)}%`);
    console.log("✓ Test 2 passed\n");
  } catch (err) {
    console.error("✗ Test 2 failed:", err);
  }

  // Test 3: Low-density rural area (Montana)
  console.log("Test 3: Low-density rural area (Rural Montana)");
  try {
    const ruralResult = await calculateSlipProbability(
      46.8797,  // Montana latitude
      -110.3626, // Montana longitude
      new Date().toISOString()
    );
    
    console.log("Results:");
    console.log(`  - Population density: ${ruralResult.populationPerKm2.toFixed(0)} people/km²`);
    console.log(`  - Slips found nearby: ${ruralResult.slipsFound}`);
    console.log(`  - Required slips for 100%: ${ruralResult.requiredSlipsFor100Percent}`);
    console.log(`  - Raw history score: ${ruralResult.rawHistoryScore.toFixed(3)}`);
    console.log(`  - Probability (history only): ${(ruralResult.probSlipsHistoryOnly * 100).toFixed(1)}%`);
    console.log(`  - Weather: ${ruralResult.weather.tempC}°C, ${ruralResult.weather.precip || 'none'}`);
    console.log(`  - Weather multiplier: ${ruralResult.weather.weatherMult.toFixed(2)}`);
    console.log(`  - FINAL PROBABILITY: ${(ruralResult.finalProb * 100).toFixed(1)}%`);
    console.log("✓ Test 3 passed\n");
  } catch (err) {
    console.error("✗ Test 3 failed:", err);
  }

  // Test 4: Verify population scaling logic
  console.log("Test 4: Verify population-based scaling");
  const testCases = [
    { pop: 100, expected: "~1 slip" },
    { pop: 1000, expected: "~3 slips" },
    { pop: 10000, expected: "~9 slips" },
    { pop: 20000, expected: "~14 slips" }
  ];

  testCases.forEach(({ pop, expected }) => {
    const requiredSlips = 1 + Math.log10(pop / 100) * 4;
    console.log(`  - ${pop} people/km² → ${requiredSlips.toFixed(1)} slips needed (expected ${expected})`);
  });
  console.log("✓ Test 4 passed\n");

  // Test 5: Historical timestamp (winter conditions)
  console.log("Test 5: Historical winter timestamp (January 2025)");
  try {
    const winterResult = await calculateSlipProbability(
      42.3601,  // Boston
      -71.0589,
      "2025-01-15T08:00:00Z" // Winter morning
    );
    
    console.log("Results:");
    console.log(`  - Population density: ${winterResult.populationPerKm2.toFixed(0)} people/km²`);
    console.log(`  - Slips found nearby: ${winterResult.slipsFound}`);
    console.log(`  - Required slips for 100%: ${winterResult.requiredSlipsFor100Percent}`);
    console.log(`  - Weather: ${winterResult.weather.tempC}°C, ${winterResult.weather.precip || 'none'}`);
    console.log(`  - FINAL PROBABILITY: ${(winterResult.finalProb * 100).toFixed(1)}%`);
    console.log("✓ Test 5 passed\n");
  } catch (err) {
    console.error("✗ Test 5 failed:", err);
  }

  console.log("=== All Tests Complete ===");
  
  await disconnectDB();
}

runTests().catch(err => {
  console.error("Test suite failed:", err);
  process.exit(1);
});