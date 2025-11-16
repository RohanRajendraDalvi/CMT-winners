// src/models/slip.model.ts

import mongoose, { Schema } from "mongoose";
import { SlipEvent } from "../types/slip.types";



// Weather schema
const weatherSchema = new Schema({
  coord: {
    lat: Number,
    lon: Number,
  },
  weather: [
    {
      id: Number,
      main: String,
      description: String,
      icon: String,
    },
  ],
  main: {
    temp: Number,
    feels_like: Number,
    temp_min: Number,
    temp_max: Number,
    pressure: Number,
    humidity: Number,
  },
  visibility: Number,
  wind: {
    speed: Number,
    deg: Number,
    gust: Number,
  },
  clouds: {
    all: Number,
  },
  sys: {
    country: String,
    sunrise: Number,
    sunset: Number,
  },
  timezone: Number,
  name: String,

  // Converted date fields
  dt: Number,
  dtDate: Date,
  sunriseDate: Date,
  sunsetDate: Date,
});

// Slip schema
const slipSchema = new Schema<SlipEvent>({
  vehicleId: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  timestamp: { type: Date, required: true },

  weather: { type: weatherSchema, required: true },
});

const SlipModel = mongoose.model<SlipEvent>("SlipEvent", slipSchema);
export default SlipModel;
