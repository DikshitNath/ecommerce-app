import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import Product from "../models/product.model";
import { cloudinaryService } from "../services/cloudinary.service";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGES_COUNT = 10;

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
]);

export const ALLOWED_DECLARED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/jfif",
  "image/png",
  "image/x-png",
  "image/webp",
  "image/x-webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

/**
 * Normalizes common MIME type aliases to canonical MIME types
 */
export function normalizeMimeType(mime?: string | null): string | null {
  if (!mime || typeof mime !== "string") return null;
  const lower = mime.trim().toLowerCase();
  switch (lower) {
    case "image/jpg":
    case "image/jpeg":
    case "image/pjpeg":
    case "image/jfif":
      return "image/jpeg";
    case "image/png":
    case "image/x-png":
      return "image/png";
    case "image/webp":
    case "image/x-webp":
      return "image/webp";
    case "image/gif":
      return "image/gif";
    case "image/heic":
    case "image/heif":
    case "image/heic-sequence":
    case "image/heif-sequence":
      return "image/heic";
    default:
      return lower;
  }
}

/**
 * Validates image buffer using magic bytes signatures
 * Supports JPEG, PNG, GIF, WEBP, and HEIC/HEIF
 */
export function detectImageMimeType(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  // GIF: 47 49 46 38 ('GIF8')
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif";
  }

  // WEBP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  // HEIC/HEIF: ....ftyp (heic, heix, heim, heis, mif1, msf1)
  if (
    buffer.length >= 12 &&
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    const brand = buffer.toString("ascii", 8, 12).toLowerCase();
    if (
      brand === "heic" ||
      brand === "heix" ||
      brand === "heim" ||
      brand === "heis" ||
      brand === "mif1" ||
      brand === "msf1"
    ) {
      return "image/heic";
    }
  }

  return null;
}

/**
 * Returns canonical file extension for an authoritative MIME type
 */
export function getExtensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/heic":
      return "heic";
    case "image/jpeg":
    default:
      return "jpg";
  }
}

/**
 * Handles product image uploads directly to Cloudinary
 * Accessible only by administrators with requireAdmin middleware
 */
