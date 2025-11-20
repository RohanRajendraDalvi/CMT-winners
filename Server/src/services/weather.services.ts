// src/services/weather.services.ts

import axios from "axios";
import { WeatherData } from "../types/weather.types";

export async function getWeatherByCoords(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const API_KEY = process.env.WEATHER_API_KEY;

  if (!API_KEY) {
    throw new Error("WEATHER_API_KEY is missing in your .env file");
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

  const response = await axios.get(url);
  return response.data as WeatherData;
}
