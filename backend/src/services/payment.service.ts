
import mongoose from "mongoose";
import Order, { IOrder } from "../models/order.model";
import Product from "../models/product.model";

export type PaymentOutcome = "SUCCESS" | "FAILED";

export class PaymentServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "PaymentServiceError";
  }
}

export async function processPayment(
  orderId: string,
  userId: string,
  outcome: PaymentOutcome
): Promise<IOrder> {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new PaymentServiceError("Invalid order ID.");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new PaymentServiceError("Invalid user ID.", 401);
  }

  if (!["SUCCESS", "FAILED"].includes(outcome)) {
    throw new PaymentServiceError("Invalid payment outcome.");
  }

  const session = await mongoose.startSession();

  let processedOrder: IOrder | null = null;

  try {
    await session.withTransaction(async () => {
      // Find the order belonging to the authenticated user only.
      const order = await Order.findOne({
        _id: orderId,
        userId,
      }).session(session);

      if (!order) {
        throw new PaymentServiceError("Order not found.", 404);
      }

      // Prevent duplicate payment processing.
      if (
        order.paymentStatus === "SUCCESS" &&
        order.orderStatus === "CONFIRMED"
      ) {
        processedOrder = order;
        return;
      }

      if (order.orderStatus !== "PENDING") {
        throw new PaymentServiceError(
          "This order cannot be processed."
        );
      }

      // Simulate a failed payment.
      if (outcome === "FAILED") {
        const failedOrder = await Order.findOneAndUpdate(
          {
            _id: orderId,
            userId,
            orderStatus: "PENDING",
            paymentStatus: { $ne: "SUCCESS" },
          },
          {
            $set: {
              paymentStatus: "FAILED",
            },
          },
          {
            new: true,
            session,
          }
        );

        if (!failedOrder) {
          throw new PaymentServiceError(
            "Unable to update payment status."
          );
        }

        processedOrder = failedOrder;
        return;
      }

      // Group quantities by product ID.
      // This handles multiple variants of the same product.
      const requestedQuantities = new Map<string, number>();

      for (const item of order.items) {
        const productId = item.productId.toString();

        const currentQuantity =
          requestedQuantities.get(productId) ?? 0;

        requestedQuantities.set(
          productId,
          currentQuantity + item.quantity
        );
      }

      // Atomically deduct stock inside the transaction.
      for (const [productId, quantity] of requestedQuantities) {
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: productId,
            isActive: true,
            stock: { $gte: quantity },
          },
          {
            $inc: {
              stock: -quantity,
            },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedProduct) {
          throw new PaymentServiceError(
            "Insufficient stock. One or more products are unavailable."
          );
        }
      }

      // Confirm the order only after inventory is deducted.
      const confirmedOrder = await Order.findOneAndUpdate(
        {
          _id: orderId,
          userId,
          orderStatus: "PENDING",
          paymentStatus: { $ne: "SUCCESS" },
        },
        {
          $set: {
            paymentStatus: "SUCCESS",
            orderStatus: "CONFIRMED",
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!confirmedOrder) {
        throw new PaymentServiceError(
          "Unable to confirm the order."
        );
      }

      processedOrder = confirmedOrder;
    });

    if (!processedOrder) {
      throw new PaymentServiceError(
        "Payment processing failed.",
        500
      );
    }

    return processedOrder;
  } finally {
    await session.endSession();
  }
}
