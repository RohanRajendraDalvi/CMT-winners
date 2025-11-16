// src/types/slip.types.ts

import { Document } from "mongoose";
import { WeatherData } from "./weather.types";

export interface SlipEventInput {
  vehicleId: string;
  timestamp: Date;

  geoPoint: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
}

export interface SlipEvent extends Document {
  vehicleId: string;
  timestamp: Date;

  geoPoint: {
    type: "Point";
    coordinates: [number, number];
  };

  weather: WeatherData & {
    dtDate: Date;
    sunriseDate: Date;
    sunsetDate: Date;
  };
}
