import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import React from "react";

// Mock the auth context
const mockSignInWithGoogle = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// Import after mocking
import { useRequireGoogleAuth } from "../hooks/useRequireGoogleAuth";

// Wrapper component for router context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe("useRequireGoogleAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should return loading status when auth is loading", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      userProfile: null,
      loading: true,
      signInWithGoogle: mockSignInWithGoogle,
      isConfigured: true,
    });

    const { result } = renderHook(() => useRequireGoogleAuth(), { wrapper });

    expect(result.current.status).toBe("loading");
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthorized).toBe(false);
  });

  it("should return unauthenticated when no user", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      userProfile: null,
      loading: false,
      signInWithGoogle: mockSignInWithGoogle,
      isConfigured: true,
    });

    const { result } = renderHook(() => useRequireGoogleAuth(), { wrapper });

    expect(result.current.status).toBe("unauthenticated");
    expect(result.current.isAuthorized).toBe(false);
    expect(result.current.errorMessage).toContain("sign in with Google");
  });

  it("should return wrong_provider when user signed in with email", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "123" },
      userProfile: {
        user_id: 1,
        auth_provider: "email",
        profile_completed: true,
      },
      loading: false,
      signInWithGoogle: mockSignInWithGoogle,
      isConfigured: true,
    });

    const { result } = renderHook(() => useRequireGoogleAuth(), { wrapper });

    expect(result.current.status).toBe("wrong_provider");
    expect(result.current.isAuthorized).toBe(false);
    expect(result.current.errorMessage).toContain("Google account");
  });

  it("should return authenticated when user signed in with Google", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "123" },
      userProfile: {
        user_id: 1,
        auth_provider: "google",
        profile_completed: true,
      },
      loading: false,
      signInWithGoogle: mockSignInWithGoogle,
      isConfigured: true,
    });

    const { result } = renderHook(() => useRequireGoogleAuth(), { wrapper });

    expect(result.current.status).toBe("authenticated");
    expect(result.current.isAuthorized).toBe(true);
    expect(result.current.errorMessage).toBeNull();
  });

  it("should trigger sign in and store redirect path", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      userProfile: null,
      loading: false,
      signInWithGoogle: mockSignInWithGoogle,
      isConfigured: true,
    });

    const { result } = renderHook(() => useRequireGoogleAuth(), { wrapper });

    await result.current.triggerSignIn();

    expect(mockSignInWithGoogle).toHaveBeenCalledWith("/");
  });
});




