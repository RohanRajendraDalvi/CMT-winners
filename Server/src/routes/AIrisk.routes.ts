import { Router } from "express";
import { assessAIRisk } from "../controllers/AIrisk.controller";
import multer from "multer";
import os from "os";

const router = Router();

// Configure multer to store uploads in ./uploads and ensure directory exists
const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		// Use OS temp directory on platforms like Render (ephemeral)
		cb(null, os.tmpdir());
	},
	filename: (_req, file, cb) => {
		// Preserve extension when available
		const original = file.originalname || "upload.jpg";
		const ext = original.includes(".") ? original.substring(original.lastIndexOf(".")) : ".jpg";
		cb(null, `airisk_${Date.now()}${ext}`);
	},
});

const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Expect field name 'image' from the client
router.post("/assess", upload.single("image"), assessAIRisk);

export default router;
