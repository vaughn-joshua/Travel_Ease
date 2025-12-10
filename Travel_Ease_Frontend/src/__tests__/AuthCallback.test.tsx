import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";

// Mock navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock supabase client
const mockGetSession = vi.fn();
const mockSignOut = vi.fn();
vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      setSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      signOut: () => mockSignOut(),
    },
  },
  isSupabaseConfigured: true,
}));

// Mock auth recovery
vi.mock("../lib/authRecovery", () => ({
  handleAuthRecovery: vi.fn(),
  isAuthError: vi.fn().mockReturnValue(false),
}));

// Mock the auth context
const mockSyncOAuthUser = vi.fn();
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    syncOAuthUser: mockSyncOAuthUser,
  }),
}));

// Import after mocking
import AuthCallback from "../pages/AuthCallback";

describe("AuthCallback redirect handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage items used in tests
    localStorage.removeItem("auth_redirect");
    localStorage.removeItem("BUSINESS_AUTH_EMAIL_KEY");
    localStorage.removeItem("ORIGINAL_USER_KEY");
    // Default mock for getSession - valid session
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "test-token",
          user: { email: "test@example.com" },
        },
      },
    });
  });

  afterEach(() => {
    localStorage.removeItem("auth_redirect");
    localStorage.removeItem("BUSINESS_AUTH_EMAIL_KEY");
    localStorage.removeItem("ORIGINAL_USER_KEY");
  });

  it("should NOT clear auth_redirect for new users (preserves for onboarding)", async () => {
    // Set up auth_redirect before OAuth callback
    localStorage.setItem("auth_redirect", "/businesses/onboarding");

    // Mock syncOAuthUser to indicate new user
    mockSyncOAuthUser.mockResolvedValue({ isNewUser: true });

    render(
      <MemoryRouter initialEntries={["/auth/callback?code=test-code"]}>
        <AuthCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/onboarding", { replace: true });
    });

    // auth_redirect should still be in localStorage for Onboarding to use
    expect(localStorage.getItem("auth_redirect")).toBe("/businesses/onboarding");
  });

  it("should clear auth_redirect and redirect to saved path for existing users", async () => {
    // Set up auth_redirect before OAuth callback
    localStorage.setItem("auth_redirect", "/businesses/123");

    // Mock syncOAuthUser to indicate existing user
    mockSyncOAuthUser.mockResolvedValue({ isNewUser: false });

    render(
      <MemoryRouter initialEntries={["/auth/callback?code=test-code"]}>
        <AuthCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/businesses/123", { replace: true });
    });

    // auth_redirect should be cleared
    expect(localStorage.getItem("auth_redirect")).toBeNull();
  });

  it("should redirect existing users to /plans when no saved redirect", async () => {
    // No auth_redirect set
    expect(localStorage.getItem("auth_redirect")).toBeNull();

    // Mock syncOAuthUser to indicate existing user
    mockSyncOAuthUser.mockResolvedValue({ isNewUser: false });

    render(
      <MemoryRouter initialEntries={["/auth/callback?code=test-code"]}>
        <AuthCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/plans", { replace: true });
    });
  });

  it("should clear auth_redirect on sync error", async () => {
    localStorage.setItem("auth_redirect", "/businesses/onboarding");

    // Mock syncOAuthUser to throw an error
    mockSyncOAuthUser.mockRejectedValue(new Error("Sync failed"));

    render(
      <MemoryRouter initialEntries={["/auth/callback?code=test-code"]}>
        <AuthCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/authentication error/i)).toBeInTheDocument();
    });

    // auth_redirect should be cleared on error
    expect(localStorage.getItem("auth_redirect")).toBeNull();
  });
});

