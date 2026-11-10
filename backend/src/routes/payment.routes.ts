import { Router } from "express";
import { processOrderPayment } from "../controllers/payment.controller";

const router = Router();

router.post("/process", processOrderPayment);

export default router;
