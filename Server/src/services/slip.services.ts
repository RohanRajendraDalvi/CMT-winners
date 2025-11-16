// src/services/slip.services.ts

import { SlipEvent, SlipEventInput } from "../types/slip.types";
import { WeatherData } from "../types/weather.types";
import SlipModel from "../models/slip.model";

/**
 * Record a slip event in MongoDB.
 */
export async function recordSlip(
  event: SlipEventInput,
  weather: WeatherData
): Promise<SlipEvent> {
  const weatherWithDates = {
    ...weather,
    dtDate: new Date(weather.dt * 1000),
    sunriseDate: new Date(weather.sys.sunrise * 1000),
    sunsetDate: new Date(weather.sys.sunset * 1000),
  };

  const slip = new SlipModel({
    ...event,
    weather: weatherWithDates,
  });

  await slip.save();
  return slip;
}

/**
 * Delete a slip event by ID.
 */
export async function deleteSlip(id: string): Promise<boolean> {
  const result = await SlipModel.findByIdAndDelete(id);
  return result !== null;
}
