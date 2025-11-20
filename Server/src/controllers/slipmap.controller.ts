import { Request, Response } from "express";
import { findNearbySlips } from "../services/slip.services";

export default {
  getNearbySlips: async (req: Request, res: Response) => {
    try {
      const { lat, lon, timestamp } = req.query;

      if (!lat || !lon || !timestamp) {
        return res.status(400).json({
          success: false,
          message: "lat, lon, and timestamp are required",
        });
      }

      const slips = await findNearbySlips(
        Number(lat),
        Number(lon),
        new Date(timestamp as string)
      );

      return res.status(200).json({
        success: true,
        count: slips.length,
        data: slips,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
};
