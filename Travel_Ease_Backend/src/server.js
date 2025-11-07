import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { blogRoutes } from "./routes/blogRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/blogs", blogRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});