import { Router } from "express";
import { assessAIRisk } from "../controllers/AIrisk.controller";
const router = Router();
router.post("/assess", assessAIRisk);
export default router;
