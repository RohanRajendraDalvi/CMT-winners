// src/models/slip.model.ts
import mongoose, { Schema } from "mongoose";
import { SlipEvent } from "../types/slip.types";

// Weather schema (unchanged)
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

  dt: Number,
  dtDate: Date,
  sunriseDate: Date,
  sunsetDate: Date,
});

// Slip schema
const slipSchema = new Schema<SlipEvent>({
  vehicleId: { type: String, required: true },
  timestamp: { type: Date, required: true },

  // GEO JSON POINT
  geoPoint: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true }, // [lon, lat]
  },

  weather: { type: weatherSchema, required: true },
});

// ⭐⭐ IMPORTANT — Create 2dsphere index
slipSchema.index({ geoPoint: "2dsphere" });

const SlipModel = mongoose.model<SlipEvent>("SlipEvent", slipSchema);
export default SlipModel;
