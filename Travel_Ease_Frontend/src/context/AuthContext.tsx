import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import {
  authApi,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from "../services/auth";

type AuthSource = "supabase" | "password";

export interface AppUser {
  id?: number;
  authId?: string | null;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  contactNo?: string | null;
  source: AuthSource;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (payload: LoginPayload) => Promise<void>;
  registerWithEmail: (payload: RegisterPayload) => Promise<void>;
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

const mapApiUser = (user: AuthUser): AppUser => ({
  id: user.user_id,
  authId: user.auth_id ?? null,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  contactNo: user.contact_no ?? null,
  source: "password",
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const persistAuth = (profile: AppUser | null, token?: string | null) => {
    setUser(profile);

    if (profile) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
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
        setUser(JSON.parse(storedProfile) as AppUser);
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
      const profile = mapSupabaseUser(session?.user ?? null);
      if (profile) {
        persistAuth(profile, session?.access_token ?? undefined);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      const profile = mapSupabaseUser(nextSession?.user ?? null);
      persistAuth(profile, nextSession?.access_token ?? null);
    });

    return () => subscription.unsubscribe();
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
      },
    });

    if (error) {
      console.error("Google sign-in error:", error.message);
      throw error;
    }
  };

  const loginWithEmail = async (payload: LoginPayload) => {
    const data = await authApi.login(payload);
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
  };

  const value = {
    user,
    session,
    loading,
    isConfigured: isSupabaseConfigured,
    signInWithGoogle,
    loginWithEmail,
    registerWithEmail,
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
