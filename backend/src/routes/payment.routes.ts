
import { Router } from "express";
import { processOrderPayment } from "../controllers/payment.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All payment operations require authentication.
router.use(authenticate);

router.post("/process", processOrderPayment);

export default router;
