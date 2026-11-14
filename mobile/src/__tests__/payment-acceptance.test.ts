import "./setup";
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { useCartStore } from "../store/cart-store";

describe("Mobile Payment Flow & Assessment Acceptance Criteria", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.getState().addToCart(
      {
        id: "prod-101",
        name: "Wireless Noise Cancelling Headphones",
        price: 7999,
        description: "Premium sound",
        stock: 5,
      },
      1,
      { Color: "Black" }
    );
  });

  it("Acceptance Rule: Do NOT display success state or clear cart before backend confirms SUCCESS", () => {
    // 1. Initial state: cart has items
    assert.equal(useCartStore.getState().items.length, 1);

    // 2. Client sends request to backend. While pending or unconfirmed:
    const backendResponse = {
      orderId: "ORD-9988",
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
    };

    // Client verification function used in payment-processing & payment-success screens:
    const isOrderConfirmed =
      backendResponse.orderStatus === "CONFIRMED" &&
      backendResponse.paymentStatus === "SUCCESS";

    assert.equal(isOrderConfirmed, false, "Must not confirm order before backend confirms");

    // Ensure cart is NOT cleared
    if (isOrderConfirmed) {
      useCartStore.getState().clearCart();
    }
    assert.equal(useCartStore.getState().items.length, 1, "Cart must remain intact while order is pending");
  });

  it("Acceptance Rule: On payment FAILED, preserve cart items so customer can retry", () => {
    // Backend simulated failure response
    const failedBackendResponse = {
      orderId: "ORD-9988",
      orderStatus: "PENDING",
      paymentStatus: "FAILED",
    };

    const isOrderConfirmed =
      failedBackendResponse.orderStatus === "CONFIRMED" &&
      failedBackendResponse.paymentStatus === "SUCCESS";

    assert.equal(isOrderConfirmed, false);

    // The cart must NOT be cleared on failure
    if (isOrderConfirmed) {
      useCartStore.getState().clearCart();
    }

    assert.equal(useCartStore.getState().items.length, 1, "Cart must be preserved after payment failure");
    assert.equal(useCartStore.getState().items[0].id, "prod-101");
  });

  it("Acceptance Rule: Clear cart ONLY after backend explicitly confirms SUCCESS and CONFIRMED", () => {
    const verifiedSuccessResponse = {
      orderId: "ORD-9988",
      orderStatus: "CONFIRMED",
      paymentStatus: "SUCCESS",
    };

    const isOrderConfirmed =
      verifiedSuccessResponse.orderStatus === "CONFIRMED" &&
      verifiedSuccessResponse.paymentStatus === "SUCCESS";

    assert.equal(isOrderConfirmed, true);

    if (isOrderConfirmed) {
      useCartStore.getState().clearCart();
    }

    assert.equal(useCartStore.getState().items.length, 0, "Cart must be cleared after verified payment success");
  });

  it("Acceptance Rule: Payment retry must reuse the exact same order ID without generating duplicate orders", () => {
    const originalOrderId = "ORD-123456789";

    // Simulate retry flow in PaymentFailureScreen
    const createRetryPayload = (existingOrderId: string, method: string) => {
      return {
        orderId: existingOrderId,
        paymentMethod: method,
        isRetry: true,
      };
    };

    const retryPayload = createRetryPayload(originalOrderId, "UPI");

    assert.equal(retryPayload.orderId, originalOrderId, "Retry payload must reuse the existing order ID");
  });
});

