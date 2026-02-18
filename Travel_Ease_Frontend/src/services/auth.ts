import api from "./api";

// ============================================================================
// Auth Payloads
// ============================================================================

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  contact_no?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  contact_no?: string;
}

// ============================================================================
// Auth Types (synchronized with backend)
// ============================================================================

/** Auth provider type - matches backend AuthProvider */
export type AuthProvider = "password" | "google";

/** Auth user DTO - matches backend AuthUserDTO */
export interface AuthUser {
  user_id: number;
  auth_id?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  contact_no?: string | null;
  auth_provider?: AuthProvider;
  has_email_identity?: boolean;  // True if user can log in with email+password
  profile_completed?: boolean;
  role?: string;  // User role: SUPER_ADMIN, LGU_ADMIN, BUSINESS_OWNER, TRAVEL_AGENCY, USER
  created_at?: string;
}

/** Login response - matches backend LoginResponse */
export interface AuthResponse {
  message: string;
  user: AuthUser;
  token: string;
  refresh_token?: string;
  expires_at?: number;
}

/** OAuth sync response - matches backend OAuthSyncResponse */
export interface OAuthSyncResponse {
  message: string;
  user: AuthUser;
  isNewUser: boolean;
  needsOnboarding: boolean;
}

/** Register response */
export interface RegisterResponse {
  message: string;
  user: AuthUser;
  supabase_user_id?: string;
}

export const authApi = {
  async register(payload: RegisterPayload) {
    const { data } = await api.post<AuthResponse>("/user/register", payload);
    return data;
  },

  async login(payload: LoginPayload) {
    const { data } = await api.post<AuthResponse>("/user/login", payload);
    return data;
  },

  /**
   * Sync OAuth user with backend - creates or retrieves internal user profile
   * Called after Supabase OAuth callback (e.g., Google sign-in)
   */
  async oauthSync() {
    const { data } = await api.post<OAuthSyncResponse>("/user/oauth");
    return data;
  },

  /**
   * Get current user's profile.
   * Used to refresh profile state after operations that change user flags (e.g., setPassword).
   */
  async getMe() {
    const { data } = await api.get<AuthUser>("/user/me");
    return data;
  },

  /**
   * Update user profile
   */
  async updateProfile(payload: UpdateProfilePayload) {
    const { data } = await api.put<{ message: string; user: AuthUser }>(
      "/user/profile",
      payload
    );
    return data;
  },

  /**
   * Delete user account
   */
  async deleteAccount() {
    const { data } = await api.delete<{ message: string }>("/user/account");
    return data;
  },

  /**
   * Disconnect Google account from user
   * Requires user to have set a password first
   */
  async disconnectGoogle(password: string) {
    const { data } = await api.post<{ message: string; user?: { auth_provider: AuthProvider } }>(
      "/user/disconnect-google",
      { password }
    );
    return data;
  },

  /**
   * Set password for Google OAuth users
   * Uses backend admin API to create email identity
   */
  async setPassword(password: string) {
    const { data } = await api.post<{ message: string; has_email_identity: boolean; user?: AuthUser }>(
      "/user/set-password",
      { password }
    );
    return data;
  },
};

export default authApi;
