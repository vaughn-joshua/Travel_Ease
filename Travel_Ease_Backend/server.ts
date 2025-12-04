import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import {
  travel_plan_routes,
  user_routes,
  config_routes,
  utils_routes,
  business_routes,
} from "./routes/index.js";
import map_routes from "./routes/map_routes.js";
import review_routes from "./routes/review_routes.js";
import { blogRoutes } from "./src/routes/blogRoutes.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import { prisma } from "./src/lib/prisma.js";

async function testConnection(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set; skipping database connectivity check.");
    return false;
  }

  try {
    // Add timeout to prevent hanging on unreachable database
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Connection test timeout")), 5000)
    );

    await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);
    return true;
  } catch (error) {
    console.error(
      "Database connection test failed:",
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(
  "/api/travel_plan",
  (req, res, next) => {
    console.log("Travel plan route accessed");
    next();
  },
  travel_plan_routes
);
app.use("/api/user", user_routes);
app.use("/api/utils", utils_routes);
app.use("/api/config", config_routes);
app.use("/api/business", business_routes);
app.use("/api/blogs", blogRoutes);
app.use("/api/reviews", review_routes);
app.use("/api/map", map_routes);

// Health check with database status
app.get("/api/health", async (req: Request, res: Response) => {
  let dbStatus = "unknown";
  try {
    const connected = await testConnection();
    dbStatus = connected ? "connected" : "disconnected";
  } catch (e) {
    dbStatus = "error";
  }

  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    port: PORT,
    database: dbStatus,
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// Server startup with database connection test
async function startServer(): Promise<void> {
  console.log("Testing database connection...");
  const dbConnected = await testConnection();

  if (!dbConnected) {
    console.warn(
      "Warning: Could not connect to database. Some features may not work."
    );
    console.warn(
      "   The server will start anyway and retry connections on requests."
    );
  } else {
    console.log("Database connection successful");
  }

  app.listen(PORT, () => {
    console.log("it's working na mga sis!");
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer();
