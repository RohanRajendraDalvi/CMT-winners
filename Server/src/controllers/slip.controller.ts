// src/controllers/slip.controller.ts

import { Request, Response } from "express";
import { recordSlip } from "../services/slip.services";
import { getWeatherByCoords } from "../services/weather.services";

export default {
  reportSlip: async (req: Request, res: Response) => {
    try {
      const { vehicleId, lat, lon, timestamp } = req.body;

      if (!vehicleId || lat === undefined || lon === undefined || !timestamp) {
        return res.status(400).json({
          success: false,
          message: "vehicleId, lat, lon, and timestamp are required.",
        });
      }

      const parsedDate = new Date(timestamp);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid timestamp. Must be ISO date string.",
        });
      }

      // Fetch weather
      const weather = await getWeatherByCoords(Number(lat), Number(lon));

      const slip = await recordSlip(
        {
          vehicleId,
          timestamp: parsedDate,
          geoPoint: {
            type: "Point",
            coordinates: [Number(lon), Number(lat)], // GeoJSON order: [lon, lat]
          },
        },
        weather
      );

      return res.status(200).json({
        success: true,
        message: "Slip recorded successfully.",
        data: slip,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to record slip.",
      });
    }
  },
};
