import jwt from "jsonwebtoken";
import { supabaseAdmin, useSupabaseAuth } from "../lib/supabase.js";
import { prisma } from "../lib/prisma.js";

// Get secret from env or use a default for dev
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-prod";

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
    // Try Supabase JWT verification first if configured
    if (useSupabaseAuth()) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      
      if (!error && data.user) {
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
        return next();
      }
      
      // If Supabase auth fails, don't fall back to local JWT in supabase mode
      return res.status(403).json({ error: "Invalid or expired Supabase token" });
    }

    // Local JWT mode (when AUTH_MODE=local or Supabase not configured)
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user details from database
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
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
