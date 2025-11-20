// src/controllers/weather.controller.ts
import { Request, Response } from "express";
import sharp from "sharp";
import fs from "fs";
import { analyzeWeatherImage } from "../services/imageAI.services";

export async function uploadWeatherImage(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const resizedPath = `uploads/resized_${Date.now()}.jpg`;

    // Enforce server-side standard size
    await sharp(req.file.path)
      .resize(512, 512, { fit: "cover" })
      .jpeg({ quality: 90 })
      .toFile(resizedPath);

    // Remove original file to save space
    fs.unlinkSync(req.file.path);

    const slipScore = await analyzeWeatherImage(resizedPath);

    res.json({ slipScore });
  } catch (err) {
    console.error("Error processing image:", err);
    res.status(500).json({ error: "Could not analyze image" });
  }
}
