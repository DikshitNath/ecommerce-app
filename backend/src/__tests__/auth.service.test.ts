import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import { registerUser, loginUser, AuthServiceError } from "../services/auth.service";

process.env.JWT_SECRET = "test_jwt_secret_key_for_testing_12345";
process.env.JWT_EXPIRES_IN = "1h";

describe("Auth Service", () => {
  afterEach(() => {
    mock.reset();
  });

  describe("registerUser", () => {
    it("should successfully register a new user and return a JWT token", async () => {
      const mockUserId = "507f1f77bcf86cd799439011";
      const name = "John Doe";
      const email = "john@example.com";
      const password = "Password123!";

      // Mock User.findOne to return null (no duplicate)
      mock.method(User, "findOne", async () => null);

      // Mock User.create
      mock.method(User, "create", async (data: any) => ({
        _id: { toString: () => mockUserId },
        name: data.name,
        email: data.email,
        password: data.password,
      }));

      const result = await registerUser(name, email, password);

      assert.ok(result.token, "Token should be returned");
      assert.equal(result.user.id, mockUserId);
      assert.equal(result.user.name, "John Doe");
      assert.equal(result.user.email, "john@example.com");

      // Verify token contains userId
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET!) as { userId: string };
      assert.equal(decoded.userId, mockUserId);
    });

    it("should reject registration if email is already taken", async () => {
      mock.method(User, "findOne", async () => ({
        _id: "existing_id",
        email: "taken@example.com",
      }));

      await assert.rejects(
        async () => {
          await registerUser("Jane", "taken@example.com", "Password123!");
        },
        (err: AuthServiceError) => {
          assert.equal(err.statusCode, 409);
          assert.equal(err.message, "Email is already registered");
          return true;
        }
      );
    });

    it("should handle MongoDB duplicate key error (code 11000)", async () => {
      mock.method(User, "findOne", async () => null);
      mock.method(User, "create", async () => {
        const error: any = new Error("E11000 duplicate key error");
        error.code = 11000;
        throw error;
      });

      await assert.rejects(
        async () => {
          await registerUser("Jane", "collision@example.com", "Password123!");
        },
        (err: AuthServiceError) => {
          assert.equal(err.statusCode, 409);
          assert.equal(err.message, "Email is already registered");
          return true;
        }
      );
    });
  });

  describe("loginUser", () => {
    it("should successfully log in with valid credentials and return JWT", async () => {
      const mockUserId = "507f1f77bcf86cd799439012";
      const hashedPassword = await bcrypt.hash("CorrectPass123", 10);

      const mockQuery = {
        select: mock.fn(() =>
          Promise.resolve({
            _id: { toString: () => mockUserId },
            name: "Alice Smith",
            email: "alice@example.com",
            password: hashedPassword,
          })
        ),
      };

      mock.method(User, "findOne", () => mockQuery);

      const result = await loginUser("alice@example.com", "CorrectPass123");

      assert.ok(result.token);
      assert.equal(result.user.name, "Alice Smith");
      assert.equal(result.user.email, "alice@example.com");

      const decoded = jwt.verify(result.token, process.env.JWT_SECRET!) as { userId: string };
      assert.equal(decoded.userId, mockUserId);
    });

    it("should reject login if user is not found", async () => {
      const mockQuery = {
        select: mock.fn(() => Promise.resolve(null)),
      };
      mock.method(User, "findOne", () => mockQuery);

      await assert.rejects(
        async () => {
          await loginUser("notfound@example.com", "AnyPass123");
        },
        (err: AuthServiceError) => {
          assert.equal(err.statusCode, 401);
          assert.equal(err.message, "Invalid email or password");
          return true;
        }
      );
    });

    it("should reject login if password is incorrect", async () => {
      const hashedPassword = await bcrypt.hash("RightPass123", 10);
      const mockQuery = {
        select: mock.fn(() =>
          Promise.resolve({
            _id: "user123",
            name: "Alice",
            email: "alice@example.com",
            password: hashedPassword,
          })
        ),
      };
      mock.method(User, "findOne", () => mockQuery);

      await assert.rejects(
        async () => {
          await loginUser("alice@example.com", "WrongPassword");
        },
        (err: AuthServiceError) => {
          assert.equal(err.statusCode, 401);
          assert.equal(err.message, "Invalid email or password");
          return true;
        }
      );
    });
  });
});

