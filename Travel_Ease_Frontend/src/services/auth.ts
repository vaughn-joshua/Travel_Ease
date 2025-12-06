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
  profile_completed?: boolean;
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
   * @deprecated Not currently used. Could be implemented for session validation on app load.
   * Profile is currently loaded during login/OAuth sync and stored in localStorage.
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
};

export default authApi;
