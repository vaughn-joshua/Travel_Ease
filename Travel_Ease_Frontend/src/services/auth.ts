import api from "./api";

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

export interface AuthUser {
  user_id: number;
  auth_id?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  contact_no?: string | null;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  token: string;
  refresh_token?: string;
  expires_at?: number;
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
};

export default authApi;
