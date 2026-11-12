
import { Request, Response } from "express";
import mongoose from "mongoose";

import Order from "../models/order.model";

import {
  createPendingOrder,
  OrderServiceError,
} from "../services/order.service";

// POST /api/orders
export async function createOrder(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const order = await createPendingOrder(
      req.user.userId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Order created successfully. Payment is pending.",
      data: order,
    });
  } catch (error) {
    if (error instanceof OrderServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create order.",
    });
  }
}

// GET /api/orders
export async function getOrders(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const page = Math.max(
      1,
      Number.parseInt(req.query.page as string, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(
        1,
        Number.parseInt(req.query.limit as string, 10) || 10
      )
    );

    const skip = (page - 1) * limit;

    // Only retrieve orders belonging to the logged-in user.
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const filter = { userId };

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Orders retrieved successfully.",
      data: orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        limit,
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve orders.",
    });
  }
}

// GET /api/orders/:id
export async function getOrderById(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const id = req.params.id;

    if (
      typeof id !== "string" ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(req.user.userId),
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order retrieved successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve order.",
    });
  }
}
