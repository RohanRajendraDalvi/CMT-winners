import { Request, Response } from "express";
import { calculateSlipProbability } from "../services/telemetry.services";

export async function getSlipRisk(req: Request, res: Response) {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const timestampStr = (req.query.timestamp as string) || new Date().toISOString();

    // Validate
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        message: "lat and lon must be valid numbers",
      });
    }

    const timestamp = new Date(timestampStr);
    if (isNaN(timestamp.getTime())) {
      return res.status(400).json({
        success: false,
        message: "timestamp must be a valid ISO date",
      });
    }

    // Core calculation
    const result = await calculateSlipProbability(lat, lon, timestampStr);

    return res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error("Slip Risk Error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Failed to compute slip probability",
      error: err.message,
    });
  }
}