export const uploadProductImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check Cloudinary credentials
    if (!cloudinaryService.isCloudinaryConfigured()) {
      res.status(500).json({
        success: false,
        message:
          "Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured.",
      });
      return;
    }

    const itemsToProcess: Array<{
      buffer: Buffer;
      originalName?: string;
      declaredMimeType?: string;
      size: number;
    }> = [];

    // 1. Process files from multipart/form-data upload (Multer memory storage)
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const files = req.files as Express.Multer.File[];
      for (const file of files) {
        itemsToProcess.push({
          buffer: file.buffer,
          originalName: file.originalname,
          declaredMimeType: file.mimetype,
          size: file.size,
        });
      }
    }
    // 2. Process JSON base64 upload payload
    else if (req.body && (req.body.images || req.body.base64 || req.body.image)) {
      let rawBase64Items: any[] = [];

      if (Array.isArray(req.body.images)) {
        rawBase64Items = req.body.images;
      } else if (req.body.base64 || req.body.data) {
        rawBase64Items = [req.body];
      } else if (typeof req.body.image === "string") {
        rawBase64Items = [req.body.image];
      }

      for (let i = 0; i < rawBase64Items.length; i++) {
        const item = rawBase64Items[i];
        let base64String = "";
        let declaredMimeType: string | undefined;
        let originalName: string | undefined;

        if (typeof item === "string") {
          base64String = item;
        } else if (typeof item === "object" && item !== null) {
          const obj = item as any;
          base64String = obj.base64 || obj.data || "";
          declaredMimeType = obj.mimeType || obj.type;
          originalName = obj.name || obj.filename;
        }

        if (!base64String || typeof base64String !== "string") {
          res.status(400).json({
            success: false,
            message: `Image at index ${i} is missing valid base64 data.`,
          });
          return;
        }

        // Check for data URI prefix, e.g. data:image/jpeg;base64,...
        const match = base64String.match(
          /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/
        );
        if (match) {
          declaredMimeType = match[1].toLowerCase();
          base64String = match[2];
        }

        let buffer: Buffer;
        try {
          buffer = Buffer.from(base64String, "base64");
        } catch {
          res.status(400).json({
            success: false,
            message: `Invalid base64 encoding at index ${i}.`,
          });
          return;
        }

        itemsToProcess.push({
          buffer,
          originalName,
          declaredMimeType,
          size: buffer.length,
        });
      }
    }

    if (itemsToProcess.length === 0) {
      res.status(400).json({
        success: false,
        message: "No images provided for upload.",
      });
      return;
    }

    if (itemsToProcess.length > MAX_IMAGES_COUNT) {
      res.status(400).json({
        success: false,
        message: `Cannot upload more than ${MAX_IMAGES_COUNT} images at once.`,
      });
      return;
    }

    const savedFiles: Array<{
      filename: string;
      path: string;
      url: string;
      size: number;
      mimeType: string;
      publicId: string;
    }> = [];

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      const buffer = item.buffer;

      if (!buffer || buffer.length === 0) {
        res.status(400).json({
          success: false,
          message: `Image at index ${i} is empty.`,
        });
        return;
      }

      if (buffer.length > MAX_FILE_SIZE) {
        res.status(400).json({
          success: false,
          message: `File too large at index ${i}. Maximum size is 5MB per image.`,
        });
        return;
      }

      // Step 1: Detect actual authoritative MIME type from binary file signature
      const detectedMime = detectImageMimeType(buffer);
      if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
        res.status(400).json({
          success: false,
          message: `Invalid file type at index ${i}. Only JPEG, PNG, WEBP, GIF, and HEIC images are allowed.`,
        });
        return;
      }

      // Step 2: Validate declared MIME type (if provided by client / Android MediaStore)
      if (item.declaredMimeType) {
        const normDeclared = normalizeMimeType(item.declaredMimeType);

        // Reject non-image or dangerous declared types (e.g. text/plain, application/pdf, etc.)
        if (!normDeclared || !ALLOWED_DECLARED_MIME_TYPES.has(normDeclared)) {
          res.status(400).json({
            success: false,
            message: `Unsupported or invalid declared MIME type (${item.declaredMimeType}) at index ${i}.`,
          });
          return;
        }

        // Handle MIME mismatch:
        // Case A: Normalized declared matches detected -> OK
        // Case B: Mobile transcoding: Android/Expo commonly transcode HEIC/HEIF/PNG/WEBP to JPEG during picking/compression.
        // If detected is "image/jpeg" and declared is an allowed image format (e.g. image/heic, image/png, image/webp),
        // the file is an authentic transcoded JPEG image.
        const isCompatibleTranscoding =
          detectedMime === "image/jpeg" &&
          ["image/heic", "image/png", "image/webp"].includes(normDeclared);

        if (normDeclared !== detectedMime && !isCompatibleTranscoding) {
          res.status(400).json({
            success: false,
            message: `Declared MIME type (${item.declaredMimeType}) does not match file contents at index ${i}.`,
          });
          return;
        }
      }

      // Authoritative MIME type is derived from the verified file signature
      const authoritativeMime = detectedMime;
      const ext = getExtensionForMimeType(authoritativeMime);
      const uniqueId = crypto.randomBytes(8).toString("hex");
      const publicId = `product-${Date.now()}-${uniqueId}`;

      let uploadResult;
      try {
        uploadResult = await cloudinaryService.uploadToCloudinary(buffer, {
          folder: "shopease/products",
          publicId,
        });
      } catch (cloudError: any) {
        res.status(500).json({
          success: false,
          message: `Cloudinary upload failed: ${
            cloudError?.message || "Unknown error during cloud upload."
          }`,
        });
        return;
      }

      savedFiles.push({
        filename: `${publicId}.${ext}`,
        path: uploadResult.secure_url,
        url: uploadResult.secure_url,
        size: buffer.length,
        mimeType: authoritativeMime,
        publicId: uploadResult.public_id,
      });
    }

    res.status(201).json({
      success: true,
      message: `${savedFiles.length} image(s) uploaded successfully.`,
      data: savedFiles,
      urls: savedFiles.map((f) => f.url),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin-only endpoint to delete a product image from Cloudinary
 * Prevents deleting images still referenced by active products.
 */
export const deleteProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let rawTarget: any =
      req.body?.publicId ||
      req.body?.url ||
      req.params?.publicId ||
      req.query?.publicId ||
      req.query?.url;

    if (Array.isArray(rawTarget)) {
      rawTarget = rawTarget.join("/");
    }

    if (!rawTarget || typeof rawTarget !== "string" || !rawTarget.trim()) {
      res.status(400).json({
        success: false,
        message:
          "Invalid request: please provide a Cloudinary publicId or image URL.",
      });
      return;
    }

    const publicId = cloudinaryService.extractPublicIdFromUrl(rawTarget.trim());

    if (!publicId) {
      res.status(400).json({
        success: false,
        message:
          "Invalid or unsupported image identifier. Target must be a Cloudinary product image under shopease/products/.",
      });
      return;
    }

    // Check if image is still referenced by any active product in MongoDB
    const escapedId = publicId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const referencingProduct = await Product.findOne({
      images: { $regex: escapedId },
      isActive: true,
    });

    if (referencingProduct) {
      res.status(409).json({
        success: false,
        message: `Cannot delete image: it is still referenced by active product "${referencingProduct.name}" (SKU: ${referencingProduct.sku}).`,
      });
      return;
    }

    if (!cloudinaryService.isCloudinaryConfigured()) {
      res.status(500).json({
        success: false,
        message:
          "Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured.",
      });
      return;
    }

    const deleteResult = await cloudinaryService.deleteFromCloudinary(publicId);

    res.status(200).json({
      success: true,
      message: "Image deleted successfully from Cloudinary.",
      publicId,
      result: deleteResult.result,
    });
  } catch (error) {
    next(error);
  }
};
