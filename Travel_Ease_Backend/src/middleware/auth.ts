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

interface PrismaError extends Error {
  code?: string;
  meta?: { target?: string | string[] };
}

/**
 * Check if an error is a Prisma database connection error (P1xxx codes)
 * These indicate the database is unreachable, not an auth problem
 */
function isDatabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; name?: string };
  // P1xxx errors are connection/server errors
  if (err.code?.startsWith('P1')) return true;
  // Also check for initialization errors
  if (err.name === 'PrismaClientInitializationError') return true;
  return false;
}

/**
 * Check if an error is a Prisma unique constraint violation (P2002)
 * This typically happens during race conditions when creating users
 */
function isUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as PrismaError;
  return err.code === 'P2002';
}

/**
 * Get the fields that caused the unique constraint violation
 */
function getUniqueConstraintFields(error: unknown): string[] {
  if (!error || typeof error !== 'object') return [];
  const err = error as PrismaError;
  const target = err.meta?.target;
  if (Array.isArray(target)) return target;
  if (typeof target === 'string') return [target];
  return [];
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
      // Check if this is a database connection error
      if (isDatabaseConnectionError(error)) {
        logger.warn({
          module: 'auth',
          middleware: 'requireGoogleAuth',
          mode: 'test',
          error: String(error),
        }, 'Database unavailable during test mode auth');
        return res.status(503).json({
          error: "Database temporarily unavailable. Please try again.",
          code: "DB_UNAVAILABLE",
        });
      }
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
      return res.status(403).json({ error: "Invalid or expired token", code: "TOKEN_EXPIRED" });
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
    // Use a safe find-or-create pattern that handles race conditions
    let user = await executeWithRetry(() =>
      prisma.user.findUnique({
        where: { email: googleEmail },
      })
    );

    if (!user) {
      // Also check by auth_id in case user exists with different email
      user = await executeWithRetry(() =>
        prisma.user.findUnique({
          where: { auth_id: data.user.id },
        })
      );
    }

    if (!user) {
      // AUTO-PROVISION: Create a minimal user record for new Google OAuth users
      const { firstName, lastName } = extractUserName(data.user);
      
      logger.info({
        module: 'auth',
        event: 'AUTO_PROVISIONING',
        email: googleEmail,
        provider: 'google',
        supabaseUserId: data.user.id,
        middleware: 'requireGoogleAuth',
      }, 'Auto-provisioning new user from Google OAuth');

      try {
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
        
        logger.info({
          module: 'auth',
          event: 'AUTO_PROVISIONED',
          email: googleEmail,
          userId: user.user_id,
          middleware: 'requireGoogleAuth',
        }, 'Successfully auto-provisioned new user');
      } catch (createError) {
        // Handle race condition: if P2002, the user was just created by another request
        if (isUniqueConstraintError(createError)) {
          const constraintFields = getUniqueConstraintFields(createError);
          logger.info({
            module: 'auth',
            event: 'AUTO_PROVISION_RACE',
            email: googleEmail,
            supabaseUserId: data.user.id,
            constraintFields,
            middleware: 'requireGoogleAuth',
          }, 'User was created by concurrent request, re-fetching');

          // Re-fetch the user that was created by the concurrent request
          // Try by auth_id first (most likely cause of P2002), then by email
          user = await executeWithRetry(() =>
            prisma.user.findUnique({
              where: { auth_id: data.user.id },
            })
          );
          
          if (!user) {
            user = await executeWithRetry(() =>
              prisma.user.findUnique({
                where: { email: googleEmail },
              })
            );
          }

          if (!user) {
            // This shouldn't happen, but log and fail gracefully
            logger.error({
              module: 'auth',
              event: 'AUTO_PROVISION_FAILED',
              email: googleEmail,
              supabaseUserId: data.user.id,
              middleware: 'requireGoogleAuth',
            }, 'Failed to find user after P2002 race condition');
            return res.status(500).json({
              error: "User synchronization failed. Please try again.",
              code: "USER_SYNC_ERROR",
            });
          }
        } else {
          // Re-throw non-P2002 errors
          throw createError;
        }
      }
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
    // Check if this is a database connection error
    if (isDatabaseConnectionError(error)) {
      logger.warn({
        module: 'auth',
        middleware: 'requireGoogleAuth',
        error: String(error),
      }, 'Database unavailable during Google auth');
      return res.status(503).json({
        error: "Database temporarily unavailable. Please try again.",
        code: "DB_UNAVAILABLE",
      });
    }
    
    // Check if this is a unique constraint error that wasn't handled above
    if (isUniqueConstraintError(error)) {
      const constraintFields = getUniqueConstraintFields(error);
      logger.error({
        module: 'auth',
        middleware: 'requireGoogleAuth',
        error: String(error),
        constraintFields,
      }, 'Unexpected unique constraint error during Google auth');
      return res.status(500).json({
        error: "User synchronization failed. Please try again.",
        code: "USER_SYNC_ERROR",
      });
    }
    
    logger.error({
      module: 'auth',
      middleware: 'requireGoogleAuth',
      error: String(error),
    }, 'Google auth verification error');
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

/**
 * Optional authentication middleware.
 * Sets req.user if a valid token is provided, but doesn't fail if no token.
 * Use this for public endpoints that can optionally show user-specific data.
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    // No token provided - continue without user
    return next();
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

      if (user) {
        req.user = {
          id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
        };
      }
      return next();
    }

    // Production: require Supabase configuration
    if (!isSupabaseConfigured()) {
      return next(); // Continue without user if Supabase not configured
    }

    // Verify token with Supabase
    const { data, error } = await supabaseAdmin!.auth.getUser(token);

    if (!error && data.user?.email) {
      const user = await executeWithRetry(() =>
        prisma.user.findUnique({
          where: { email: data.user!.email! },
        })
      );

      if (user) {
        req.user = {
          id: user.user_id,
          auth_id: data.user.id,
          email: data.user.email,
          first_name: user.first_name,
          last_name: user.last_name,
        };
      }
    }
    next();
  } catch (error) {
    // Token invalid or expired - continue without user
    console.log("Optional auth: token verification failed, continuing without user");
    next();
  }
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
      return res.status(403).json({ error: "Invalid or expired token", code: "TOKEN_EXPIRED" });
    }

    const email = data.user.email;

    if (!email) {
      return res.status(400).json({
        error: "Authenticated account does not provide an email address.",
        code: "OAUTH_EMAIL_MISSING",
      });
    }

    // Find user by email first
    let user = await executeWithRetry(() =>
      prisma.user.findUnique({
        where: { email },
      })
    );

    const provider = mapAuthProvider(data.user.app_metadata?.provider);

    // If not found by email, also check by auth_id (handles email changes in Supabase)
    if (!user) {
      user = await executeWithRetry(() =>
        prisma.user.findUnique({
          where: { auth_id: data.user.id },
        })
      );
      
      // If found by auth_id but email differs, update the email
      if (user && user.email !== email) {
        logger.info({
          module: 'auth',
          event: 'EMAIL_SYNC',
          oldEmail: user.email,
          newEmail: email,
          userId: user.user_id,
        }, 'Syncing email change from Supabase');
        
        user = await executeWithRetry(() =>
          prisma.user.update({
            where: { user_id: user!.user_id },
            data: { email },
          })
        );
      }
    }

    if (!user) {
      // AUTO-PROVISION: Create a minimal user record for new OAuth users
      // This allows the onboarding flow to work correctly
      const { firstName, lastName } = extractUserName(data.user);
      
      logger.info({
        module: 'auth',
        event: 'AUTO_PROVISIONING',
        email,
        provider,
        supabaseUserId: data.user.id,
      }, 'Auto-provisioning new user from OAuth');

      try {
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
        
        logger.info({
          module: 'auth',
          event: 'AUTO_PROVISIONED',
          email,
          userId: user.user_id,
        }, 'Successfully auto-provisioned new user');
      } catch (createError) {
        // Handle race condition: if P2002, the user was just created by another request
        if (isUniqueConstraintError(createError)) {
          const constraintFields = getUniqueConstraintFields(createError);
          logger.info({
            module: 'auth',
            event: 'AUTO_PROVISION_RACE',
            email,
            supabaseUserId: data.user.id,
            constraintFields,
          }, 'User was created by concurrent request, re-fetching');

          // Re-fetch the user that was created by the concurrent request
          // Try by auth_id first (most likely cause of P2002), then by email
          user = await executeWithRetry(() =>
            prisma.user.findUnique({
              where: { auth_id: data.user.id },
            })
          );
          
          if (!user) {
            user = await executeWithRetry(() =>
              prisma.user.findUnique({
                where: { email },
              })
            );
          }

          if (!user) {
            // This shouldn't happen, but log and fail gracefully
            logger.error({
              module: 'auth',
              event: 'AUTO_PROVISION_FAILED',
              email,
              supabaseUserId: data.user.id,
            }, 'Failed to find user after P2002 race condition');
            return res.status(500).json({
              error: "User synchronization failed. Please try again.",
              code: "USER_SYNC_ERROR",
            });
          }
        } else {
          // Re-throw non-P2002 errors to be handled below
          throw createError;
        }
      }
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
    // Check if this is a database connection error
    if (isDatabaseConnectionError(error)) {
      logger.warn({
        module: 'auth',
        middleware: 'authenticateToken',
        error: String(error),
      }, 'Database unavailable during authentication');
      return res.status(503).json({
        error: "Database temporarily unavailable. Please try again.",
        code: "DB_UNAVAILABLE",
      });
    }
    
    // Check if this is a unique constraint error that wasn't handled above
    // This shouldn't happen with the new logic, but handle it gracefully
    if (isUniqueConstraintError(error)) {
      const constraintFields = getUniqueConstraintFields(error);
      logger.error({
        module: 'auth',
        middleware: 'authenticateToken',
        error: String(error),
        constraintFields,
      }, 'Unexpected unique constraint error during auth');
      return res.status(500).json({
        error: "User synchronization failed. Please try again.",
        code: "USER_SYNC_ERROR",
      });
    }
    
    logger.error({
      module: 'auth',
      middleware: 'authenticateToken',
      error: String(error),
    }, 'Auth error');
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
