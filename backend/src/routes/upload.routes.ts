import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import {
  uploadProductImages,
  deleteProductImage,
  MAX_FILE_SIZE,
  MAX_IMAGES_COUNT,
} from "../controllers/upload.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";

const router = Router();

// Configure Multer for in-memory buffer storage (buffers are directly streamed to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_IMAGES_COUNT,
  },
});

const handleMultipartUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const contentType = req.headers["content-type"] || "";

  // If request is not multipart/form-data (e.g. application/json base64), pass through to controller
  if (!contentType.includes("multipart/form-data")) {
    next();
    return;
  }

  // Handle multipart form data
  upload.array("images", MAX_IMAGES_COUNT)(req, res, (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
          success: false,
          message: "File too large. Maximum size is 5MB per image.",
        });
        return;
      }

      if (
        err.code === "LIMIT_UNEXPECTED_FILE" ||
        err.code === "LIMIT_FILE_COUNT"
      ) {
        res.status(400).json({
          success: false,
          message: `Cannot upload more than ${MAX_IMAGES_COUNT} images at once.`,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: err.message || "Failed to process multipart image upload.",
      });
      return;
    }

    next();
  });
};

// POST /api/upload/images - Admin only
router.post(
  "/images",
  authenticate,
  requireAdmin,
  handleMultipartUpload,
  uploadProductImages
);

// POST /api/upload - Admin only
router.post(
  "/",
  authenticate,
  requireAdmin,
  handleMultipartUpload,
  uploadProductImages
);

// DELETE /api/upload/images - Admin only
router.delete("/images", authenticate, requireAdmin, deleteProductImage);

// DELETE /api/upload - Admin only
router.delete("/", authenticate, requireAdmin, deleteProductImage);

// DELETE /api/upload/:publicId or /{*publicId} - Admin only (Express 5 wildcard syntax)
router.delete("/{*publicId}", authenticate, requireAdmin, deleteProductImage);

export default router;
