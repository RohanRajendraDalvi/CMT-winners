import { Router } from "express";
import slipController from "../controllers/slip.controller";
import slipmapController from "../controllers/slipmap.controller";

const router = Router();

router.post("/report", slipController.reportSlip);
router.get("/map", slipmapController.getNearbySlips);

export default router;
