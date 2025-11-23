import { getPopulationByCoords } from "../services/population.services";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  try {
    const lat = 40.7128;
    const lon = -74.0060;

    const result = await getPopulationByCoords(lat, lon);
    console.log("Population result:", result);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

runTest();
