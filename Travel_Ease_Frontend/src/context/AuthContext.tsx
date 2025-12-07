import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { AxiosError } from "axios";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import {
  authApi,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
  type UpdateProfilePayload,
} from "../services/auth";
import { authEvents } from "../services/api";

/** Auth source type - indicates how the user authenticated */
type AuthSource = "supabase" | "password" | "google";

/** App user - frontend representation of authenticated user */
export interface AppUser {
  id?: number;
  authId?: string | null;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  contactNo?: string | null;
  /** Whether the user has completed their profile (set via onboarding) */
  profileCompleted?: boolean;
  /** Whether the user can log in with email+password (has set a password) */
  hasPassword?: boolean;
  /** How the user authenticated */
  source: AuthSource;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  needsOnboarding: boolean;
  isGoogleAuth: boolean;  // True if user authenticated via Google
  hasPassword: boolean;   // True if user can log in with email+password
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (payload: LoginPayload) => Promise<void>;
  registerWithEmail: (payload: RegisterPayload) => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  syncOAuthUser: () => Promise<{ isNewUser: boolean }>;
  refreshProfile: () => Promise<void>;  // Refresh user profile from server
  signOut: () => Promise<void>;
}

const PROFILE_STORAGE_KEY = "travelEaseUser";
const TOKEN_STORAGE_KEY = "token";
const BUSINESS_AUTH_EMAIL_KEY = "business_auth_email";
// Key to store the original user profile during business auth flow
const ORIGINAL_USER_KEY = "travelEaseOriginalUser";

// Cache context on globalThis to survive Vite HMR and prevent "useAuth must be used within an AuthProvider" errors
const AUTH_CONTEXT_KEY = "__TRAVEL_EASE_AUTH_CONTEXT__";

declare global {
  // eslint-disable-next-line no-var
  var __TRAVEL_EASE_AUTH_CONTEXT__: React.Context<AuthContextType | undefined> | undefined;
}

const AuthContext: React.Context<AuthContextType | undefined> =
  (globalThis as Record<string, unknown>)[AUTH_CONTEXT_KEY] as React.Context<AuthContextType | undefined> ??
  createContext<AuthContextType | undefined>(undefined);

// Store on globalThis so subsequent HMR reloads reuse the same context
(globalThis as Record<string, unknown>)[AUTH_CONTEXT_KEY] = AuthContext;

const mapSupabaseUser = (supabaseUser: User | null): AppUser | null => {
  if (!supabaseUser) return null;

  const metadata = supabaseUser.user_metadata || {};
  const fallbackName = supabaseUser.email?.split("@")[0] || "Traveler";

  return {
    authId: supabaseUser.id,
    email: supabaseUser.email || "",
    firstName:
      metadata.first_name ||
      metadata.firstName ||
      metadata.given_name ||
      fallbackName,
    lastName: metadata.last_name || metadata.lastName || metadata.family_name || "",
    contactNo: metadata.contact_no || metadata.phone || null,
    source: "supabase",
  };
};

/**
 * Map backend AuthUser to frontend AppUser
 * @param user - Backend user DTO
 * @param source - Auth source override (defaults to auth_provider or 'password')
 */
