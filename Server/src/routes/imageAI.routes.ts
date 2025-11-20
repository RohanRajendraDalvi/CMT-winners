// src/routes/weather.route.ts
import express from "express";
import multer from "multer";
import { uploadWeatherImage } from "../controllers/imageAI.controller";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/weather/image", upload.single("image"), uploadWeatherImage);

export default router;
