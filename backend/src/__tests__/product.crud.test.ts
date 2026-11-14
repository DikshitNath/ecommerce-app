import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Product from "../models/product.model";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
} from "../controllers/product.controller";

describe("Product Admin CRUD Operations", () => {
  const validProductId = "507f1f77bcf86cd799439011";

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

  describe("Create Product (POST /api/products)", () => {
    const validProductPayload = {
      name: "Men Casual Shirt",
      description: "Comfortable cotton slim-fit shirt",
      price: 1299,
      category: "Fashion",
      images: ["https://example.com/shirt.jpg"],
      stock: 25,
      sku: "SHIRT-SLIM-01",
      variants: [
        { name: "Size", options: ["S", "M", "L", "XL"] },
        { name: "Color", options: ["Blue", "White"] },
      ],
    };

    it("should allow admin to create a valid product", async () => {
      // Mock no existing product with this SKU
      mock.method(Product, "findOne", async () => null);

      let createdDoc: any = null;
      mock.method(Product, "create", async (data: any) => {
        createdDoc = {
          _id: new mongoose.Types.ObjectId(validProductId),
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return createdDoc;
      });

      const req: any = { body: validProductPayload };
      const res = createMockResponse();
      let nextCalled = false;

      await createProduct(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 201);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.data.name, "Men Casual Shirt");
      assert.equal(res.jsonData.data.sku, "SHIRT-SLIM-01");
      assert.equal(res.jsonData.data.isActive, true);
      assert.equal(res.jsonData.data.stock, 25);
    });

    it("should reject creation if SKU already exists (pre-check 409)", async () => {
      mock.method(Product, "findOne", async () => ({
        _id: "existing_product_id",
        sku: "SHIRT-SLIM-01",
      }));

      const req: any = { body: validProductPayload };
      const res = createMockResponse();

      await createProduct(req, res, () => {});

      assert.equal(res.statusCode, 409);
      assert.equal(res.jsonData.success, false);
      assert.match(res.jsonData.message, /already exists/i);
    });

    it("should reject creation on duplicate SKU database collision (MongoServerError 11000)", async () => {
      mock.method(Product, "findOne", async () => null);
      mock.method(Product, "create", async () => {
        const error = new mongoose.mongo.MongoServerError({
          message: "E11000 duplicate key error collection",
        });
        error.code = 11000;
        throw error;
      });

      const req: any = { body: validProductPayload };
      const res = createMockResponse();

      await createProduct(req, res, () => {});

      assert.equal(res.statusCode, 409);
      assert.equal(res.jsonData.success, false);
      assert.match(res.jsonData.message, /already exists/i);
    });

    it("should reject creation when required fields are missing", async () => {
      // Missing name
      const reqMissingName: any = {
        body: { ...validProductPayload, name: "" },
      };
      const res1 = createMockResponse();
      await createProduct(reqMissingName, res1, () => {});
      assert.equal(res1.statusCode, 400);
      assert.match(res1.jsonData.message, /Invalid product data/);

      // Missing description
      const reqMissingDesc: any = {
        body: { ...validProductPayload, description: "   " },
      };
      const res2 = createMockResponse();
      await createProduct(reqMissingDesc, res2, () => {});
      assert.equal(res2.statusCode, 400);

      // Missing category
      const reqMissingCat: any = {
        body: { ...validProductPayload, category: "" },
      };
      const res3 = createMockResponse();
      await createProduct(reqMissingCat, res3, () => {});
      assert.equal(res3.statusCode, 400);

      // Missing SKU
      const reqMissingSku: any = {
        body: { ...validProductPayload, sku: "" },
      };
      const res4 = createMockResponse();
      await createProduct(reqMissingSku, res4, () => {});
      assert.equal(res4.statusCode, 400);
    });

    it("should reject creation with negative price or negative stock", async () => {
      // Negative price
      const reqNegativePrice: any = {
        body: { ...validProductPayload, price: -50 },
      };
      const res1 = createMockResponse();
      await createProduct(reqNegativePrice, res1, () => {});
      assert.equal(res1.statusCode, 400);
      assert.match(res1.jsonData.message, /Invalid product data/);

      // Negative stock
      const reqNegativeStock: any = {
        body: { ...validProductPayload, stock: -5 },
      };
      const res2 = createMockResponse();
      await createProduct(reqNegativeStock, res2, () => {});
      assert.equal(res2.statusCode, 400);

      // Fractional stock
      const reqFractionalStock: any = {
        body: { ...validProductPayload, stock: 4.5 },
      };
      const res3 = createMockResponse();
      await createProduct(reqFractionalStock, res3, () => {});
      assert.equal(res3.statusCode, 400);
    });

    it("should reject creation with invalid variants (not an array)", async () => {
      const reqInvalidVariants: any = {
        body: { ...validProductPayload, variants: "invalid-variants-string" },
      };
      const res = createMockResponse();

      await createProduct(reqInvalidVariants, res, () => {});

      assert.equal(res.statusCode, 400);
      assert.match(res.jsonData.message, /Invalid product data/);
    });
  });

  describe("Update Product (PUT /api/products/:id)", () => {
    it("should allow admin to update product name, price, stock and variants", async () => {
      const updateData = {
        name: "Updated Denim Shirt",
        price: 1499,
        stock: 30,
        variants: [{ name: "Size", options: ["M", "L"] }],
      };

      const mockUpdatedProduct = {
        _id: validProductId,
        name: "Updated Denim Shirt",
        price: 1499,
        stock: 30,
        variants: [{ name: "Size", options: ["M", "L"] }],
        isActive: true,
      };

      mock.method(Product, "findOneAndUpdate", async (filter: any, update: any) => {
        assert.equal(filter._id, validProductId);
        assert.equal(filter.isActive, true);
        assert.equal(update.$set.name, "Updated Denim Shirt");
        assert.equal(update.$set.price, 1499);
        assert.equal(update.$set.stock, 30);
        return mockUpdatedProduct;
      });

      const req: any = {
        params: { id: validProductId },
        body: updateData,
      };
      const res = createMockResponse();

      await updateProduct(req, res, () => {});

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.data.name, "Updated Denim Shirt");
      assert.equal(res.jsonData.data.price, 1499);
    });

    it("should reject update with invalid product ID format", async () => {
      const req: any = {
        params: { id: "not-a-valid-mongo-id" },
        body: { name: "New Name" },
      };
      const res = createMockResponse();

      await updateProduct(req, res, () => {});

      assert.equal(res.statusCode, 400);
      assert.match(res.jsonData.message, /Invalid product ID/);
    });

    it("should return HTTP 404 when updating non-existent product", async () => {
      mock.method(Product, "findOneAndUpdate", async () => null);

      const req: any = {
        params: { id: validProductId },
        body: { name: "Brand New Name" },
      };
      const res = createMockResponse();

      await updateProduct(req, res, () => {});

      assert.equal(res.statusCode, 404);
      assert.match(res.jsonData.message, /Product not found/);
    });

    it("should reject duplicate SKU on update (MongoServerError 11000)", async () => {
      mock.method(Product, "findOneAndUpdate", async () => {
        const error = new mongoose.mongo.MongoServerError({
          message: "E11000 duplicate key error collection",
        });
        error.code = 11000;
        throw error;
      });

      const req: any = {
        params: { id: validProductId },
        body: { sku: "EXISTING-SKU-99" },
      };
      const res = createMockResponse();

      await updateProduct(req, res, () => {});

      assert.equal(res.statusCode, 409);
      assert.match(res.jsonData.message, /already exists/);
    });

    it("should reject update with negative price or negative stock", async () => {
      const reqNegPrice: any = {
        params: { id: validProductId },
        body: { price: -100 },
      };
      const res1 = createMockResponse();
      await updateProduct(reqNegPrice, res1, () => {});
      assert.equal(res1.statusCode, 400);
      assert.match(res1.jsonData.message, /Price must be a valid non-negative number/);

      const reqNegStock: any = {
        params: { id: validProductId },
        body: { stock: -1 },
      };
      const res2 = createMockResponse();
      await updateProduct(reqNegStock, res2, () => {});
      assert.equal(res2.statusCode, 400);
      assert.match(res2.jsonData.message, /Stock must be a non-negative integer/);
    });
  });

  describe("Delete Product (DELETE /api/products/:id)", () => {
    it("should soft-delete an active product and set isActive: false", async () => {
      const mockDeactivatedProduct = {
        _id: validProductId,
        name: "Classic Tee",
        isActive: false,
      };

      mock.method(Product, "findOneAndUpdate", async (filter: any, update: any) => {
        assert.equal(filter._id, validProductId);
        assert.equal(filter.isActive, true, "Must only target active products");
        assert.equal(update.$set.isActive, false, "Must perform soft deletion");
        return mockDeactivatedProduct;
      });

      const req: any = {
        params: { id: validProductId },
      };
      const res = createMockResponse();

      await deleteProduct(req, res, () => {});

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.data.isActive, false);
      assert.match(res.jsonData.message, /removed successfully/i);
    });

    it("should reject delete with invalid product ID format", async () => {
      const req: any = {
        params: { id: "invalid-id" },
      };
      const res = createMockResponse();

      await deleteProduct(req, res, () => {});

      assert.equal(res.statusCode, 400);
      assert.match(res.jsonData.message, /Invalid product ID/);
    });

    it("should return HTTP 404 when attempting to delete an already deactivated or non-existent product", async () => {
      // Returns null because { _id, isActive: true } is not found
      mock.method(Product, "findOneAndUpdate", async () => null);

      const req: any = {
        params: { id: validProductId },
      };
      const res = createMockResponse();

      await deleteProduct(req, res, () => {});

      assert.equal(res.statusCode, 404);
      assert.equal(res.jsonData.success, false);
      assert.match(res.jsonData.message, /Product not found or already removed/);
    });

    it("should exclude deactivated products (isActive: false) from public product listings", async () => {
      let queryFilterPassed: any = null;

      const mockQueryChain: any = {
        sort: mock.fn(() => mockQueryChain),
        skip: mock.fn(() => mockQueryChain),
        limit: mock.fn(() => mockQueryChain),
        lean: mock.fn(() =>
          Promise.resolve([
            { _id: "prod-1", name: "Active Shoes", isActive: true },
          ])
        ),
      };

      mock.method(Product, "find", (filter: any) => {
        queryFilterPassed = filter;
        return mockQueryChain;
      });

      mock.method(Product, "countDocuments", async () => 1);

      const req: any = {
        query: { page: "1", limit: "10" },
      };
      const res = createMockResponse();

      await getProducts(req, res, () => {});

      assert.equal(res.statusCode, 200);
      assert.equal(queryFilterPassed.isActive, true, "Public listing MUST filter by isActive: true");
      assert.equal(res.jsonData.data.length, 1);
      assert.equal(res.jsonData.data[0].isActive, true);
    });
  });
});