const mapApiUser = (user: AuthUser, source?: AuthSource): AppUser => {
  // Determine source from auth_provider if not explicitly provided
  const authSource: AuthSource = source ?? (user.auth_provider === "google" ? "google" : "password");
  
  return {
    id: user.user_id,
    authId: user.auth_id ?? null,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    contactNo: user.contact_no ?? null,
    // Use backend profile_completed flag
    profileCompleted: user.profile_completed ?? false,
    // hasPassword: true if user can log in with email+password
    // Derive from has_email_identity or auth_provider if not set
    hasPassword: user.has_email_identity ?? (user.auth_provider === "password"),
    source: authSource,
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  /**
   * Persist auth state to localStorage and update React state
   * @param profile - User profile or null to clear
   * @param token - Token to store, null to clear, undefined to keep existing
   */
  const persistAuth = (profile: AppUser | null, token?: string | null) => {
    setUser(profile);

    if (profile) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      // User needs onboarding if profile_completed is false
      // This applies to both Google OAuth users (who skip registration form)
      // and any user who hasn't completed their profile
      setNeedsOnboarding(!profile.profileCompleted);
    } else {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      setNeedsOnboarding(false);
    }

    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else if (token === null) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  };

  const clearAuthState = async () => {
    persistAuth(null, null);
    setSession(null);
    setNeedsOnboarding(false);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(console.error);
    }
  };

  useEffect(() => {
    // Check if we're in a business auth flow (email verification pending)
    const businessAuthEmail = localStorage.getItem(BUSINESS_AUTH_EMAIL_KEY);
    const isInBusinessAuthFlow = !!businessAuthEmail;
    
    // Load stored profile
    const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile) as AppUser;
        setUser(parsed);
        // Set onboarding state based on profile_completed flag
        setNeedsOnboarding(!parsed.profileCompleted);
      } catch (error) {
        localStorage.removeItem(PROFILE_STORAGE_KEY);
      }
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      // If we're in a business auth flow, check for email mismatch BEFORE updating any state
      if (isInBusinessAuthFlow && currentSession?.user?.email) {
        const sessionEmail = currentSession.user.email.toLowerCase();
        const expectedEmail = businessAuthEmail!.toLowerCase();
        
        if (sessionEmail !== expectedEmail) {
          // Email mismatch - DON'T update session or user state
          // Keep the original user from localStorage intact
          setLoading(false);
          return;
        }
      }
      
      setSession(currentSession);
      
      // ALWAYS sync the token when we have a valid Supabase session
      // This ensures API calls can work immediately after auth loads
      if (currentSession?.access_token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, currentSession.access_token);
      } else {
        // If we have a stored profile but no valid Supabase session,
        // the session has expired - clear the stored auth state
        if (storedProfile) {
          localStorage.removeItem(PROFILE_STORAGE_KEY);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setUser(null);
          setNeedsOnboarding(false);
        }
      }
      
      const profile = mapSupabaseUser(currentSession?.user ?? null);
      if (profile && !storedProfile) {
        // Only set basic profile if we don't already have a user from localStorage
        setUser(profile);
        // Also persist the profile so future page loads have it
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Check if we're in a business auth flow that requires email verification
      const currentBusinessAuthEmail = localStorage.getItem(BUSINESS_AUTH_EMAIL_KEY);
      const newSessionEmail = nextSession?.user?.email;
      
      // If we're in a business auth flow and the emails don't match,
      // DON'T update the session state - keep the original user logged in
      if (currentBusinessAuthEmail && newSessionEmail) {
        if (currentBusinessAuthEmail.toLowerCase() !== newSessionEmail.toLowerCase()) {
          // Email mismatch during business auth - don't update session state
          // The AuthCallback component will handle showing the error
          return;
        }
      }
      
      setSession(nextSession);
      
      // Sync the token when auth state changes (e.g., token refresh)
      // Only do this if we have a stored user profile (user has been verified)
      const storedUser = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (nextSession?.access_token && storedUser) {
        localStorage.setItem(TOKEN_STORAGE_KEY, nextSession.access_token);
      }
    });

    // Subscribe to 401/403 events to clear auth state when token is invalid
    const unsubscribeAuth = authEvents.onUnauthorized(() => {
      clearAuthState().catch(console.error);
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeAuth();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      throw new Error(
        "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
      );
    }

    // Clear any existing Supabase session to avoid "identity already exists" errors
    // when a logged-in password user reauthenticates with Google for business flows.
    try {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      if (activeSession) {
        await supabase.auth.signOut();
      }
    } catch (sessionResetError) {
      console.warn("Failed to reset Supabase session before Google sign-in", sessionResetError);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("Google sign-in error:", error.message);
      throw error;
    }
  };

  /**
   * Sync OAuth user with backend after Supabase OAuth callback
   * Creates or retrieves the internal user profile
   */
  const syncOAuthUser = async (): Promise<{ isNewUser: boolean }> => {
    try {
      const data = await authApi.oauthSync();
      const profile = mapApiUser(data.user, "google");
      // After successful backend verification, store the token from current session
      const currentToken =
        session?.access_token ?? localStorage.getItem(TOKEN_STORAGE_KEY);
      persistAuth(profile, currentToken);
      setNeedsOnboarding(data.needsOnboarding);
      return { isNewUser: data.isNewUser };
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const code = error.response?.data?.code;
        const message =
          error.response?.data?.error ||
          error.message ||
          "Authentication failed. Please try again.";

        // Database unavailable - don't clear auth, just report the error
        // The user's Supabase session is still valid, just can't sync with backend
        if (status === 503 && code === "DB_UNAVAILABLE") {
          const err = new Error("Database temporarily unavailable. Please try again later.");
          err.name = "DB_UNAVAILABLE";
          throw err;
        }

        if (status === 403 && code === "ACCOUNT_NOT_REGISTERED") {
          await clearAuthState();
          const err = new Error(message);
          err.name = "ACCOUNT_NOT_REGISTERED";
          throw err;
        }

        if (status === 400 && code === "OAUTH_EMAIL_MISSING") {
          await clearAuthState();
          const err = new Error(message);
          err.name = "OAUTH_EMAIL_MISSING";
          throw err;
        }

        // Token expired - clear auth state
        if (status === 403 && code === "TOKEN_EXPIRED") {
          await clearAuthState();
          const err = new Error(message);
          err.name = "TOKEN_EXPIRED";
          throw err;
        }
      }

      console.error("OAuth sync error:", error);
      throw error;
    }
  };

  const loginWithEmail = async (payload: LoginPayload) => {
    const data = await authApi.login(payload);
    // Backend returns auth_provider, mapApiUser will derive source from it
    const profile = mapApiUser(data.user);

    persistAuth(profile, data.token);
    setSession(null);

    if (isSupabaseConfigured && data.refresh_token) {
      try {
        await supabase.auth.setSession({
          access_token: data.token,
          refresh_token: data.refresh_token,
        });
      } catch (error) {
        console.warn("Supabase session sync failed:", error);
      }
    }
  };

  const registerWithEmail = async (payload: RegisterPayload) => {
    await authApi.register(payload);
    await loginWithEmail({ email: payload.email, password: payload.password });
  };

  const updateProfile = async (payload: UpdateProfilePayload) => {
    const data = await authApi.updateProfile(payload);
    // Map user, preserving the source from current user if available
    const profile = mapApiUser(data.user, user?.source);
    persistAuth(profile);
    // Backend sets profile_completed=true, so needsOnboarding should be false
    // This is handled by persistAuth based on profile.profileCompleted
  };

  /**
   * Refresh user profile from server
   * Useful after operations that change user flags (e.g., setPassword)
   */
  const refreshProfile = async () => {
    try {
      const userData = await authApi.getMe();
      const profile = mapApiUser(userData, user?.source);
      persistAuth(profile);
    } catch (error) {
      console.error("Failed to refresh profile:", error);
      throw error;
    }
  };

  const signOut = async () => {
    await clearAuthState();
  };

  // Check if user is authenticated via Google
  const isGoogleAuth = user?.source === "google";
  // Check if user can log in with email+password
  const hasPassword = user?.hasPassword ?? false;

  const value = {
    user,
    session,
    loading,
    isConfigured: isSupabaseConfigured,
    needsOnboarding,
    isGoogleAuth,
    hasPassword,
    signInWithGoogle,
    loginWithEmail,
    registerWithEmail,
    updateProfile,
    syncOAuthUser,
    refreshProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
