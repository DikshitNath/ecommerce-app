
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Product from "../models/product.model";

// GET: View active products (Public)
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      search,
      category,
      page = "1",
      limit = "10",
    } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(50, Math.max(1, Number(limit) || 10));

    const filter: Record<string, unknown> = {
      isActive: true,
    };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.name = {
        $regex: String(search),
        $options: "i",
      };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean(),

      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET: View one active product (Public)
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const product = await Product.findOne({
      _id: id,
      isActive: true,
    }).lean();

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// POST: Create product (Admin only)
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      description,
      price,
      category,
      images = [],
      stock = 0,
      sku,
      variants = [],
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      typeof sku !== "string" ||
      !sku.trim() ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      !Array.isArray(images) ||
      !images.every((image: unknown) => typeof image === "string") ||
      !Array.isArray(variants)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid product data.",
      });
      return;
    }

    const normalizedSku = sku.trim().toUpperCase();

    const existingProduct = await Product.findOne({
      sku: normalizedSku,
    });

    if (existingProduct) {
      res.status(409).json({
        success: false,
        message: "A product with this SKU already exists.",
      });
      return;
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price,
      category: category.trim(),
      images,
      stock,
      sku: normalizedSku,
      variants,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: product,
    });
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: "A product with this SKU already exists.",
      });
      return;
    }

    next(error);
  }
};

// PUT: Update product (Admin only)
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
      return;
    }

    const allowedFields = [
      "name",
      "description",
      "price",
      "category",
      "images",
      "stock",
      "sku",
      "variants",
    ];

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
      return;
    }

    if (
      updates.name !== undefined &&
      (typeof updates.name !== "string" || !updates.name.trim())
    ) {
      res.status(400).json({
        success: false,
        message: "Product name must be a non-empty string.",
      });
      return;
    }

    if (
      updates.description !== undefined &&
      (typeof updates.description !== "string" ||
        !updates.description.trim())
    ) {
      res.status(400).json({
        success: false,
        message: "Product description must be a non-empty string.",
      });
      return;
    }

    if (
      updates.category !== undefined &&
      (typeof updates.category !== "string" || !updates.category.trim())
    ) {
      res.status(400).json({
        success: false,
        message: "Product category must be a non-empty string.",
      });
      return;
    }

    if (
      updates.price !== undefined &&
      (!Number.isFinite(updates.price) ||
        Number(updates.price) < 0)
    ) {
      res.status(400).json({
        success: false,
        message: "Price must be a valid non-negative number.",
      });
      return;
    }

    if (
      updates.stock !== undefined &&
      (!Number.isInteger(updates.stock) ||
        Number(updates.stock) < 0)
    ) {
      res.status(400).json({
        success: false,
        message: "Stock must be a non-negative integer.",
      });
      return;
    }

    if (
      updates.images !== undefined &&
      (!Array.isArray(updates.images) ||
        !updates.images.every(
          (image: unknown) => typeof image === "string"
        ))
    ) {
      res.status(400).json({
        success: false,
        message: "Images must be an array of strings.",
      });
      return;
    }

    if (
      updates.variants !== undefined &&
      !Array.isArray(updates.variants)
    ) {
      res.status(400).json({
        success: false,
        message: "Variants must be an array.",
      });
      return;
    }

    if (updates.sku !== undefined) {
      if (
        typeof updates.sku !== "string" ||
        !updates.sku.trim()
      ) {
        res.status(400).json({
          success: false,
          message: "SKU must be a non-empty string.",
        });
        return;
      }

      updates.sku = updates.sku.trim().toUpperCase();
    }

    if (typeof updates.name === "string") {
      updates.name = updates.name.trim();
    }

    if (typeof updates.description === "string") {
      updates.description = updates.description.trim();
    }

    if (typeof updates.category === "string") {
      updates.category = updates.category.trim();
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: product,
    });
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: "A product with this SKU already exists.",
      });
      return;
    }

    next(error);
  }
};

// DELETE: Soft-delete product (Admin only)
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
      return;
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: { isActive: false } },
      { new: true, runValidators: true }
    );

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found or already removed.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product removed successfully.",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
