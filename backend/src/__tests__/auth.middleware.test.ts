import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { authenticate } from "../middleware/auth.middleware";

process.env.JWT_SECRET = "test_jwt_secret_key_for_testing_12345";

describe("Auth Middleware", () => {
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

  it("should permit request and attach userId for valid Bearer token", () => {
    const validUserId = "507f1f77bcf86cd799439011";
    const token = jwt.sign({ userId: validUserId }, process.env.JWT_SECRET!);

    const req: any = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    const res = createMockResponse();
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    authenticate(req, res, next);

    assert.equal(nextCalled, true);
    assert.equal(req.user?.userId, validUserId);
  });

  it("should return 401 if Authorization header is missing", () => {
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

  it("should return 401 for expired JWT token", () => {
    // Generate expired token
    const token = jwt.sign(
      { userId: "507f1f77bcf86cd799439011" },
      process.env.JWT_SECRET!,
      { expiresIn: "0s" }
    );

    const req: any = {
      headers: {
        authorization: `Bearer ${token}`,
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

  it("should return 401 for forged or invalid signature JWT", () => {
    const forgedToken = jwt.sign(
      { userId: "507f1f77bcf86cd799439011" },
      "wrong_secret_key"
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

