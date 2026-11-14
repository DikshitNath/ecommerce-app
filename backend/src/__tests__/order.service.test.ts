import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Product from "../models/product.model";
import Order from "../models/order.model";
import { createPendingOrder, OrderServiceError } from "../services/order.service";

describe("Order Service", () => {
  const validUserId = "507f1f77bcf86cd799439011";
  const validProductId = "507f1f77bcf86cd799439022";

  const sampleAddress = {
    fullName: "John Doe",
    phone: "9876543210",
    addressLine: "123 Main St",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
  };

  afterEach(() => {
    mock.reset();
  });

  it("should create a pending order with database-calculated prices and delivery fee", async () => {
    // Mock Product in DB with trusted price
    const mockProduct = {
      _id: { toString: () => validProductId },
      name: "Cotton T-Shirt",
      sku: "TSHIRT-01",
      price: 599, // DB price
      stock: 10,
      isActive: true,
      variants: [
        { name: "Size", options: ["S", "M", "L"] },
        { name: "Color", options: ["Blue", "Red"] },
      ],
    };

    mock.method(Product, "find", async () => [mockProduct]);

    let createdOrderPayload: any = null;
    mock.method(Order, "create", async (data: any) => {
      createdOrderPayload = data;
      return {
        _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439099"),
        ...data,
      };
    });

    const order = await createPendingOrder(validUserId, {
      items: [
        {
          productId: validProductId,
          quantity: 2,
          selectedVariants: { Size: "M", Color: "Blue" },
        },
      ],
      shippingAddress: sampleAddress,
      paymentMethod: "UPI",
    });

    assert.ok(order);
    assert.equal(createdOrderPayload.subtotal, 1198); // 599 * 2
    assert.equal(createdOrderPayload.deliveryFee, 40);
    assert.equal(createdOrderPayload.totalAmount, 1238); // 1198 + 40
    assert.equal(createdOrderPayload.paymentStatus, "PENDING");
    assert.equal(createdOrderPayload.orderStatus, "PENDING");
    assert.ok(createdOrderPayload.orderNumber.startsWith("ORD-"));
  });

  it("should enforce aggregate stock across multiple variants of the same product", async () => {
    // Product has total stock of 3
    const mockProduct = {
      _id: { toString: () => validProductId },
      name: "Limited Edition Shoes",
      sku: "SHOES-01",
      price: 1999,
      stock: 3,
      isActive: true,
      variants: [{ name: "Size", options: ["8", "9", "10"] }],
    };

    mock.method(Product, "find", async () => [mockProduct]);

    // Requesting 2 of Size 8 and 2 of Size 9 (Total requested = 4, but stock = 3)
    await assert.rejects(
      async () => {
        await createPendingOrder(validUserId, {
          items: [
            {
              productId: validProductId,
              quantity: 2,
              selectedVariants: { Size: "8" },
            },
            {
              productId: validProductId,
              quantity: 2,
              selectedVariants: { Size: "9" },
            },
          ],
          shippingAddress: sampleAddress,
          paymentMethod: "CARD",
        });
      },
      (err: OrderServiceError) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Insufficient stock/);
        return true;
      }
    );
  });

  it("should reject order if required variant is missing or invalid", async () => {
    const mockProduct = {
      _id: { toString: () => validProductId },
      name: "T-Shirt",
      sku: "TSHIRT-01",
      price: 499,
      stock: 10,
      isActive: true,
      variants: [{ name: "Size", options: ["S", "M", "L"] }],
    };

    mock.method(Product, "find", async () => [mockProduct]);

    // Missing Size variant
    await assert.rejects(
      async () => {
        await createPendingOrder(validUserId, {
          items: [
            {
              productId: validProductId,
              quantity: 1,
              selectedVariants: {},
            },
          ],
          shippingAddress: sampleAddress,
          paymentMethod: "UPI",
        });
      },
      (err: OrderServiceError) => {
        assert.match(err.message, /Please select Size/);
        return true;
      }
    );

    // Invalid Size option
    await assert.rejects(
      async () => {
        await createPendingOrder(validUserId, {
          items: [
            {
              productId: validProductId,
              quantity: 1,
              selectedVariants: { Size: "XXXL" },
            },
          ],
          shippingAddress: sampleAddress,
          paymentMethod: "UPI",
        });
      },
      (err: OrderServiceError) => {
        assert.match(err.message, /Invalid Size selection/);
        return true;
      }
    );
  });

  it("should reject empty cart or invalid user ID", async () => {
    await assert.rejects(
      async () => {
        await createPendingOrder("invalid-user-id", {
          items: [{ productId: validProductId, quantity: 1 }],
          shippingAddress: sampleAddress,
          paymentMethod: "UPI",
        });
      },
      (err: OrderServiceError) => {
        assert.equal(err.statusCode, 401);
        assert.match(err.message, /Invalid user ID/);
        return true;
      }
    );

    await assert.rejects(
      async () => {
        await createPendingOrder(validUserId, {
          items: [],
          shippingAddress: sampleAddress,
          paymentMethod: "UPI",
        });
      },
      (err: OrderServiceError) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Cart cannot be empty/);
        return true;
      }
    );
  });
});

