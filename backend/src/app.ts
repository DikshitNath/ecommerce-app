
import express from "express";
import cors from "cors";
import productRoutes from "./routes/product.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "E-Commerce API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/products", productRoutes);

export default app;
