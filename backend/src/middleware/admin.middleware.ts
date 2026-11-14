
import { RequestHandler } from "express";
import User from "../models/user.model";

export const requireAdmin: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    const user = await User.findById(userId).select("role");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User account not found.",
      });
      return;
    }

    // Existing accounts without a role are customers.
    if (user.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
