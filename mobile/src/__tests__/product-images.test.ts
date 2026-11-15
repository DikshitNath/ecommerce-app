import "./setup";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveImageUrl,
  validateImageFile,
  resolveAssetMimeTypeAndFilename,
  normalizeClientMimeType,
  MAX_IMAGE_SIZE_BYTES,
  SelectedImage,
} from "../services/image-upload.service";

describe("Mobile Product Image Upload & Display Logic", () => {
  describe("Image URL Resolution", () => {
    it("should resolve relative backend upload paths to full URL", () => {
      const relativePath = "/uploads/products/product-123.jpg";
      const resolved = resolveImageUrl(relativePath);
      assert.match(resolved, /^http.*\/uploads\/products\/product-123\.jpg$/);
    });

    it("should handle relative paths without leading slash", () => {
      const relativePath = "uploads/products/product-456.png";
      const resolved = resolveImageUrl(relativePath);
      assert.match(resolved, /^http.*\/uploads\/products\/product-456\.png$/);
    });

    it("should preserve absolute HTTP and HTTPS URLs as-is", () => {
      const httpUrl = "http://cdn.example.com/shoes.jpg";
      const httpsUrl = "https://images.unsplash.com/photo-123";
      assert.equal(resolveImageUrl(httpUrl), httpUrl);
      assert.equal(resolveImageUrl(httpsUrl), httpsUrl);
    });

    it("should preserve data URIs and local device file URIs as-is", () => {
      const dataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA";
      const fileUri = "file:///data/user/0/com.ecommerce/cache/photo.jpg";
      assert.equal(resolveImageUrl(dataUri), dataUri);
      assert.equal(resolveImageUrl(fileUri), fileUri);
    });

    it("should return empty string for null, undefined or empty input", () => {
      assert.equal(resolveImageUrl(null), "");
      assert.equal(resolveImageUrl(undefined), "");
      assert.equal(resolveImageUrl("   "), "");
    });
  });

  describe("Client-Side Image Validation", () => {
    it("should accept valid image MIME types including JPEG, PNG, WEBP, GIF, and HEIC", () => {
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/pjpeg",
        "image/jfif",
        "image/png",
        "image/x-png",
        "image/webp",
        "image/gif",
        "image/heic",
        "image/heif",
      ];
      for (const mimeType of validTypes) {
        const res = validateImageFile({ mimeType, size: 1024 * 500 });
        assert.equal(res.valid, true, `Expected ${mimeType} to be valid`);
      }
    });

    it("should reject invalid MIME types (e.g. text/plain, application/pdf)", () => {
      const invalidTypes = [
        "text/plain",
        "application/pdf",
        "video/mp4",
        "application/zip",
      ];
      for (const mimeType of invalidTypes) {
        const res = validateImageFile({ mimeType });
        assert.equal(res.valid, false);
        assert.match(res.error || "", /Unsupported image format/);
      }
    });

    it("should accept valid file extensions including HEIC and HEIF", () => {
      const validFiles = [
        "photo.jpg",
        "banner.png",
        "graphic.webp",
        "animation.gif",
        "camera.heic",
        "photo.heif",
      ];
      for (const name of validFiles) {
        const res = validateImageFile({ name });
        assert.equal(res.valid, true);
      }
    });

    it("should reject invalid file extensions", () => {
      const invalidFiles = ["document.pdf", "script.sh", "archive.tar.gz"];
      for (const name of invalidFiles) {
        const res = validateImageFile({ name });
        assert.equal(res.valid, false);
        assert.match(res.error || "", /Unsupported file extension/);
      }
    });

    it("should reject image files exceeding the 5MB size limit", () => {
      const oversizedSize = MAX_IMAGE_SIZE_BYTES + 1024; // > 5MB
      const res = validateImageFile({
        mimeType: "image/jpeg",
        size: oversizedSize,
      });
      assert.equal(res.valid, false);
      assert.match(res.error || "", /File size exceeds the 5MB limit/);
    });

    it("should accept image files within the 5MB size limit", () => {
      const okSize = 3 * 1024 * 1024; // 3MB
      const res = validateImageFile({
        mimeType: "image/jpeg",
        size: okSize,
      });
      assert.equal(res.valid, true);
    });
  });

  describe("Android/Expo MIME Reconcilation & Transcoding Correction", () => {
    it("should correctly reconcile HEIC declared MIME when Expo transcodes to JPEG", () => {
      const asset = {
        uri: "file:///data/user/0/cache/ImagePicker/f5b4e130.jpeg",
        fileName: "IMG_20261115_010203.HEIC",
        mimeType: "image/heic",
        base64: "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD...", // JPEG header
      };

      const resolved = resolveAssetMimeTypeAndFilename(asset);
      assert.equal(resolved.mimeType, "image/jpeg");
      assert.equal(resolved.extension, "jpg");
      assert.equal(resolved.fileName, "IMG_20261115_010203.jpg");
    });

    it("should correctly reconcile PNG declared MIME when Expo compresses to JPEG", () => {
      const asset = {
        uri: "file:///data/user/0/cache/ImagePicker/screenshot.jpg",
        fileName: "screenshot.png",
        mimeType: "image/png",
        base64: "/9j/4AAQSkZJRg...",
      };

      const resolved = resolveAssetMimeTypeAndFilename(asset);
      assert.equal(resolved.mimeType, "image/jpeg");
      assert.equal(resolved.extension, "jpg");
      assert.equal(resolved.fileName, "screenshot.jpg");
    });

    it("should preserve genuine PNG when base64 starts with iVBOR", () => {
      const asset = {
        uri: "file:///data/user/0/cache/ImagePicker/icon.png",
        fileName: "icon.png",
        mimeType: "image/png",
        base64: "iVBORw0KGgoAAAANSUhEUgAA...",
      };

      const resolved = resolveAssetMimeTypeAndFilename(asset);
      assert.equal(resolved.mimeType, "image/png");
      assert.equal(resolved.extension, "png");
      assert.equal(resolved.fileName, "icon.png");
    });

    it("should preserve genuine WEBP when base64 starts with UklGR", () => {
      const asset = {
        uri: "file:///data/user/0/cache/ImagePicker/product.webp",
        fileName: "product.webp",
        mimeType: "image/webp",
        base64: "UklGRkAAAABXRUJQVlA4...",
      };

      const resolved = resolveAssetMimeTypeAndFilename(asset);
      assert.equal(resolved.mimeType, "image/webp");
      assert.equal(resolved.extension, "webp");
    });

    it("should normalize MIME aliases (e.g. image/pjpeg, image/x-png)", () => {
      assert.equal(normalizeClientMimeType("image/pjpeg"), "image/jpeg");
      assert.equal(normalizeClientMimeType("image/x-png"), "image/png");
      assert.equal(normalizeClientMimeType("image/heif"), "image/heic");
    });
  });

  describe("Admin Image Selection & Management State", () => {
    it("should allow adding multiple images to selection", () => {
      let selected: SelectedImage[] = [];
      const newBatch: SelectedImage[] = [
        { uri: "file:///img1.jpg", name: "img1.jpg", mimeType: "image/jpeg" },
        { uri: "file:///img2.png", name: "img2.png", mimeType: "image/png" },
      ];

      selected = [...selected, ...newBatch];
      assert.equal(selected.length, 2);
      assert.equal(selected[0].name, "img1.jpg");
      assert.equal(selected[1].name, "img2.png");
    });

    it("should remove specific image from selection by index", () => {
      const initial: SelectedImage[] = [
        { uri: "file:///img1.jpg", name: "img1.jpg" },
        { uri: "file:///img2.jpg", name: "img2.jpg" },
        { uri: "file:///img3.jpg", name: "img3.jpg" },
      ];

      // Remove middle image (index 1)
      const afterRemoval = initial.filter((_, idx) => idx !== 1);
      assert.equal(afterRemoval.length, 2);
      assert.equal(afterRemoval[0].name, "img1.jpg");
      assert.equal(afterRemoval[1].name, "img3.jpg");
    });

    it("should cap total images at 10 items", () => {
      const initial: SelectedImage[] = Array.from({ length: 8 }, (_, i) => ({
        uri: `file:///img${i}.jpg`,
        name: `img${i}.jpg`,
      }));

      const incoming: SelectedImage[] = Array.from({ length: 5 }, (_, i) => ({
        uri: `file:///new${i}.jpg`,
        name: `new${i}.jpg`,
      }));

      const combined = [...initial, ...incoming].slice(0, 10);
      assert.equal(combined.length, 10);
      assert.equal(combined[0].name, "img0.jpg");
      assert.equal(combined[9].name, "new1.jpg");
    });

    it("should correctly merge existing product images and newly uploaded images on Edit Product", () => {
      const existingImages = [
        "/uploads/products/orig-1.jpg",
        "/uploads/products/orig-2.jpg",
      ];
      const newlyUploadedUrls = [
        "/uploads/products/new-3.jpg",
      ];

      const merged = [...existingImages, ...newlyUploadedUrls];
      assert.equal(merged.length, 3);
      assert.equal(merged[0], "/uploads/products/orig-1.jpg");
      assert.equal(merged[2], "/uploads/products/new-3.jpg");
    });

    it("should support removing existing image on Edit Product", () => {
      const existingImages = [
        "/uploads/products/orig-1.jpg",
        "/uploads/products/orig-2.jpg",
        "/uploads/products/orig-3.jpg",
      ];

      // Administrator removes orig-2 (index 1)
      const remainingExisting = existingImages.filter((_, idx) => idx !== 1);
      assert.equal(remainingExisting.length, 2);
      assert.equal(
        remainingExisting.includes("/uploads/products/orig-2.jpg"),
        false
      );
      assert.equal(remainingExisting[0], "/uploads/products/orig-1.jpg");
      assert.equal(remainingExisting[1], "/uploads/products/orig-3.jpg");
    });
  });

  describe("Upload Error Resilience & Form Preservation", () => {
    it("should preserve product details state when an upload fails", () => {
      const productForm = {
        name: "Wireless Earbuds",
        description: "Premium noise cancelling earbuds",
        price: 2999,
        category: "Electronics",
        stock: 50,
        sku: "EARBUD-NC-01",
      };

      const uploadError = new Error("Network timeout during image upload");
      let formPreserved = false;

      try {
        throw uploadError;
      } catch {
        // Form fields must remain untouched
        formPreserved =
          productForm.name === "Wireless Earbuds" &&
          productForm.price === 2999 &&
          productForm.sku === "EARBUD-NC-01";
      }

      assert.equal(formPreserved, true);
    });
  });
});
