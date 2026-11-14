import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";

process.env.JWT_SECRET = "test_jwt_secret_key_for_testing_12345";

describe("Admin Authorization Middleware", () => {
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

  it("should permit admin user to access protected endpoints", async () => {
    const adminUserId = "507f1f77bcf86cd799439011";

    const mockQuery = {
      select: mock.fn(() =>
        Promise.resolve({
          _id: adminUserId,
          role: "admin",
        })
      ),
    };
    mock.method(User, "findById", () => mockQuery);

    const req: any = {
      user: { userId: adminUserId },
    };
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await requireAdmin(req, res, next);

    assert.equal(nextCalled, true, "next() must be called for admin users");
    assert.equal(res.statusCode, 200);
  });

  it("should reject customer with HTTP 403 Forbidden", async () => {
    const customerUserId = "507f1f77bcf86cd799439022";

    const mockQuery = {
      select: mock.fn(() =>
        Promise.resolve({
          _id: customerUserId,
          role: "customer",
        })
      ),
    };
    mock.method(User, "findById", () => mockQuery);

    const req: any = {
      user: { userId: customerUserId },
    };
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await requireAdmin(req, res, next);

    assert.equal(nextCalled, false, "next() must NOT be called for non-admin users");
    assert.equal(res.statusCode, 403);
    assert.equal(res.jsonData.success, false);
    assert.match(res.jsonData.message, /Admin access required/);
  });

  it("should reject unauthenticated request with HTTP 401 Unauthorized in requireAdmin", async () => {
    const req: any = {}; // No req.user
    const res = createMockResponse();
    let nextCalled = false;

    await requireAdmin(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.match(res.jsonData.message, /Authentication required/);
  });

  it("should reject request with HTTP 401 if user account does not exist in DB", async () => {
    const nonExistentUserId = "507f1f77bcf86cd799439099";

    const mockQuery = {
      select: mock.fn(() => Promise.resolve(null)),
    };
    mock.method(User, "findById", () => mockQuery);

    const req: any = {
      user: { userId: nonExistentUserId },
    };
    const res = createMockResponse();
    let nextCalled = false;

    await requireAdmin(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.match(res.jsonData.message, /User account not found/);
  });

  it("should reject request with HTTP 401 when Authorization header is missing in authenticate", () => {
    const req: any = { headers: {} };
    const res = createMockResponse();
    let nextCalled = false;

    authenticate(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.match(res.jsonData.message, /Authentication required/);
  });

  it("should reject expired JWT token with HTTP 401", () => {
    const expiredToken = jwt.sign(
      { userId: "507f1f77bcf86cd799439011" },
      process.env.JWT_SECRET!,
      { expiresIn: "0s" }
    );

    const req: any = {
      headers: {
        authorization: `Bearer ${expiredToken}`,
      },
    };
    const res = createMockResponse();
    let nextCalled = false;

    authenticate(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.match(res.jsonData.message, /Session expired/);
  });

  it("should reject invalid/forged JWT signature with HTTP 401", () => {
    const forgedToken = jwt.sign(
      { userId: "507f1f77bcf86cd799439011" },
      "tampered_signature_secret"
    );

    const req: any = {
      headers: {
        authorization: `Bearer ${forgedToken}`,
      },
    };
    const res = createMockResponse();
    let nextCalled = false;

    authenticate(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.match(res.jsonData.message, /Invalid authentication token/);
  });
});

