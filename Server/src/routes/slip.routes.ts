import { Router } from "express";
import slipController from "../controllers/slip.controller";

const router = Router();

router.post("/report", slipController.reportSlip);

export default router;
