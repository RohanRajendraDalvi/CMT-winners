// src/tests/seedSlipData.ts
import mongoose from "mongoose";
import SlipModel from "../models/slip.model";
import { getWeatherByCoords } from "../services/weather.services";
import dotenv from "dotenv";

dotenv.config();

interface SeedLocation {
  name: string;
  lat: number;
  lon: number;
  slipCount: number;
  hoursAgoRange: [number, number]; // [min, max] hours ago
  radiusKm: number; // spread slips within this radius
}

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

/** Generate random coordinate offset within radius */
function randomOffset(radiusKm: number): { latOffset: number; lonOffset: number } {
  // Approximate: 1 degree lat ≈ 111km, 1 degree lon ≈ 111km * cos(lat)
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusKm;
  
  const latOffset = (distance / 111) * Math.cos(angle);
  const lonOffset = (distance / 111) * Math.sin(angle);
  
  return { latOffset, lonOffset };
}

/** Generate random timestamp within range */
function randomTimestamp(hoursAgoMin: number, hoursAgoMax: number): Date {
  const now = Date.now();
  const minMs = now - hoursAgoMax * 60 * 60 * 1000;
  const maxMs = now - hoursAgoMin * 60 * 60 * 1000;
  const randomMs = minMs + Math.random() * (maxMs - minMs);
  return new Date(randomMs);
}

/** Seed slips for a location */
async function seedLocation(location: SeedLocation) {
  console.log(`\nSeeding ${location.name}...`);
  console.log(`  Target: ${location.slipCount} slips within ${location.radiusKm}km`);
  
  const slips = [];
  
  for (let i = 0; i < location.slipCount; i++) {
    const { latOffset, lonOffset } = randomOffset(location.radiusKm);
    const slipLat = location.lat + latOffset;
    const slipLon = location.lon + lonOffset;
    const timestamp = randomTimestamp(
      location.hoursAgoRange[0],
      location.hoursAgoRange[1]
    );
    
    try {
      // Get weather for this location and time
      const weather = await getWeatherByCoords(slipLat, slipLon);
      
      const weatherWithDates = {
        ...weather,
        dtDate: new Date(weather.dt * 1000),
        sunriseDate: new Date(weather.sys.sunrise * 1000),
        sunsetDate: new Date(weather.sys.sunset * 1000),
      };
      
      const slip = new SlipModel({
        vehicleId: `test_vehicle_${i}`,
        timestamp,
        geoPoint: {
          type: "Point",
          coordinates: [slipLon, slipLat], // [lon, lat]
        },
        weather: weatherWithDates,
      });
      
      await slip.save();
      slips.push(slip);
      
      // Show progress
      if ((i + 1) % 5 === 0 || i === location.slipCount - 1) {
        process.stdout.write(`\r  Progress: ${i + 1}/${location.slipCount} slips created`);
      }
    } catch (err) {
      console.error(`\n  ✗ Failed to create slip ${i + 1}:`, err);
    }
  }
  
  console.log(`\n  ✓ Created ${slips.length} slips for ${location.name}`);
  return slips;
}

/** Clear existing test data */
async function clearTestData() {
  console.log("Clearing existing test data...");
  const result = await SlipModel.deleteMany({
    userId: { $regex: /^test_user_/ }
  });
  console.log(`✓ Deleted ${result.deletedCount} existing test slips\n`);
}

/** Main seed function */
async function seedDatabase() {
  console.log("=== Seeding Slip Database ===\n");
  
  try {
    await connectDB();
    await clearTestData();
    
    // Define locations to seed
    const locations: SeedLocation[] = [
      {
        name: "NYC (High Density)",
        lat: 40.7128,
        lon: -74.0060,
        slipCount: 15, // Above threshold for high-density area
        hoursAgoRange: [1, 24],
        radiusKm: 5,
      },
      {
        name: "Denver (Medium Density)",
        lat: 39.7392,
        lon: -104.9903,
        slipCount: 6, // Around threshold for medium-density
        hoursAgoRange: [2, 48],
        radiusKm: 3,
      },
      {
        name: "Rural Montana (Low Density)",
        lat: 46.8797,
        lon: -110.3626,
        slipCount: 2, // Above threshold for rural area
        hoursAgoRange: [1, 12],
        radiusKm: 2,
      },
      {
        name: "Boston (High Density - Winter)",
        lat: 42.3601,
        lon: -71.0589,
        slipCount: 10,
        hoursAgoRange: [3, 72],
        radiusKm: 4,
      },
    ];
    
    // Seed each location
    for (const location of locations) {
      await seedLocation(location);
    }
    
    console.log("\n=== Seeding Complete ===");
    console.log(`Total locations seeded: ${locations.length}`);
    console.log(`Total slips created: ${locations.reduce((sum, loc) => sum + loc.slipCount, 0)}`);
    
  } catch (err) {
    console.error("✗ Seeding failed:", err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase, clearTestData };