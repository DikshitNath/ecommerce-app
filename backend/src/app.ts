
import express from "express";
import cors from "cors";
import path from "node:path";
import productRoutes from "./routes/product.routes";
import orderRoutes from "./routes/order.routes";
import paymentRoutes from "./routes/payment.routes";
import authRoutes from "./routes/auth.routes";
import uploadRoutes from "./routes/upload.routes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static uploaded product images
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "E-Commerce API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);

export default app;
