import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Order from "../models/order.model";
import Product from "../models/product.model";
import { processPayment, PaymentServiceError } from "../services/payment.service";

describe("Payment Service", () => {
  const validOrderId = "507f1f77bcf86cd799439033";
  const validUserId = "507f1f77bcf86cd799439011";
  const validProductId = "507f1f77bcf86cd799439022";

  afterEach(() => {
    mock.reset();
  });

  const setupMockSession = () => {
    const mockSession = {
      withTransaction: async (fn: () => Promise<void>) => {
        await fn();
      },
      endSession: mock.fn(),
    };

    mock.method(mongoose, "startSession", async () => mockSession as any);
    return mockSession;
  };

  it("should process SUCCESS payment: atomically deduct stock and confirm order", async () => {
    setupMockSession();

    const pendingOrder: any = {
      _id: validOrderId,
      userId: validUserId,
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      items: [
        {
          productId: new mongoose.Types.ObjectId(validProductId),
          quantity: 2,
        },
      ],
    };

    const mockOrderQuery = {
      session: mock.fn(() => Promise.resolve(pendingOrder)),
    };
    mock.method(Order, "findOne", () => mockOrderQuery);

    let stockDeducted = false;
    mock.method(Product, "findOneAndUpdate", async (filter: any, update: any) => {
      // Verify filter requires stock >= quantity
      assert.equal(filter.stock.$gte, 2);
      assert.equal(update.$inc.stock, -2);
      stockDeducted = true;
      return { _id: validProductId, stock: 8 };
    });

    const confirmedOrder: any = {
      ...pendingOrder,
      orderStatus: "CONFIRMED",
      paymentStatus: "SUCCESS",
    };
    mock.method(Order, "findOneAndUpdate", async (filter: any, update: any) => {
      assert.equal(update.$set.orderStatus, "CONFIRMED");
      assert.equal(update.$set.paymentStatus, "SUCCESS");
      return confirmedOrder;
    });

    const result = await processPayment(validOrderId, validUserId, "SUCCESS");

    assert.equal(stockDeducted, true, "Product stock must be deducted on payment success");
    assert.equal(result.orderStatus, "CONFIRMED");
    assert.equal(result.paymentStatus, "SUCCESS");
  });

  it("should process FAILED payment: mark payment as FAILED without deducting stock", async () => {
    setupMockSession();

    const pendingOrder: any = {
      _id: validOrderId,
      userId: validUserId,
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      items: [
        {
          productId: new mongoose.Types.ObjectId(validProductId),
          quantity: 2,
        },
      ],
    };

    const mockOrderQuery = {
      session: mock.fn(() => Promise.resolve(pendingOrder)),
    };
    mock.method(Order, "findOne", () => mockOrderQuery);

    let stockDeductionAttempted = false;
    mock.method(Product, "findOneAndUpdate", async () => {
      stockDeductionAttempted = true;
      return null;
    });

    const failedOrder: any = {
      ...pendingOrder,
      orderStatus: "PENDING", // Remains pending
      paymentStatus: "FAILED",
    };
    mock.method(Order, "findOneAndUpdate", async (filter: any, update: any) => {
      assert.equal(update.$set.paymentStatus, "FAILED");
      return failedOrder;
    });

    const result = await processPayment(validOrderId, validUserId, "FAILED");

    assert.equal(stockDeductionAttempted, false, "Stock must NOT be deducted on payment failure");
    assert.equal(result.paymentStatus, "FAILED");
    assert.equal(result.orderStatus, "PENDING");
  });

  it("should fail payment and abort if stock becomes insufficient at payment time", async () => {
    setupMockSession();

    const pendingOrder: any = {
      _id: validOrderId,
      userId: validUserId,
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      items: [
        {
          productId: new mongoose.Types.ObjectId(validProductId),
          quantity: 5,
        },
      ],
    };

    const mockOrderQuery = {
      session: mock.fn(() => Promise.resolve(pendingOrder)),
    };
    mock.method(Order, "findOne", () => mockOrderQuery);

    // Product findOneAndUpdate returns null (out of stock)
    mock.method(Product, "findOneAndUpdate", async () => null);

    let orderConfirmed = false;
    mock.method(Order, "findOneAndUpdate", async () => {
      orderConfirmed = true;
      return null;
    });

    await assert.rejects(
      async () => {
        await processPayment(validOrderId, validUserId, "SUCCESS");
      },
      (err: PaymentServiceError) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Insufficient stock/);
        return true;
      }
    );

    assert.equal(orderConfirmed, false, "Order must NOT be confirmed if out of stock");
  });

  it("should be idempotent: repeated calls on already confirmed order do not re-deduct stock", async () => {
    setupMockSession();

    const alreadyConfirmedOrder: any = {
      _id: validOrderId,
      userId: validUserId,
      orderStatus: "CONFIRMED",
      paymentStatus: "SUCCESS",
      items: [
        {
          productId: new mongoose.Types.ObjectId(validProductId),
          quantity: 2,
        },
      ],
    };

    const mockOrderQuery = {
      session: mock.fn(() => Promise.resolve(alreadyConfirmedOrder)),
    };
    mock.method(Order, "findOne", () => mockOrderQuery);

    let stockDeductionAttempted = false;
    mock.method(Product, "findOneAndUpdate", async () => {
      stockDeductionAttempted = true;
      return null;
    });

    const result = await processPayment(validOrderId, validUserId, "SUCCESS");

    assert.equal(stockDeductionAttempted, false, "Stock must NOT be re-deducted on repeated payment call");
    assert.equal(result.orderStatus, "CONFIRMED");
    assert.equal(result.paymentStatus, "SUCCESS");
  });

  it("should reject payment if order belongs to a different user", async () => {
    setupMockSession();

    // Order not found for this userId
    const mockOrderQuery = {
      session: mock.fn(() => Promise.resolve(null)),
    };
    mock.method(Order, "findOne", () => mockOrderQuery);

    await assert.rejects(
      async () => {
        await processPayment(validOrderId, "different_user_id_12345678", "SUCCESS");
      },
      (err: PaymentServiceError) => {
        assert.equal(err.statusCode, 401);
        return true;
      }
    );
  });
});

