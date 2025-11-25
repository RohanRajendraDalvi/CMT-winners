// src/controllers/airisk.controller.ts
import { Request, Response } from "express";
import sharp from "sharp";
import fs from "fs";
import { calculateAIRiskAssessment } from "../services/AIrisk.services";

/**
 * POST /api/airisk/assess
 * 
 * Comprehensive AI-powered slip risk assessment
 * 
 * Body (multipart/form-data):
 * - vehicleId: string
 * - lat: number
 * - lon: number
 * - timestamp: ISO date string (optional, defaults to now)
 * - image: file upload
 */
export async function assessAIRisk(req: Request, res: Response) {
  try {
    // Validate required fields
    const { vehicleId, lat, lon } = req.body;
    const timestamp = req.body.timestamp || new Date().toISOString();

    if (!vehicleId) {
      return res.status(400).json({
        success: false,
        error: "vehicleId is required"
      });
    }

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: "lat and lon are required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "image is required"
      });
    }

    // Parse coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: "lat and lon must be valid numbers"
      });
    }

    // Validate timestamp
    const timestampDate = new Date(timestamp);
    if (isNaN(timestampDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: "timestamp must be a valid ISO date"
      });
    }

    // Process image - standardize to 512x512 into temp file
    const processedPath = `${req.file.path.replace(/\\/g, '/')}_processed.jpg`;

    await sharp(req.file.path)
      .resize(512, 512, { 
        fit: "cover",
        position: "center" 
      })
      .jpeg({ quality: 85 })
      .toFile(processedPath);

    // Clean up original upload ASAP
    try { fs.unlinkSync(req.file.path); } catch {}

    console.log(`[AI Risk] Processing for vehicle ${vehicleId} at (${latitude}, ${longitude})`);

    // Perform comprehensive risk assessment
    const riskAssessment = await calculateAIRiskAssessment(
      vehicleId,
      latitude,
      longitude,
      timestamp,
      processedPath
    );

    // Clean up processed image before responding
    try { fs.unlinkSync(processedPath); } catch {}

    return res.json({
      success: true,
      ...riskAssessment
    });

  } catch (err: any) {
    console.error("[AI Risk] Assessment error:", err);

    return res.status(500).json({
      success: false,
      error: "Failed to perform AI risk assessment",
      message: err.message
    });
  }
}

/**
 * GET /api/airisk/test
 * 
 * Test endpoint to verify service is running
 */
export async function testAIRisk(req: Request, res: Response) {
  return res.json({
    success: true,
    message: "AI Risk Assessment Service is operational",
    timestamp: new Date().toISOString()
  });
}