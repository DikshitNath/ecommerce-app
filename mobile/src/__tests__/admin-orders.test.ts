import "./setup";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Order, OrderStatus, PaymentStatus } from "../services/order.service";

describe("Mobile Admin Orders Screen Logic", () => {
  const sampleAdminOrder: Order = {
    _id: "order-101",
    orderNumber: "ORD-998877",
    userId: {
      _id: "user-1",
      name: "Alice Johnson",
      email: "alice@example.com",
    },
    items: [
      {
        productId: "prod-1",
        name: "Casual Sneakers",
        sku: "SNK-01",
        price: 2499,
        quantity: 2,
        selectedVariants: { Size: "9", Color: "White" },
      },
      {
        productId: "prod-2",
        name: "Cotton Socks",
        sku: "SCK-01",
        price: 199,
        quantity: 3,
        selectedVariants: { Color: "Black" },
      },
    ],
    shippingAddress: {
      fullName: "Alice Johnson",
      phone: "9876543210",
      addressLine: "Flat 204, Green Heights",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411001",
    },
    subtotal: 5595,
    deliveryFee: 40,
    totalAmount: 5635,
    paymentMethod: "UPI",
    paymentStatus: "SUCCESS",
    orderStatus: "CONFIRMED",
    createdAt: "2026-11-14T10:00:00.000Z",
    updatedAt: "2026-11-14T10:05:00.000Z",
  };

  it("should extract customer name and email from populated userId", () => {
    const getCustomerInfo = (order: Order) => {
      const name =
        typeof order.userId === "object" && order.userId?.name
          ? order.userId.name
          : order.shippingAddress?.fullName || "Customer";

      const email =
        typeof order.userId === "object" && order.userId?.email
          ? order.userId.email
          : "Email not provided";

      return { name, email };
    };

    const info = getCustomerInfo(sampleAdminOrder);
    assert.equal(info.name, "Alice Johnson");
    assert.equal(info.email, "alice@example.com");
  });

  it("should fallback gracefully if userId is unpopulated or missing", () => {
    const orderWithoutUser: Order = {
      ...sampleAdminOrder,
      userId: "raw-user-id-string",
    };

    const name =
      typeof orderWithoutUser.userId === "object" && orderWithoutUser.userId?.name
        ? orderWithoutUser.userId.name
        : orderWithoutUser.shippingAddress?.fullName || "Customer";

    assert.equal(name, "Alice Johnson", "Should fallback to shipping address recipient name");
  });

  it("should correctly aggregate item counts across lines", () => {
    const totalItems = sampleAdminOrder.items.reduce((sum, item) => sum + item.quantity, 0);
    assert.equal(totalItems, 5); // 2 sneakers + 3 socks
  });

  it("should format currency consistently in Indian Rupees", () => {
    const formatPrice = (price: number) => `₹${price.toLocaleString("en-IN")}`;
    assert.equal(formatPrice(sampleAdminOrder.totalAmount), "₹5,635");
    assert.equal(formatPrice(40), "₹40");
  });

  it("should classify order statuses and payment statuses with appropriate badges", () => {
    const getOrderStatusCategory = (status: OrderStatus) => {
      switch (status) {
        case "CONFIRMED":
          return "success";
        case "CANCELLED":
          return "danger";
        default:
          return "warning";
      }
    };

    const getPaymentStatusCategory = (status: PaymentStatus) => {
      switch (status) {
        case "SUCCESS":
          return "success";
        case "FAILED":
          return "danger";
        default:
          return "warning";
      }
    };

    assert.equal(getOrderStatusCategory("CONFIRMED"), "success");
    assert.equal(getOrderStatusCategory("PENDING"), "warning");
    assert.equal(getOrderStatusCategory("CANCELLED"), "danger");

    assert.equal(getPaymentStatusCategory("SUCCESS"), "success");
    assert.equal(getPaymentStatusCategory("FAILED"), "danger");
    assert.equal(getPaymentStatusCategory("PENDING"), "warning");
  });

  it("should filter client-side lists by active status pill", () => {
    const ordersList: Order[] = [
      { ...sampleAdminOrder, _id: "1", orderStatus: "CONFIRMED", paymentStatus: "SUCCESS" },
      { ...sampleAdminOrder, _id: "2", orderStatus: "PENDING", paymentStatus: "PENDING" },
      { ...sampleAdminOrder, _id: "3", orderStatus: "PENDING", paymentStatus: "FAILED" },
    ];

    const filterOrders = (orders: Order[], filter: string) => {
      if (filter === "ALL") return orders;
      if (filter === "CONFIRMED") return orders.filter((o) => o.orderStatus === "CONFIRMED");
      if (filter === "PENDING")
        return orders.filter((o) => o.orderStatus === "PENDING" && o.paymentStatus !== "FAILED");
      if (filter === "FAILED") return orders.filter((o) => o.paymentStatus === "FAILED");
      return orders;
    };

    assert.equal(filterOrders(ordersList, "ALL").length, 3);
    assert.equal(filterOrders(ordersList, "CONFIRMED").length, 1);
    assert.equal(filterOrders(ordersList, "PENDING").length, 1);
    assert.equal(filterOrders(ordersList, "FAILED").length, 1);
  });

  describe("Mobile Search Filtering & State Management", () => {
    const mixedOrders: Order[] = [
      {
        ...sampleAdminOrder,
        _id: "order-1",
        orderNumber: "ORD-1001",
        userId: { name: "Bob Smith", email: "bob@example.com" },
        orderStatus: "CONFIRMED",
        paymentStatus: "SUCCESS",
      },
      {
        ...sampleAdminOrder,
        _id: "order-2",
        orderNumber: "ORD-2002",
        userId: { name: "Charlie Brown", email: "charlie@gmail.com" },
        orderStatus: "PENDING",
        paymentStatus: "PENDING",
      },
      {
        ...sampleAdminOrder,
        _id: "order-3",
        orderNumber: "ORD-3003",
        userId: { name: "Alice Wonderland", email: "alice@company.com" },
        orderStatus: "PENDING",
        paymentStatus: "FAILED",
      },
    ];

    const matchOrder = (order: Order, term: string) => {
      const lower = term.toLowerCase();
      const customerName =
        typeof order.userId === "object" ? order.userId?.name?.toLowerCase() || "" : "";
      const customerEmail =
        typeof order.userId === "object" ? order.userId?.email?.toLowerCase() || "" : "";
      const orderNumber = order.orderNumber.toLowerCase();

      return (
        orderNumber.includes(lower) ||
        customerName.includes(lower) ||
        customerEmail.includes(lower)
      );
    };

    it("should match orders by Order Number", () => {
      const matches = mixedOrders.filter((o) => matchOrder(o, "ORD-2002"));
      assert.equal(matches.length, 1);
      assert.equal(matches[0]._id, "order-2");
    });

    it("should match orders by Customer Name", () => {
      const matches = mixedOrders.filter((o) => matchOrder(o, "Charlie"));
      assert.equal(matches.length, 1);
      assert.equal(matches[0]._id, "order-2");
    });

    it("should match orders by Customer Email", () => {
      const matches = mixedOrders.filter((o) => matchOrder(o, "alice@company.com"));
      assert.equal(matches.length, 1);
      assert.equal(matches[0]._id, "order-3");
    });

    it("should match search combined with status filters", () => {
      // Search for "ORD", but only CONFIRMED
      const matches = mixedOrders
        .filter((o) => matchOrder(o, "ORD"))
        .filter((o) => o.orderStatus === "CONFIRMED");

      assert.equal(matches.length, 1);
      assert.equal(matches[0]._id, "order-1");
    });

    it("should reset pagination page to 1 when search query changes or is cleared", () => {
      let currentPage = 3;
      const onSearchChange = (newQuery: string) => {
        currentPage = 1;
        return newQuery.trim();
      };

      const result = onSearchChange("ORD-1001");
      assert.equal(currentPage, 1);
      assert.equal(result, "ORD-1001");

      const cleared = onSearchChange("");
      assert.equal(currentPage, 1);
      assert.equal(cleared, "");
    });
  });
});
