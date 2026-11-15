
import { Router } from "express";

import {
  createOrder,
  getOrders,
  getOrderById,
  getAdminOrders,
  getAdminOrderById,
} from "../controllers/order.controller";

import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";

const router = Router();

// All order endpoints require authentication.
router.use(authenticate);

// Admin-only order endpoints (must be defined before /:id)
router.get("/admin", requireAdmin, getAdminOrders);
router.get("/admin/:id", requireAdmin, getAdminOrderById);

router.post("/", createOrder);

router.get("/", getOrders);

router.get("/:id", getOrderById);

export default router;
