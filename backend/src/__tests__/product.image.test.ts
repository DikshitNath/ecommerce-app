import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Product from "../models/product.model";
import User from "../models/user.model";
import {
  uploadProductImages,
  deleteProductImage,
  detectImageMimeType,
  normalizeMimeType,
} from "../controllers/upload.controller";
import {
  createProduct,
  updateProduct,
  getProductById,
} from "../controllers/product.controller";
import { requireAdmin } from "../middleware/admin.middleware";
import { cloudinaryService } from "../services/cloudinary.service";

describe("Product Image Upload & Cloudinary Management", () => {
  const validAdminId = "507f1f77bcf86cd799439011";
  const validCustomerId = "507f1f77bcf86cd799439022";
  const validProductId = "507f1f77bcf86cd799439033";

  // Sample image buffers
  const samplePngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  ]);
  const samplePngBase64 = samplePngBuffer.toString("base64");

  const sampleJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00,
  ]);
  const sampleJpegBase64 = sampleJpegBuffer.toString("base64");

  const sampleWebpBuffer = Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    0x56, 0x50, 0x38, 0x20, 0x18, 0x00, 0x00, 0x00,
  ]);
  const sampleWebpBase64 = sampleWebpBuffer.toString("base64");

  const sampleGifBuffer = Buffer.from([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
  ]);

  const sampleHeicBuffer = Buffer.from([
    0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63,
    0x00, 0x00, 0x00, 0x00, 0x6d, 0x69, 0x66, 0x31,
  ]);
  const sampleHeicBase64 = sampleHeicBuffer.toString("base64");

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

  const setupCloudinaryMock = (customUrlPrefix = "https://res.cloudinary.com/demo/image/upload/v1234567890/shopease/products/") => {
    mock.method(cloudinaryService, "isCloudinaryConfigured", () => true);
    mock.method(
      cloudinaryService,
      "uploadToCloudinary",
      async (buffer: Buffer, options: any) => {
        const publicId = options?.publicId || `product-${Date.now()}`;
        const fullPublicId = `shopease/products/${publicId}`;
        const secureUrl = `${customUrlPrefix}${publicId}.jpg`;
        return {
          url: secureUrl,
          secure_url: secureUrl,
          public_id: fullPublicId,
          format: "jpg",
          bytes: buffer.length,
        };
      }
    );
    mock.method(cloudinaryService, "deleteFromCloudinary", async (publicId: string) => {
      return { result: "ok" };
    });
  };

  beforeEach(() => {
    setupCloudinaryMock();
  });

  afterEach(() => {
    mock.reset();
  });

  describe("Image Signature & MIME Type Detection", () => {
    it("should correctly identify PNG image signature", () => {
      assert.equal(detectImageMimeType(samplePngBuffer), "image/png");
    });

    it("should correctly identify JPEG image signature", () => {
      assert.equal(detectImageMimeType(sampleJpegBuffer), "image/jpeg");
    });

    it("should correctly identify WEBP image signature", () => {
      assert.equal(detectImageMimeType(sampleWebpBuffer), "image/webp");
    });

    it("should correctly identify GIF image signature", () => {
      assert.equal(detectImageMimeType(sampleGifBuffer), "image/gif");
    });

    it("should correctly identify HEIC image signature", () => {
      assert.equal(detectImageMimeType(sampleHeicBuffer), "image/heic");
    });

    it("should return null for non-image or corrupted buffer", () => {
      const textBuffer = Buffer.from("Not an image file at all!");
      assert.equal(detectImageMimeType(textBuffer), null);
    });

    it("should normalize common MIME aliases", () => {
      assert.equal(normalizeMimeType("image/jpg"), "image/jpeg");
      assert.equal(normalizeMimeType("image/pjpeg"), "image/jpeg");
      assert.equal(normalizeMimeType("image/jfif"), "image/jpeg");
      assert.equal(normalizeMimeType("image/x-png"), "image/png");
      assert.equal(normalizeMimeType("image/x-webp"), "image/webp");
      assert.equal(normalizeMimeType("image/heif"), "image/heic");
      assert.equal(normalizeMimeType("image/heic-sequence"), "image/heic");
    });
  });

  describe("MIME Normalization & Transcoding Reconciliation", () => {
    it("should accept and reconcile image/heic declared type when Android/Expo transcoded to JPEG", async () => {
      const req: any = {
        body: {
          images: [
            {
              base64: sampleJpegBase64,
              name: "camera_photo.heic",
              mimeType: "image/heic",
            },
          ],
        },
      };
      const res = createMockResponse();

      await uploadProductImages(req, res, () => {});

      assert.equal(res.statusCode, 201);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.data[0].mimeType, "image/jpeg");
      assert.match(res.jsonData.data[0].url, /^https:\/\/res\.cloudinary\.com\//);
      assert.match(res.jsonData.urls[0], /^https:\/\/res\.cloudinary\.com\//);
    });

    it("should accept and reconcile image/png declared type when Android/Expo compressed to JPEG", async () => {
      const req: any = {
        body: {
          images: [
            {
              base64: sampleJpegBase64,
              name: "screenshot.png",
              mimeType: "image/png",
            },
          ],
        },
      };
      const res = createMockResponse();

      await uploadProductImages(req, res, () => {});

      assert.equal(res.statusCode, 201);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.data[0].mimeType, "image/jpeg");
      assert.match(res.jsonData.urls[0], /^https:\/\/res\.cloudinary\.com\//);
    });

    it("should accept image/pjpeg and image/jpg aliases for JPEG images", async () => {
      const req: any = {
        body: {
          images: [
            {
              base64: sampleJpegBase64,
              name: "product.jpg",
              mimeType: "image/pjpeg",
            },
          ],
        },
      };
      const res = createMockResponse();

      await uploadProductImages(req, res, () => {});

      assert.equal(res.statusCode, 201);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.data[0].mimeType, "image/jpeg");
    });

    it("should accept genuine HEIC images", async () => {
      const req: any = {
        body: {
          images: [
            {
              base64: sampleHeicBase64,
              name: "portrait.heic",
              mimeType: "image/heic",
            },
          ],
        },
      };
      const res = createMockResponse();

      await uploadProductImages(req, res, () => {});

      assert.equal(res.statusCode, 201);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.data[0].mimeType, "image/heic");
    });

    it("should reject incompatible declared vs detected formats (e.g. declared image/gif but buffer is PNG)", async () => {
      const req: any = {
        body: {
          images: [
            {
              base64: samplePngBase64,
              name: "animation.gif",
              mimeType: "image/gif",
            },
          ],
        },
      };
      const res = createMockResponse();

      await uploadProductImages(req, res, () => {});

      assert.equal(res.statusCode, 400);
      assert.equal(res.jsonData.success, false);
      assert.match(res.jsonData.message, /Declared MIME type \(image\/gif\) does not match/);
    });

    it("should reject non-image declared MIME types (e.g. application/pdf, text/plain)", async () => {
      const req: any = {
        body: {
          images: [
            {
              base64: sampleJpegBase64,
              name: "document.pdf",
              mimeType: "application/pdf",
            },
          ],
        },
      };
      const res = createMockResponse();

      await uploadProductImages(req, res, () => {});

      assert.equal(res.statusCode, 400);
      assert.equal(res.jsonData.success, false);
      assert.match(res.jsonData.message, /Unsupported or invalid declared MIME type/);
    });
  });

  describe("Cloudinary Upload Execution & Error Handling", () => {
    it("should return HTTP 500 when Cloudinary credentials are missing", async () => {
      mock.method(cloudinaryService, "isCloudinaryConfigured", () => false);

      const req: any = {
        body: {
          images: [{ base64: sampleJpegBase64, mimeType: "image/jpeg" }],
        },
      };
      const res = createMockResponse();

      await uploadProductImages(req, res, () => {});

      assert.equal(res.statusCode, 500);
      assert.equal(res.jsonData.success, false);
      assert.match(res.jsonData.message, /Cloudinary credentials .* are not configured/);
    });

    it("should return HTTP 500 when Cloudinary upload stream fails", async () => {
      mock.method(cloudinaryService, "uploadToCloudinary", async () => {
        throw new Error("Cloudinary API quota exceeded");
      });

      const req: any = {
        body: {
          images: [{ base64: sampleJpegBase64, mimeType: "image/jpeg" }],
        },
      };
      const res = createMockResponse();

      await uploadProductImages(req, res, () => {});

      assert.equal(res.statusCode, 500);
      assert.equal(res.jsonData.success, false);
      assert.match(res.jsonData.message, /Cloudinary upload failed: Cloudinary API quota exceeded/);
    });

    it("should successfully upload a single image to Cloudinary and return HTTPS secure_url", async () => {
      const req: any = {
        body: {
          images: [
            {
              base64: `data:image/png;base64,${samplePngBase64}`,
              name: "shoe.png",
              mimeType: "image/png",
            },
          ],
        },
      };
      const res = createMockResponse();

      await uploadProductImages(req, res, () => {});

      assert.equal(res.statusCode, 201);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.data.length, 1);
      assert.equal(res.jsonData.data[0].mimeType, "image/png");
      assert.match(res.jsonData.data[0].url, /^https:\/\/res\.cloudinary\.com\//);
      assert.match(res.jsonData.data[0].path, /^https:\/\/res\.cloudinary\.com\//);
      assert.equal(res.jsonData.urls[0], res.jsonData.data[0].url);
      assert.match(res.jsonData.data[0].publicId, /^shopease\/products\//);
    });

    it("should successfully upload multiple images with mixed formats to Cloudinary", async () => {
      const req: any = {
        body: {
          images: [
            { base64: sampleJpegBase64, mimeType: "image/jpeg" },
            { base64: samplePngBase64, mimeType: "image/png" },
            { base64: sampleWebpBase64, mimeType: "image/webp" },
          ],
        },
      };
      const res = createMockResponse();

      await uploadProductImages(req, res, () => {});

      assert.equal(res.statusCode, 201);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.data.length, 3);
      assert.equal(res.jsonData.urls.length, 3);
      for (const item of res.jsonData.data) {
        assert.match(item.url, /^https:\/\/res\.cloudinary\.com\//);
        assert.match(item.publicId, /^shopease\/products\//);
      }
    });

    it("should successfully upload via multipart FormData (req.files)", async () => {
      const req: any = {
        files: [
          {
            buffer: sampleJpegBuffer,
            originalname: "gallery-photo.jpg",
            mimetype: "image/jpeg",
            size: sampleJpegBuffer.length,
          },
          {
            buffer: samplePngBuffer,
            originalname: "gallery-badge.png",
            mimetype: "image/png",
            size: samplePngBuffer.length,
          },
        ],
        body: {},
      };
      const res = createMockResponse();

      await uploadProductImages(req, res, () => {});

      assert.equal(res.statusCode, 201);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.data.length, 2);
      assert.equal(res.jsonData.urls.length, 2);
      assert.match(res.jsonData.urls[0], /^https:\/\/res\.cloudinary\.com\//);
      assert.match(res.jsonData.urls[1], /^https:\/\/res\.cloudinary\.com\//);
    });
  });

  describe("Upload Validation Limits", () => {
    it("should reject upload when no images are provided", async () => {
      const req: any = { body: {} };
      const res = createMockResponse();

      await uploadProductImages(req, res, () => {});

      assert.equal(res.statusCode, 400);
      assert.equal(res.jsonData.success, false);
      assert.equal(res.jsonData.message, "No images provided for upload.");
    });

    it("should reject invalid file types (e.g. plain text)", async () => {
      const textBase64 = Buffer.from("not an image").toString("base64");
      const req: any = {
        body: {
          images: [{ base64: textBase64, mimeType: "text/plain" }],
        },
      };
      const res = createMockResponse();

      await uploadProductImages(req, res, () => {});

      assert.equal(res.statusCode, 400);
      assert.equal(res.jsonData.success, false);
      assert.match(res.jsonData.message, /Unsupported or invalid declared MIME type|Invalid file type/);
    });

    it("should reject file exceeding 5MB size limit", async () => {
      const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0x41);
      const largeBase64 = largeBuffer.toString("base64");

      const req: any = {
        body: {
          images: [{ base64: largeBase64, mimeType: "image/jpeg" }],
        },
      };
      const res = createMockResponse();

      await uploadProductImages(req, res, () => {});

      assert.equal(res.statusCode, 400);
      assert.equal(res.jsonData.success, false);
      assert.match(res.jsonData.message, /File too large/);
    });

    it("should reject batch containing more than 10 images", async () => {
      const items = Array.from({ length: 11 }, () => ({
        base64: samplePngBase64,
        mimeType: "image/png",
      }));

      const req: any = { body: { images: items } };
      const res = createMockResponse();

      await uploadProductImages(req, res, () => {});

      assert.equal(res.statusCode, 400);
      assert.equal(res.jsonData.success, false);
      assert.match(res.jsonData.message, /Cannot upload more than 10 images/);
    });
  });

  describe("Admin Authorization on Upload Endpoint", () => {
    it("should reject customer request with HTTP 403 Forbidden", async () => {
      mock.method(User, "findById", () => ({
        select: mock.fn(() => Promise.resolve({ _id: validCustomerId, role: "customer" })),
      }));

      const req: any = { user: { userId: validCustomerId } };
      const res = createMockResponse();
      let nextCalled = false;

      await requireAdmin(req, res, () => {
        nextCalled = true;
      });

      assert.equal(res.statusCode, 403);
      assert.equal(nextCalled, false);
      assert.equal(res.jsonData.message, "Admin access required.");
    });

    it("should permit admin request to proceed to upload handler", async () => {
      mock.method(User, "findById", () => ({
        select: mock.fn(() => Promise.resolve({ _id: validAdminId, role: "admin" })),
      }));

      const req: any = { user: { userId: validAdminId } };
      const res = createMockResponse();
      let nextCalled = false;

      await requireAdmin(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
      assert.equal(res.statusCode, 200);
    });
  });

  describe("Cloudinary Image Deletion & Cleanup", () => {
    it("should successfully delete an unreferenced image by publicId", async () => {
      mock.method(Product, "findOne", async () => null);

      let destroyedId = "";
      mock.method(cloudinaryService, "deleteFromCloudinary", async (publicId: string) => {
        destroyedId = publicId;
        return { result: "ok" };
      });

      const req: any = {
        body: { publicId: "shopease/products/unused-photo" },
      };
      const res = createMockResponse();

      await deleteProductImage(req, res, () => {});

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.equal(destroyedId, "shopease/products/unused-photo");
    });

    it("should successfully delete an unreferenced image by full Cloudinary URL", async () => {
      mock.method(Product, "findOne", async () => null);

      let destroyedId = "";
      mock.method(cloudinaryService, "deleteFromCloudinary", async (publicId: string) => {
        destroyedId = publicId;
        return { result: "ok" };
      });

      const req: any = {
        body: {
          url: "https://res.cloudinary.com/demo/image/upload/v12345/shopease/products/sample-shoe.jpg",
        },
      };
      const res = createMockResponse();

      await deleteProductImage(req, res, () => {});

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.equal(destroyedId, "shopease/products/sample-shoe");
    });

    it("should reject deletion with HTTP 409 if image is still referenced by an active product", async () => {
      mock.method(Product, "findOne", async () => ({
        _id: new mongoose.Types.ObjectId(validProductId),
        name: "Pro Basketball Shoes",
        sku: "PRO-SHOE-01",
        images: ["https://res.cloudinary.com/demo/image/upload/shopease/products/active-shoe.jpg"],
        isActive: true,
      }));

      const req: any = {
        body: { publicId: "shopease/products/active-shoe" },
      };
      const res = createMockResponse();

      await deleteProductImage(req, res, () => {});

      assert.equal(res.statusCode, 409);
      assert.equal(res.jsonData.success, false);
      assert.match(res.jsonData.message, /Cannot delete image: it is still referenced by active product/);
    });

    it("should reject deletion with HTTP 400 if publicId does not belong to shopease/products/", async () => {
      const req: any = {
        body: { publicId: "other_folder/sensitive_asset" },
      };
      const res = createMockResponse();

      await deleteProductImage(req, res, () => {});

      assert.equal(res.statusCode, 400);
      assert.equal(res.jsonData.success, false);
      assert.match(res.jsonData.message, /Target must be a Cloudinary product image/);
    });

    it("should return HTTP 500 on deletion if Cloudinary credentials are not configured", async () => {
      mock.method(Product, "findOne", async () => null);
      mock.method(cloudinaryService, "isCloudinaryConfigured", () => false);

      const req: any = {
        body: { publicId: "shopease/products/unused-photo" },
      };
      const res = createMockResponse();

      await deleteProductImage(req, res, () => {});

      assert.equal(res.statusCode, 500);
      assert.equal(res.jsonData.success, false);
      assert.match(res.jsonData.message, /Cloudinary credentials .* are not configured/);
    });
  });

  describe("Product Persistence & URL Backward Compatibility", () => {
    it("should persist Cloudinary secure_url in Product document on creation", async () => {
      mock.method(Product, "findOne", async () => null);

      let createdProduct: any = null;
      mock.method(Product, "create", async (data: any) => {
        createdProduct = {
          _id: new mongoose.Types.ObjectId(validProductId),
          ...data,
        };
        return createdProduct;
      });

      const cloudinaryUrls = [
        "https://res.cloudinary.com/demo/image/upload/v1234/shopease/products/shoe-front.jpg",
        "https://res.cloudinary.com/demo/image/upload/v1234/shopease/products/shoe-side.jpg",
      ];

      const req: any = {
        body: {
          name: "Smart Running Shoes",
          description: "Lightweight and breathable running sneakers",
          price: 2499,
          category: "Shoes",
          stock: 30,
          sku: "RUN-SHOE-01",
          images: cloudinaryUrls,
          variants: [{ name: "Size", options: ["8", "9", "10"] }],
        },
      };
      const res = createMockResponse();

      await createProduct(req, res, () => {});

      assert.equal(res.statusCode, 201);
      assert.equal(res.jsonData.success, true);
      assert.deepEqual(createdProduct.images, cloudinaryUrls);
    });

    it("should support existing legacy /uploads/ and external Unsplash image URLs without errors", async () => {
      let storedImages = [
        "/uploads/products/legacy-shoe.jpg",
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
      ];

      mock.method(Product, "findOneAndUpdate", async (filter: any, updateQuery: any) => {
        if (updateQuery.$set?.images !== undefined) {
          storedImages = updateQuery.$set.images;
        }
        return {
          _id: new mongoose.Types.ObjectId(validProductId),
          name: "Smart Running Shoes",
          images: storedImages,
          isActive: true,
        };
      });

      // Administrator appends a new Cloudinary image to existing mixed images
      const updatedSet = [
        ...storedImages,
        "https://res.cloudinary.com/demo/image/upload/shopease/products/new-photo.jpg",
      ];

      const req: any = {
        params: { id: validProductId },
        body: { images: updatedSet },
      };
      const res = createMockResponse();

      await updateProduct(req, res, () => {});

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.deepEqual(res.jsonData.data.images, updatedSet);
      assert.equal(res.jsonData.data.images.length, 3);
    });

    it("should handle missing images on public product retrieval gracefully", async () => {
      mock.method(Product, "findOne", () => ({
        lean: mock.fn(async () => ({
          _id: new mongoose.Types.ObjectId(validProductId),
          name: "Shoe without images",
          images: [],
          price: 1999,
          stock: 10,
          isActive: true,
        })),
      }));

      const req: any = { params: { id: validProductId } };
      const res = createMockResponse();

      await getProductById(req, res, () => {});

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.equal(Array.isArray(res.jsonData.data.images), true);
      assert.equal(res.jsonData.data.images.length, 0);
    });
  });
});
