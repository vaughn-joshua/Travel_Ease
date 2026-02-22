import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import {
  travelPlanRoutes,
  userRoutes,
  configRoutes,
  utilsRoutes,
  businessRoutes,
  mapRoutes,
  reviewRoutes,
  notificationRoutes,
  blogRoutes,
  weatherRoutes,
} from "./src/routes/index.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import { requestLogger } from "./src/middleware/requestLogger.js";
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
// CORS configuration with explicit origin whitelist
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map(o => o.trim()) || [
  "http://localhost:3000",
  "http://localhost:5173", // Vite dev server
  "http://127.0.0.1:5173", // Vite dev server (IP)
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

// In development, allow any localhost/127.0.0.1 origin
const isDev = process.env.NODE_ENV !== "production";

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // In development, allow any localhost or 127.0.0.1 origin
      if (isDev && (origin.includes("localhost") || origin.includes("127.0.0.1"))) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
);
app.use(express.json());
app.use(requestLogger);

// Routes
app.use(
  "/api/travel_plan",
  (req, res, next) => {
    console.log("Travel plan route accessed");
    next();
  },
  travelPlanRoutes
);
app.use("/api/user", userRoutes);
app.use("/api/utils", utilsRoutes);
app.use("/api/config", configRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/weather", weatherRoutes);

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
