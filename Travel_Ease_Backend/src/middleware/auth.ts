import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { supabaseAdmin, isSupabaseConfigured } from "../lib/supabase.js";
import { prisma, executeWithRetry } from "../lib/prismaHelpers.js";
import { logger } from "../lib/logger.js";
import type { AuthProvider } from "../types/index.js";

// Test mode uses local JWT for testing without Supabase
const isTestMode = process.env.NODE_ENV === "test";
const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
  id: number;
  email?: string;
}

/**
 * Helper to map Supabase provider string to our AuthProvider type
 */
function mapAuthProvider(provider?: string): AuthProvider {
  if (provider === 'google') return 'google';
  return 'password';
}

/**
 * Extract user name from Supabase user metadata
 * Falls back to email prefix if no name is available
 */
function extractUserName(supabaseUser: { email?: string; user_metadata?: Record<string, unknown> }): { firstName: string; lastName: string } {
  const metadata = supabaseUser.user_metadata || {};
  const email = supabaseUser.email || '';
  const emailPrefix = email.split('@')[0] || 'User';
  
  // Try various metadata fields that OAuth providers use
  const firstName = 
    (metadata.first_name as string) ||
    (metadata.given_name as string) ||
    (metadata.full_name as string)?.split(' ')[0] ||
    emailPrefix;
    
  const lastName = 
    (metadata.last_name as string) ||
    (metadata.family_name as string) ||
    (metadata.full_name as string)?.split(' ').slice(1).join(' ') ||
    '';
    
  return { firstName, lastName };
}

/**
 * Middleware to require Google OAuth authentication.
 * This ensures the user authenticated via Google and the Google email
 * matches their registered email in our database.
 * Use this for sensitive operations like business creation.
 */
export const requireGoogleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // First run the standard auth check
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Skip Google requirement in test mode - but still verify JWT and set req.user
  if (isTestMode && JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      const user = await executeWithRetry(() =>
        prisma.user.findUnique({
          where: { user_id: decoded.id },
        })
      );

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      req.user = {
        id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        auth_provider: mapAuthProvider(user.auth_provider ?? undefined),
        profile_completed: user.profile_completed ?? false,
      };
      return next();
    } catch (error) {
      console.error("Test mode auth error:", error);
      return res.status(403).json({ error: "Invalid or expired token" });
    }
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error: "Authentication service unavailable",
      details: "Supabase is not configured.",
    });
  }

  try {
    const { data, error } = await supabaseAdmin!.auth.getUser(token);

    if (error || !data.user) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // Check if this is a Google OAuth session
    const provider = data.user.app_metadata?.provider;
    if (provider !== "google") {
      return res.status(403).json({
        error: "Google authentication required for this action.",
        code: "GOOGLE_AUTH_REQUIRED",
      });
    }

    const googleEmail = data.user.email;
    if (!googleEmail) {
      return res.status(400).json({
        error: "Google account does not provide an email address.",
        code: "OAUTH_EMAIL_MISSING",
      });
    }

    // Find or auto-provision user for Google OAuth
    let user = await executeWithRetry(() =>
      prisma.user.findUnique({
        where: { email: googleEmail },
      })
    );

    if (!user) {
      // AUTO-PROVISION: Create a minimal user record for new Google OAuth users
      const { firstName, lastName } = extractUserName(data.user);
      
      logger.info({
        module: 'auth',
        event: 'AUTO_PROVISIONED',
        email: googleEmail,
        provider: 'google',
        supabaseUserId: data.user.id,
        middleware: 'requireGoogleAuth',
      }, 'Auto-provisioning new user from Google OAuth');

      user = await executeWithRetry(() =>
        prisma.user.create({
          data: {
            email: googleEmail,
            auth_id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            auth_provider: 'google',
            profile_completed: false, // Requires onboarding
          },
        })
      );
    } else if (!user.auth_id || user.auth_id !== data.user.id) {
      // Sync auth_id if needed for existing users
      user = await executeWithRetry(() =>
        prisma.user.update({
          where: { user_id: user!.user_id },
          data: {
            auth_id: data.user.id,
            auth_provider: 'google',
          },
        })
      );
    }

    // Attach user info to request
    req.user = {
      id: user.user_id,
      auth_id: data.user.id,
      email: googleEmail,
      first_name: user.first_name,
      last_name: user.last_name,
      auth_provider: 'google',
      profile_completed: user.profile_completed ?? false,
    };

    next();
  } catch (error) {
    console.error("Google auth verification error:", error);
    return res
      .status(403)
      .json({ error: "Authentication verification failed" });
  }
};

export const authenticateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"] as string | undefined;
  const expectedApiKey = process.env.API_KEY;
  if (!expectedApiKey) {
    return res.status(500).json({
      error: "API key not configured",
    });
  }
  if (!apiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({
      error: "Invalid or missing API key",
    });
  }
  next();
};

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    // Test mode: use local JWT verification
    if (isTestMode && JWT_SECRET) {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      const user = await executeWithRetry(() =>
        prisma.user.findUnique({
          where: { user_id: decoded.id },
        })
      );

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      req.user = {
        id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        auth_provider: mapAuthProvider(user.auth_provider ?? undefined),
        profile_completed: user.profile_completed ?? false,
      };
      return next();
    }

    // Production: require Supabase configuration
    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        error: "Authentication service unavailable",
        details: "Supabase is not configured.",
      });
    }

    // Verify token with Supabase
    const { data, error } = await supabaseAdmin!.auth.getUser(token);

    if (error || !data.user) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    const email = data.user.email;

    if (!email) {
      return res.status(400).json({
        error: "Authenticated account does not provide an email address.",
        code: "OAUTH_EMAIL_MISSING",
      });
    }

    let user = await executeWithRetry(() =>
      prisma.user.findUnique({
        where: { email },
      })
    );

    const provider = mapAuthProvider(data.user.app_metadata?.provider);

    if (!user) {
      // AUTO-PROVISION: Create a minimal user record for new OAuth users
      // This allows the onboarding flow to work correctly
      const { firstName, lastName } = extractUserName(data.user);
      
      logger.info({
        module: 'auth',
        event: 'AUTO_PROVISIONED',
        email,
        provider,
        supabaseUserId: data.user.id,
      }, 'Auto-provisioning new user from OAuth');

      user = await executeWithRetry(() =>
        prisma.user.create({
          data: {
            email,
            auth_id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            auth_provider: provider,
            profile_completed: false, // Requires onboarding
          },
        })
      );
    } else if (!user.auth_id || user.auth_id !== data.user.id || user.auth_provider !== provider) {
      // Sync auth_id and provider if needed for existing users
      user = await executeWithRetry(() =>
        prisma.user.update({
          where: { user_id: user!.user_id },
          data: {
            auth_id: data.user.id,
            auth_provider: provider,
          },
        })
      );
    }

    req.user = {
      id: user.user_id,
      auth_id: data.user.id,
      email: data.user.email || "",
      first_name: user.first_name,
      last_name: user.last_name,
      auth_provider: mapAuthProvider(user.auth_provider ?? undefined),
      profile_completed: user.profile_completed ?? false,
    };
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
