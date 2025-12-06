import { Request, Response, NextFunction } from 'express';
import type { AuthUser } from '../types/index.js';

/**
 * Middleware to require Google OAuth authentication
 * Use this on routes that should only be accessible to users who signed in with Google.
 * 
 * NOTE: This middleware should be used AFTER authenticateToken middleware,
 * as it relies on req.user being populated with auth_provider field.
 * 
 * For routes that require Google auth verification at the Supabase level
 * (e.g., verifying the Google email matches), use requireGoogleAuth from auth.ts instead.
 */
export const requireGoogleAuthProvider = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthUser | undefined;
  
  // Ensure user is authenticated first
  if (!user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Check if the user authenticated with Google
  if (user.auth_provider !== 'google') {
    return res.status(403).json({ 
      error: 'Google authentication required',
      details: 'This action requires signing in with a Google account.',
      code: 'GOOGLE_AUTH_REQUIRED',
      currentProvider: user.auth_provider || 'password'
    });
  }

  next();
};

/**
 * Middleware to require profile completion
 * Use this on routes that should only be accessible to users who have completed onboarding.
 * 
 * NOTE: This middleware should be used AFTER authenticateToken middleware,
 * as it relies on req.user being populated with profile_completed field.
 */
export const requireProfileCompleted = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthUser | undefined;
  
  // Ensure user is authenticated first
  if (!user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Check if the user has completed their profile
  if (!user.profile_completed) {
    return res.status(403).json({ 
      error: 'Profile completion required',
      details: 'Please complete your profile before performing this action.',
      code: 'PROFILE_INCOMPLETE'
    });
  }

  next();
};

// Re-export with legacy name for backward compatibility
export { requireGoogleAuthProvider as requireGoogleAuth };

