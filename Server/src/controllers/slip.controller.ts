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
          message:
            "vehicleId, lat, lon, and timestamp (ISO date) are required.",
        });
      }

      const parsedDate = new Date(timestamp);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid timestamp format. Use ISO 8601 date string.",
        });
      }

      // Fetch weather
      const weather = await getWeatherByCoords(Number(lat), Number(lon));

      // Save slip + weather
      const slipEvent = await recordSlip(
        {
          vehicleId: String(vehicleId),
          lat: Number(lat),
          lon: Number(lon),
          timestamp: parsedDate,
        },
        weather
      );

      return res.status(200).json({
        success: true,
        message: "Slip recorded successfully.",
        data: slipEvent,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to process slip report.",
      });
    }
  },
};
