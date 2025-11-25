import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  travel_plan_routes,
  user_routes,
  config_routes,
  utils_routes,
  business_routes,
} from "./routes/index.js";
import map_routes from "./routes/map_routes.js";
import { blogRoutes } from "./src/routes/blogRoutes.js";
import { errorHandler } from "./src/middleware/errorHandler.js";

const app = express();
const PORT = 3001; // Unified server port

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/travel_plan", travel_plan_routes);
app.use("/api/user", user_routes);
app.use("/api/utils", utils_routes);
app.use("/api/config", config_routes);
app.use("/api/business", business_routes);
app.use("/api/blogs", blogRoutes);
app.use("/api", map_routes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

// Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
