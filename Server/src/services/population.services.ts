// src/services/population.services.ts

import axios from "axios";

export interface PopulationData {
  lat: number;
  lon: number;
  population_per_km2: number;
}

// WorldPop 1km population density ImageServer
export async function getPopulationByCoords(
  lat: number,
  lon: number
): Promise<PopulationData> {
  // ArcGIS identify request requires a geometry + extent
  const params = {
    f: "json",
    geometry: `${lon},${lat}`, // x,y = lon,lat
    geometryType: "esriGeometryPoint",
    sr: 4326,
    returnGeometry: false,
    tolerance: 1,
    mapExtent: "-180,-90,180,90",
    imageDisplay: "1024,768,96",
  };
  const WORLDPOP_URL = process.env.WORLDPOP_URL;
  if (!WORLDPOP_URL) {
    throw new Error("WORLDPOP_URL is missing in your .env file");
  }
  const response = await axios.get(WORLDPOP_URL, { params });

  const value =
    response.data?.value !== undefined ? Number(response.data.value) : 0;

  return {
    lat,
    lon,
    population_per_km2: value,
  };
}
