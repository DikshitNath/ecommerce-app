
import { Router } from "express";

import {
  createOrder,
  getOrders,
  getOrderById,
} from "../controllers/order.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All order endpoints require authentication.
router.use(authenticate);

router.post("/", createOrder);

router.get("/", getOrders);

router.get("/:id", getOrderById);

export default router;
