import { Request, Response, NextFunction } from "express";
import {
  TravelPlan,
  Activity,
  Business,
  User,
  Participant,
  Blog,
} from "@prisma/client";

// Extend Express Request to include custom properties
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      /** Validated request body (from validate middleware) */
      validated?: unknown;
      /** Validated query parameters (from validateQuery middleware) */
      validatedQuery?: unknown;
      /** Validated route parameters (from validateParams middleware) */
      validatedParams?: unknown;
      plan?: TravelPlan;
      activity?: Activity & { travel_plan?: TravelPlan | null };
      business?: Business;
      isOwner?: boolean;
      participant?: Participant;
      /** Request ID for tracing (from requestLogger middleware) */
      requestId?: string;
    }
  }
}

// ============================================================================
// Authentication Types
// ============================================================================

/** Auth provider type */
export type AuthProvider = 'password' | 'google';

/** Authenticated user object attached to request */
export interface AuthUser {
  id: number;
  auth_id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  auth_provider?: AuthProvider;
  profile_completed?: boolean;
}

/** OAuth sync response DTO */
export interface OAuthSyncResponse {
  message: string;
  user: AuthUserDTO;
  isNewUser: boolean;
  needsOnboarding: boolean;
}

/** Auth user DTO returned to clients */
export interface AuthUserDTO {
  user_id: number;
  auth_id?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  contact_no?: string | null;
  auth_provider?: AuthProvider;
  profile_completed?: boolean;
}

/** Login response DTO */
export interface LoginResponse {
  message: string;
  user: AuthUserDTO;
  token: string;
  refresh_token?: string;
  expires_at?: number;
}

/** Register response DTO */
export interface RegisterResponse {
  message: string;
  user: AuthUserDTO;
  supabase_user_id?: string;
}

// Express handler types
export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

export type SyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Response;

// Pagination types
export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Travel Plan DTOs
export interface CreatePlanDTO {
  title: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  slots?: number;
  max_slots?: number;
  collaborators?: CollaboratorDTO[];
}

export interface CollaboratorDTO {
  user_id: number;
  role?: "Admin" | "Editor" | "Viewer";
  status?: boolean;
}

export interface PlanDTO {
  travel_plan_id: number;
  name: string;
  user_id: number;
  start_date: Date | null;
  end_date: Date | null;
  description: string | null;
  max_slots: number | null;
  location: string | null;
  status: string;
  visibility: boolean;
  created_at: Date;
  updated_at: Date;
}

// Activity DTOs
export interface CreateActivityDTO {
  travel_plan_id: number;
  notes?: string;
  target_date?: string;
  budget_range?: string;
  lat?: number;
  lng?: number;
  location?: string;
  name?: string;
  brgy?: string;
  province?: string;
  city?: string;
}

// Business DTOs
export interface CreateBusinessDTO {
  name: string;
  house_no?: string;
  street?: string;
  brgy?: string;
  city?: string;
  description?: string;
  lat?: number | null;
  lng?: number | null;
  secure_url?: string;
  category: string[];
  business_hrs?: BusinessHoursDTO[];
  min_price?: number;
  max_price?: number;
}

export interface BusinessHoursDTO {
  day: string;
  start?: string;
  end?: string;
}

// Map types
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Place {
  name: string;
  address: string;
  coordinates: Coordinates;
  placeId?: string;
}

export interface RouteResult {
  distance: number;
  duration: number;
  geometry: unknown;
}

// Cache types
export interface CacheResult<T> {
  data: T;
  fromCache: boolean;
}

// API Error
export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export {};
