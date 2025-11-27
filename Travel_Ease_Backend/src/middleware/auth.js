import jwt from "jsonwebtoken";
import { supabaseAdmin, isSupabaseConfigured } from "../lib/supabase.js";
import { prisma } from "../lib/prisma.js";

// Test mode uses local JWT for testing without Supabase
const isTestMode = process.env.NODE_ENV === 'test';
const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const expectedApiKey = process.env.API_KEY;
  if (!expectedApiKey) {
    return res.status(500).json({
      error: "API key not configured"
    });
  }
  if (!apiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({
      error: "Invalid or missing API key"
    });
  }
  next();
};

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    // Test mode: use local JWT verification
    if (isTestMode && JWT_SECRET) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { user_id: decoded.id }
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      req.user = { 
        id: user.user_id, 
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      };
      return next();
    }

    // Production: require Supabase configuration
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ 
        error: "Authentication service unavailable",
        details: "Supabase is not configured."
      });
    }

    // Verify token with Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // Find linked user in our database
    const user = await prisma.user.findUnique({
      where: { auth_id: data.user.id }
    });

    if (!user) {
      return res.status(404).json({ 
        error: "User profile not found. Please complete registration." 
      });
    }

    req.user = { 
      id: user.user_id, 
      auth_id: data.user.id, 
      email: data.user.email,
      first_name: user.first_name,
      last_name: user.last_name
    };
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
