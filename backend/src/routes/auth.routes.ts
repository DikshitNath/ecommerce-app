
import { Router } from "express";

import {
  register,
  login,
  getCurrentUser,
} from "../controllers/auth.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public authentication routes
router.post("/register", register);
router.post("/login", login);

// Protected route
router.get("/me", authenticate, getCurrentUser);

export default router;
