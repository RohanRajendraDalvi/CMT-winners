import { WeatherData } from "./weather.types";

export interface SlipEventInput {
  vehicleId: string;
  lat: number;
  lon: number;
  timestamp: Date;
}

export interface SlipEvent extends Document {
  vehicleId: string;
  lat: number;
  lon: number;
  timestamp: Date;
  weather: WeatherData & {
    dtDate: Date;
    sunriseDate: Date;
    sunsetDate: Date;
  };
}