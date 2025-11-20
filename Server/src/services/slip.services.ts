import SlipModel from "../models/slip.model";
import { SlipEvent, SlipEventInput } from "../types/slip.types";
import { WeatherData } from "../types/weather.types";

/** Record a slip event */
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

/** Delete slip */
export async function deleteSlip(id: string): Promise<boolean> {
  const result = await SlipModel.findByIdAndDelete(id);
  return result !== null;
}

/** Find nearby slips in the past 96hrs within 100km */
export async function findNearbySlips(
  lat: number,
  lon: number,
  timestamp: Date
) {
  const ninetySixHoursAgo = new Date(timestamp.getTime() - 96 * 60 * 60 * 1000);

  return SlipModel.find({
    timestamp: { $gte: ninetySixHoursAgo, $lte: timestamp },

    geoPoint: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lon, lat], // must be [lon, lat]
        },
        $maxDistance: 100_000, // 100 km in meters
      },
    },
  });
}
