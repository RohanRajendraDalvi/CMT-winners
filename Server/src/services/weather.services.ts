import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export interface WeatherData {
  temp: number;
  humidity: number;
  description: string;
}

export async function getWeatherByCoords(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const API_KEY = process.env.WEATHER_API_KEY;
  if (!API_KEY) {
    throw new Error("Missing WEATHER_API_KEY in environment variables.");
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

  const response = await axios.get(url);
  const data = response.data;

  return {
    temp: data.main.temp,
    humidity: data.main.humidity,
    description: data.weather[0].description,
  };
}
