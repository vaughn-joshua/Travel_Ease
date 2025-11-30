/**
 * Middleware to require Google OAuth authentication
 * Use this on routes that should only be accessible to users who signed in with Google
 */
export const requireGoogleAuth = (req, res, next) => {
  // Ensure user is authenticated first
  if (!req.user) {
    return res.status(401).json({ 
      error: "Authentication required",
      code: "AUTH_REQUIRED"
    });
  }

  // Check if the user authenticated with Google
  if (req.user.provider !== "google") {
    return res.status(403).json({ 
      error: "Google authentication required",
      details: "This action requires signing in with a Google account.",
      code: "GOOGLE_AUTH_REQUIRED",
      currentProvider: req.user.provider || "unknown"
    });
  }

  next();
};

/**
 * Middleware to require profile completion
 * Use this on routes that should only be accessible to users who have completed onboarding
 */
export const requireProfileCompleted = (req, res, next) => {
  // Ensure user is authenticated first
  if (!req.user) {
    return res.status(401).json({ 
      error: "Authentication required",
      code: "AUTH_REQUIRED"
    });
  }

  // Check if the user has completed their profile
  if (!req.user.profile_completed) {
    return res.status(403).json({ 
      error: "Profile completion required",
      details: "Please complete your profile before performing this action.",
      code: "PROFILE_INCOMPLETE"
    });
  }

  next();
};
