
import dotenv from "dotenv";
import connectDB from "./config/database";
import Product from "./models/product.model";
import { sampleProducts } from "./data/products";

dotenv.config();

const seedProducts = async () => {
  try {
    await connectDB();

    // Prevent duplicate sample products
    for (const product of sampleProducts) {
      await Product.updateOne(
        { sku: product.sku },
        { $setOnInsert: product },
        { upsert: true }
      );
    }

    console.log("Sample products seeded successfully");

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedProducts();
