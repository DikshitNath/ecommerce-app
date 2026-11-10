
import { Request, Response } from "express";
import {
  processPayment,
  PaymentServiceError,
} from "../services/payment.service";

export async function processOrderPayment(
  req: Request,
  res: Response
) {
  try {
    const { orderId, outcome } = req.body;

    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Order ID is required.",
      });
    }

    if (!["SUCCESS", "FAILED"].includes(outcome)) {
      return res.status(400).json({
        success: false,
        message: "Outcome must be SUCCESS or FAILED.",
      });
    }

    const order = await processPayment(orderId, outcome);

    return res.status(200).json({
      success: true,
      message:
        outcome === "SUCCESS"
          ? "Payment successful. Order confirmed."
          : "Payment failed. Order remains pending.",
      data: order,
    });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Payment processing error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process payment.",
    });
  }
}
