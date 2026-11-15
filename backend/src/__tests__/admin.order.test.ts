import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Order from "../models/order.model";
import User from "../models/user.model";
import {
  getAdminOrders,
  getAdminOrderById,
  getOrders,
  getOrderById,
} from "../controllers/order.controller";
import { requireAdmin } from "../middleware/admin.middleware";

describe("Admin Order Management API", () => {
  const adminUserId = "507f1f77bcf86cd799439011";
  const customerUserId = "507f1f77bcf86cd799439022";
  const otherCustomerUserId = "507f1f77bcf86cd799439033";
  const sampleOrderId = "507f1f77bcf86cd799439099";

  afterEach(() => {
    mock.reset();
  });

  const createMockResponse = () => {
    const res: any = {
      statusCode: 200,
      jsonData: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  };

  const sampleOrderDoc = {
    _id: sampleOrderId,
    orderNumber: "ORD-1700000000-123",
    userId: {
      _id: customerUserId,
      name: "Customer One",
      email: "customer1@example.com",
    },
    items: [
      {
        productId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439088"),
        name: "Classic Denim Jacket",
        sku: "JACKET-01",
        price: 1999,
        quantity: 2,
        selectedVariants: { Size: "L", Color: "Blue" },
      },
    ],
    shippingAddress: {
      fullName: "Customer One",
      phone: "9876543210",
      addressLine: "Flat 101, Palm Grove",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
    },
    subtotal: 3998,
    deliveryFee: 40,
    totalAmount: 4038,
    paymentMethod: "UPI",
    paymentStatus: "SUCCESS",
    orderStatus: "CONFIRMED",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("Admin Authorization on Orders", () => {
    it("should allow admin access to admin order endpoints", async () => {
      const mockQuery = {
        select: mock.fn(() =>
          Promise.resolve({ _id: adminUserId, role: "admin" })
        ),
      };
      mock.method(User, "findById", () => mockQuery);

      const req: any = { user: { userId: adminUserId } };
      const res = createMockResponse();
      let nextCalled = false;

      await requireAdmin(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true, "requireAdmin must permit admin user");
    });

    it("should reject customer with HTTP 403 when accessing admin order endpoints", async () => {
      const mockQuery = {
        select: mock.fn(() =>
          Promise.resolve({ _id: customerUserId, role: "customer" })
        ),
      };
      mock.method(User, "findById", () => mockQuery);

      const req: any = { user: { userId: customerUserId } };
      const res = createMockResponse();
      let nextCalled = false;

      await requireAdmin(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 403);
      assert.match(res.jsonData.message, /Admin access required/);
    });

    it("should reject unauthenticated request with HTTP 401 in getAdminOrders", async () => {
      const req: any = {};
      const res = createMockResponse();

      await getAdminOrders(req, res);

      assert.equal(res.statusCode, 401);
      assert.match(res.jsonData.message, /Authentication required/);
    });
  });

  describe("Admin Order Listing & Filtering", () => {
    it("should retrieve all customer orders with customer info populated", async () => {
      let queryFilterPassed: any = null;
      let populateFields: any = null;

      const mockQueryChain: any = {
        populate: mock.fn((field: string, select: string) => {
          populateFields = { field, select };
          return mockQueryChain;
        }),
        sort: mock.fn(() => mockQueryChain),
        skip: mock.fn(() => mockQueryChain),
        limit: mock.fn(() => mockQueryChain),
        lean: mock.fn(() => Promise.resolve([sampleOrderDoc])),
      };

      mock.method(Order, "find", (filter: any) => {
        queryFilterPassed = filter;
        return mockQueryChain;
      });

      mock.method(Order, "countDocuments", async () => 1);

      const req: any = {
        user: { userId: adminUserId },
        query: { page: "1", limit: "10" },
      };
      const res = createMockResponse();

      await getAdminOrders(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.data.length, 1);
      assert.deepEqual(queryFilterPassed, {}, "Should query all orders when no status filter is provided");
      assert.equal(populateFields.field, "userId");
      assert.equal(populateFields.select, "name email");
      assert.equal(res.jsonData.data[0].userId.email, "customer1@example.com");
      assert.equal(res.jsonData.pagination.totalOrders, 1);
      assert.equal(res.jsonData.pagination.currentPage, 1);
    });

    it("should filter orders by status: PENDING", async () => {
      let queryFilterPassed: any = null;

      const mockQueryChain: any = {
        populate: mock.fn(() => mockQueryChain),
        sort: mock.fn(() => mockQueryChain),
        skip: mock.fn(() => mockQueryChain),
        limit: mock.fn(() => mockQueryChain),
        lean: mock.fn(() => Promise.resolve([])),
      };

      mock.method(Order, "find", (filter: any) => {
        queryFilterPassed = filter;
        return mockQueryChain;
      });

      mock.method(Order, "countDocuments", async () => 0);

      const req: any = {
        user: { userId: adminUserId },
        query: { status: "pending" },
      };
      const res = createMockResponse();

      await getAdminOrders(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(queryFilterPassed.orderStatus, "PENDING");
      assert.deepEqual(queryFilterPassed.paymentStatus, { $ne: "FAILED" });
    });

    it("should filter orders by status: CONFIRMED", async () => {
      let queryFilterPassed: any = null;

      const mockQueryChain: any = {
        populate: mock.fn(() => mockQueryChain),
        sort: mock.fn(() => mockQueryChain),
        skip: mock.fn(() => mockQueryChain),
        limit: mock.fn(() => mockQueryChain),
        lean: mock.fn(() => Promise.resolve([sampleOrderDoc])),
      };

      mock.method(Order, "find", (filter: any) => {
        queryFilterPassed = filter;
        return mockQueryChain;
      });

      mock.method(Order, "countDocuments", async () => 1);

      const req: any = {
        user: { userId: adminUserId },
        query: { status: "confirmed" },
      };
      const res = createMockResponse();

      await getAdminOrders(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(queryFilterPassed.orderStatus, "CONFIRMED");
    });

    it("should filter orders by status: FAILED", async () => {
      let queryFilterPassed: any = null;

      const mockQueryChain: any = {
        populate: mock.fn(() => mockQueryChain),
        sort: mock.fn(() => mockQueryChain),
        skip: mock.fn(() => mockQueryChain),
        limit: mock.fn(() => mockQueryChain),
        lean: mock.fn(() => Promise.resolve([])),
      };

      mock.method(Order, "find", (filter: any) => {
        queryFilterPassed = filter;
        return mockQueryChain;
      });

      mock.method(Order, "countDocuments", async () => 0);

      const req: any = {
        user: { userId: adminUserId },
        query: { status: "failed" },
      };
      const res = createMockResponse();

      await getAdminOrders(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(queryFilterPassed.paymentStatus, "FAILED");
    });
  });

  describe("Admin Order Details", () => {
    it("should retrieve full order details for any order", async () => {
      const mockQuery = {
        populate: mock.fn(() => ({
          lean: mock.fn(() => Promise.resolve(sampleOrderDoc)),
        })),
      };

      mock.method(Order, "findById", (id: string) => {
        assert.equal(id, sampleOrderId);
        return mockQuery;
      });

      const req: any = {
        user: { userId: adminUserId },
        params: { id: sampleOrderId },
      };
      const res = createMockResponse();

      await getAdminOrderById(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.data.orderNumber, "ORD-1700000000-123");
      assert.equal(res.jsonData.data.userId.name, "Customer One");
      assert.equal(res.jsonData.data.items.length, 1);
      assert.equal(res.jsonData.data.items[0].name, "Classic Denim Jacket");
      assert.deepEqual(res.jsonData.data.items[0].selectedVariants, { Size: "L", Color: "Blue" });
      assert.equal(res.jsonData.data.totalAmount, 4038);
    });

    it("should return HTTP 400 for invalid order ID format", async () => {
      const req: any = {
        user: { userId: adminUserId },
        params: { id: "not-a-mongo-id" },
      };
      const res = createMockResponse();

      await getAdminOrderById(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.jsonData.message, /Invalid order ID/);
    });

    it("should return HTTP 404 for non-existent order", async () => {
      const mockQuery = {
        populate: mock.fn(() => ({
          lean: mock.fn(() => Promise.resolve(null)),
        })),
      };

      mock.method(Order, "findById", () => mockQuery);

      const req: any = {
        user: { userId: adminUserId },
        params: { id: sampleOrderId },
      };
      const res = createMockResponse();

      await getAdminOrderById(req, res);

      assert.equal(res.statusCode, 404);
      assert.match(res.jsonData.message, /Order not found/);
    });
  });

  describe("Customer Isolation & Security", () => {
    it("should ensure customer orders endpoint only returns logged-in user orders", async () => {
      let customerQueryFilter: any = null;

      const mockQueryChain: any = {
        sort: mock.fn(() => mockQueryChain),
        skip: mock.fn(() => mockQueryChain),
        limit: mock.fn(() => mockQueryChain),
        lean: mock.fn(() => Promise.resolve([sampleOrderDoc])),
      };

      mock.method(Order, "find", (filter: any) => {
        customerQueryFilter = filter;
        return mockQueryChain;
      });

      mock.method(Order, "countDocuments", async () => 1);

      const req: any = {
        user: { userId: customerUserId },
        query: { page: "1", limit: "10" },
      };
      const res = createMockResponse();

      await getOrders(req, res);

      assert.equal(res.statusCode, 200);
      assert.ok(customerQueryFilter.userId, "Customer query must filter by userId");
      assert.equal(customerQueryFilter.userId.toString(), customerUserId);
    });

    it("should prevent customer from accessing another customer order via getOrderById", async () => {
      // Simulate Order.findOne with { _id, userId } returning null when customer doesn't own order
      mock.method(Order, "findOne", (query: any) => {
        assert.equal(query.userId.toString(), customerUserId);
        return {
          lean: mock.fn(() => Promise.resolve(null)),
        };
      });

      const req: any = {
        user: { userId: customerUserId },
        params: { id: sampleOrderId },
      };
      const res = createMockResponse();

      await getOrderById(req, res);

      assert.equal(res.statusCode, 404);
      assert.match(res.jsonData.message, /Order not found/);
    });
  });

  describe("Admin Order Search Functionality", () => {
    it("should search orders by Order Number", async () => {
      let queryFilterPassed: any = null;

      const mockQueryChain: any = {
        populate: mock.fn(() => mockQueryChain),
        sort: mock.fn(() => mockQueryChain),
        skip: mock.fn(() => mockQueryChain),
        limit: mock.fn(() => mockQueryChain),
        lean: mock.fn(() => Promise.resolve([sampleOrderDoc])),
      };

      mock.method(Order, "find", (filter: any) => {
        queryFilterPassed = filter;
        return mockQueryChain;
      });
      mock.method(Order, "countDocuments", async () => 1);
      mock.method(User, "find", () => ({
        lean: mock.fn(() => Promise.resolve([])),
      }));

      const req: any = {
        user: { userId: adminUserId },
        query: { search: "ORD-1700" },
      };
      const res = createMockResponse();

      await getAdminOrders(req, res);

      assert.equal(res.statusCode, 200);
      assert.ok(queryFilterPassed.$or);
      const hasOrderNumberCondition = queryFilterPassed.$or.some(
        (cond: any) => cond.orderNumber && cond.orderNumber.$regex
      );
      assert.equal(hasOrderNumberCondition, true, "Filter must include orderNumber regex search");
      assert.equal(res.jsonData.data.length, 1);
    });

    it("should search orders by Customer Name", async () => {
      let queryFilterPassed: any = null;

      const mockQueryChain: any = {
        populate: mock.fn(() => mockQueryChain),
        sort: mock.fn(() => mockQueryChain),
        skip: mock.fn(() => mockQueryChain),
        limit: mock.fn(() => mockQueryChain),
        lean: mock.fn(() => Promise.resolve([sampleOrderDoc])),
      };

      mock.method(Order, "find", (filter: any) => {
        queryFilterPassed = filter;
        return mockQueryChain;
      });
      mock.method(Order, "countDocuments", async () => 1);
      mock.method(User, "find", () => ({
        lean: mock.fn(() => Promise.resolve([{ _id: new mongoose.Types.ObjectId(customerUserId) }])),
      }));

      const req: any = {
        user: { userId: adminUserId },
        query: { search: "Customer One" },
      };
      const res = createMockResponse();

      await getAdminOrders(req, res);

      assert.equal(res.statusCode, 200);
      assert.ok(queryFilterPassed.$or);
      const hasUserCondition = queryFilterPassed.$or.some(
        (cond: any) => cond.userId && cond.userId.$in
      );
      const hasShippingNameCondition = queryFilterPassed.$or.some(
        (cond: any) => cond["shippingAddress.fullName"]
      );
      assert.equal(hasUserCondition || hasShippingNameCondition, true);
      assert.equal(res.jsonData.data.length, 1);
    });

    it("should search orders by Customer Email", async () => {
      let queryFilterPassed: any = null;

      const mockQueryChain: any = {
        populate: mock.fn(() => mockQueryChain),
        sort: mock.fn(() => mockQueryChain),
        skip: mock.fn(() => mockQueryChain),
        limit: mock.fn(() => mockQueryChain),
        lean: mock.fn(() => Promise.resolve([sampleOrderDoc])),
      };

      mock.method(Order, "find", (filter: any) => {
        queryFilterPassed = filter;
        return mockQueryChain;
      });
      mock.method(Order, "countDocuments", async () => 1);
      mock.method(User, "find", () => ({
        lean: mock.fn(() => Promise.resolve([{ _id: new mongoose.Types.ObjectId(customerUserId) }])),
      }));

      const req: any = {
        user: { userId: adminUserId },
        query: { search: "customer1@example.com" },
      };
      const res = createMockResponse();

      await getAdminOrders(req, res);

      assert.equal(res.statusCode, 200);
      assert.ok(queryFilterPassed.$or);
      assert.equal(res.jsonData.data[0].userId.email, "customer1@example.com");
    });

    it("should combine search with status filters (e.g., search + CONFIRMED)", async () => {
      let queryFilterPassed: any = null;

      const mockQueryChain: any = {
        populate: mock.fn(() => mockQueryChain),
        sort: mock.fn(() => mockQueryChain),
        skip: mock.fn(() => mockQueryChain),
        limit: mock.fn(() => mockQueryChain),
        lean: mock.fn(() => Promise.resolve([sampleOrderDoc])),
      };

      mock.method(Order, "find", (filter: any) => {
        queryFilterPassed = filter;
        return mockQueryChain;
      });
      mock.method(Order, "countDocuments", async () => 1);
      mock.method(User, "find", () => ({
        lean: mock.fn(() => Promise.resolve([])),
      }));

      const req: any = {
        user: { userId: adminUserId },
        query: { search: "ORD-1700", status: "confirmed" },
      };
      const res = createMockResponse();

      await getAdminOrders(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(queryFilterPassed.orderStatus, "CONFIRMED", "Must preserve status filter");
      assert.ok(queryFilterPassed.$or, "Must apply search $or filter simultaneously");
    });

    it("should combine search with pagination controls", async () => {
      let skipPassed = 0;
      let limitPassed = 0;

      const mockQueryChain: any = {
        populate: mock.fn(() => mockQueryChain),
        sort: mock.fn(() => mockQueryChain),
        skip: mock.fn((s: number) => {
          skipPassed = s;
          return mockQueryChain;
        }),
        limit: mock.fn((l: number) => {
          limitPassed = l;
          return mockQueryChain;
        }),
        lean: mock.fn(() => Promise.resolve([])),
      };

      mock.method(Order, "find", () => mockQueryChain);
      mock.method(Order, "countDocuments", async () => 15);
      mock.method(User, "find", () => ({
        lean: mock.fn(() => Promise.resolve([])),
      }));

      const req: any = {
        user: { userId: adminUserId },
        query: { search: "ORD", page: "2", limit: "5" },
      };
      const res = createMockResponse();

      await getAdminOrders(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(skipPassed, 5); // (2 - 1) * 5
      assert.equal(limitPassed, 5);
      assert.equal(res.jsonData.pagination.currentPage, 2);
      assert.equal(res.jsonData.pagination.totalPages, 3);
      assert.equal(res.jsonData.pagination.totalOrders, 15);
    });

    it("should handle empty search results gracefully", async () => {
      const mockQueryChain: any = {
        populate: mock.fn(() => mockQueryChain),
        sort: mock.fn(() => mockQueryChain),
        skip: mock.fn(() => mockQueryChain),
        limit: mock.fn(() => mockQueryChain),
        lean: mock.fn(() => Promise.resolve([])),
      };

      mock.method(Order, "find", () => mockQueryChain);
      mock.method(Order, "countDocuments", async () => 0);
      mock.method(User, "find", () => ({
        lean: mock.fn(() => Promise.resolve([])),
      }));

      const req: any = {
        user: { userId: adminUserId },
        query: { search: "NONEXISTENT_ORDER" },
      };
      const res = createMockResponse();

      await getAdminOrders(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.data.length, 0);
      assert.equal(res.jsonData.pagination.totalOrders, 0);
    });

    it("should reject unauthorized search requests (customer receives 403, unauthenticated 401)", async () => {
      // 1. Unauthenticated in controller
      const unauthReq: any = { query: { search: "ORD" } };
      const unauthRes = createMockResponse();
      await getAdminOrders(unauthReq, unauthRes);
      assert.equal(unauthRes.statusCode, 401);

      // 2. Customer in requireAdmin middleware
      const mockQuery = {
        select: mock.fn(() =>
          Promise.resolve({ _id: customerUserId, role: "customer" })
        ),
      };
      mock.method(User, "findById", () => mockQuery);

      const customerReq: any = {
        user: { userId: customerUserId },
        query: { search: "ORD" },
      };
      const customerRes = createMockResponse();
      let nextCalled = false;

      await requireAdmin(customerReq, customerRes, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(customerRes.statusCode, 403);
    });
  });
});
