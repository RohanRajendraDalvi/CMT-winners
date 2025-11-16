import { Router } from "express";
import { getSlipRisk } from "../controllers/risk.controller";

const router = Router();

router.get("/", getSlipRisk);

export default router;
