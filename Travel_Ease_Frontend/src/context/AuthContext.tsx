import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import {
  authApi,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
  type UpdateProfilePayload,
} from "../services/auth";
import { authEvents } from "../services/api";

type AuthSource = "supabase" | "password" | "google";

export interface AppUser {
  id?: number;
  authId?: string | null;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  contactNo?: string | null;
  profileCompleted?: boolean;
  source: AuthSource;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  needsOnboarding: boolean;
  isGoogleAuth: boolean;  // True if user authenticated via Google
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (payload: LoginPayload) => Promise<void>;
  registerWithEmail: (payload: RegisterPayload) => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  syncOAuthUser: () => Promise<{ isNewUser: boolean }>;
  signOut: () => Promise<void>;
}

const PROFILE_STORAGE_KEY = "travelEaseUser";
const TOKEN_STORAGE_KEY = "token";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

const mapApiUser = (user: AuthUser, source: AuthSource = "password"): AppUser => ({
  id: user.user_id,
  authId: user.auth_id ?? null,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  contactNo: user.contact_no ?? null,
  profileCompleted: user.profile_completed ?? true,
  source,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const persistAuth = (profile: AppUser | null, token?: string | null) => {
    setUser(profile);

    if (profile) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      setNeedsOnboarding(!profile.profileCompleted && profile.source === "google");
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

  useEffect(() => {
    const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile) as AppUser;
        setUser(parsed);
        setNeedsOnboarding(!parsed.profileCompleted && parsed.source === "google");
      } catch (error) {
        localStorage.removeItem(PROFILE_STORAGE_KEY);
      }
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Don't auto-store Supabase token - wait for explicit OAuth sync or login
      // This prevents 401 errors when there's a stale Supabase session
      // Tokens are stored by loginWithEmail or syncOAuthUser after backend verification
      const profile = mapSupabaseUser(session?.user ?? null);
      if (profile && !user) {
        // Only set basic profile if we don't already have a user from localStorage
        // Don't persist with token - require explicit sync
        setUser(profile);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      // Don't auto-store token on auth state change
      // Tokens should only be stored after backend verification via syncOAuthUser or loginWithEmail
    });

    // Subscribe to 401/403 events to clear auth state when token is invalid
    const unsubscribeAuth = authEvents.onUnauthorized(() => {
      // Clear all auth state including localStorage
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
      setSession(null);
      setNeedsOnboarding(false);
      // Also sign out from Supabase to prevent it from re-providing stale tokens
      if (isSupabaseConfigured) {
        supabase.auth.signOut().catch(console.error);
      }
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
      const currentToken = session?.access_token ?? localStorage.getItem(TOKEN_STORAGE_KEY);
      persistAuth(profile, currentToken);
      setNeedsOnboarding(data.needsOnboarding);
      return { isNewUser: data.isNewUser };
    } catch (error) {
      console.error("OAuth sync error:", error);
      throw error;
    }
  };

  const loginWithEmail = async (payload: LoginPayload) => {
    const data = await authApi.login(payload);
    const profile = mapApiUser(data.user, "password");

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
    const profile = mapApiUser(data.user, user?.source || "password");
    persistAuth(profile);
    setNeedsOnboarding(false);
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error.message);
        throw error;
      }
    }

    persistAuth(null, null);
    setSession(null);
    setNeedsOnboarding(false);
  };

  // Check if user is authenticated via Google
  const isGoogleAuth = user?.source === "google";

  const value = {
    user,
    session,
    loading,
    isConfigured: isSupabaseConfigured,
    needsOnboarding,
    isGoogleAuth,
    signInWithGoogle,
    loginWithEmail,
    registerWithEmail,
    updateProfile,
    syncOAuthUser,
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
