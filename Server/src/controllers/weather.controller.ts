import { Request, Response } from "express";
import { getWeatherByCoords } from "../services/weather.services";

export default {
  async getWeather(req: Request, res: Response) {
    try {
      const { lat, lon } = req.query;

      // Validate coordinates
      if (!lat || !lon) {
        return res.status(400).json({
          success: false,
          message: "Latitude (lat) and longitude (lon) are required.",
        });
      }

      const latitude = Number(lat);
      const longitude = Number(lon);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({
          success: false,
          message: "lat and lon must be valid numbers.",
        });
      }

      const weather = await getWeatherByCoords(latitude, longitude);

      return res.status(200).json({
        success: true,
        data: weather,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to fetch weather data.",
      });
    }
  },
};
