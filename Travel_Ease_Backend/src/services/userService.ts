/**
 * User Service
 * 
 * Business logic for user operations extracted from controllers.
 * Controllers should use these functions and handle HTTP request/response.
 */

import { prisma, executeWithRetry } from '../lib/prismaHelpers.js';
import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase.js';

// ============================================================================
// Types / DTOs
// ============================================================================

export interface UserDTO {
  user_id: number;
  auth_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  contact_no: string | null;
  auth_provider?: string | null;
  created_at?: Date | null;
}

export interface RegisterInput {
  first_name: string;
  last_name: string;
  email: string;
  contact_no?: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  first_name?: string;
  last_name?: string;
  contact_no?: string;
}

export interface LoginResult {
  user: UserDTO;
  token: string;
  refresh_token: string;
  expires_at: number;
}

export interface RegisterResult {
  user: UserDTO;
  supabase_user_id: string;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Check if Supabase authentication is configured
 */
export function checkSupabaseConfigured(): boolean {
  return isSupabaseConfigured();
}

/**
 * Check if a user with the given email already exists
 */
export async function userExistsByEmail(email: string): Promise<boolean> {
  const existingUser = await executeWithRetry(() =>
    prisma.user.findUnique({ where: { email } })
  );
  return !!existingUser;
}

/**
 * Register a new user with Supabase Auth and create local profile
 */
export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const { first_name, last_name, email, contact_no, password } = input;

  // Register with Supabase Auth
  const { data, error } = await supabaseAdmin!.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name,
      last_name,
      contact_no
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  // Create user profile in our database
  const user = await executeWithRetry(() =>
    prisma.user.create({
      data: {
        auth_id: data.user.id,
        email,
        first_name,
        last_name,
        contact_no: contact_no || null,
        password: null
      }
    })
  );

  return {
    user: {
      user_id: user.user_id,
      auth_id: user.auth_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      contact_no: user.contact_no
    },
    supabase_user_id: data.user.id
  };
}

/**
 * Login user with Supabase Auth and retrieve local profile
 */
export async function loginUser(input: LoginInput): Promise<LoginResult | null> {
  const { email, password } = input;

  // Login with Supabase
  const { data, error } = await supabaseAdmin!.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return null;
  }

  // Get user profile from our database
  const user = await executeWithRetry(() =>
    prisma.user.findFirst({
      where: { auth_id: data.user.id },
      select: {
        user_id: true,
        auth_id: true,
        first_name: true,
        last_name: true,
        email: true,
        contact_no: true
      }
    })
  );

  if (!user) {
    return null;
  }

  return {
    user: {
      user_id: user.user_id,
      auth_id: user.auth_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      contact_no: user.contact_no
    },
    token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at!
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number): Promise<UserDTO | null> {
  const user = await executeWithRetry(() =>
    prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        auth_id: true,
        first_name: true,
        last_name: true,
        email: true,
        contact_no: true,
        created_at: true,
        auth_provider: true
      }
    })
  );

  return user;
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: number, input: UpdateProfileInput): Promise<UserDTO | null> {
  const user = await executeWithRetry(() =>
    prisma.user.findUnique({ where: { user_id: userId } })
  );

  if (!user) {
    return null;
  }

  const updateData: Record<string, string> = {};
  if (input.first_name !== undefined) updateData.first_name = input.first_name;
  if (input.last_name !== undefined) updateData.last_name = input.last_name;
  if (input.contact_no !== undefined) updateData.contact_no = input.contact_no;

  const updatedUser = await executeWithRetry(() =>
    prisma.user.update({
      where: { user_id: userId },
      data: updateData
    })
  );

  return {
    user_id: updatedUser.user_id,
    auth_id: updatedUser.auth_id,
    first_name: updatedUser.first_name,
    last_name: updatedUser.last_name,
    email: updatedUser.email,
    contact_no: updatedUser.contact_no
  };
}

/**
 * Delete user account (from Supabase and local database)
 */
export async function deleteUserAccount(userId: number, authId: string | null): Promise<boolean> {
  const user = await executeWithRetry(() =>
    prisma.user.findUnique({ where: { user_id: userId } })
  );

  if (!user) {
    return false;
  }

  // Delete user from Supabase Auth if configured
  if (isSupabaseConfigured() && authId) {
    try {
      await supabaseAdmin!.auth.admin.deleteUser(authId);
    } catch (supabaseError) {
      console.error('Error deleting user from Supabase:', supabaseError);
      // Continue with local deletion even if Supabase deletion fails
    }
  }

  // Delete associated favorites first
  await executeWithRetry(() =>
    Promise.all([
      prisma.businessFavorite.deleteMany({ where: { user_id: userId } }),
      prisma.travelPlanFavorite.deleteMany({ where: { user_id: userId } })
    ])
  );

  // Delete user from local database
  await executeWithRetry(() =>
    prisma.user.delete({ where: { user_id: userId } })
  );

  return true;
}

/**
 * Search users by email (for collaborator autocomplete)
 */
export async function searchUsersByEmail(query: string, excludeUserId: number): Promise<UserDTO[]> {
  const users = await executeWithRetry(() =>
    prisma.user.findMany({
      where: {
        email: {
          contains: query,
          mode: 'insensitive'
        },
        user_id: {
          not: excludeUserId
        }
      },
      select: {
        user_id: true,
        auth_id: true,
        email: true,
        first_name: true,
        last_name: true,
        contact_no: true
      },
      take: 5
    })
  );

  return users;
}

/**
 * Add business to favorites
 */
export async function addBusinessFavorite(userId: number, businessId: number) {
  return executeWithRetry(() =>
    prisma.businessFavorite.create({
      data: { user_id: userId, business_id: businessId }
    })
  );
}

/**
 * Add travel plan to favorites
 */
export async function addTravelPlanFavorite(userId: number, travelPlanId: number) {
  return executeWithRetry(() =>
    prisma.travelPlanFavorite.create({
      data: { user_id: userId, travel_plan_id: travelPlanId }
    })
  );
}

/**
 * Remove business from favorites
 */
export async function removeBusinessFavorite(userId: number, businessId: number): Promise<boolean> {
  const existing = await executeWithRetry(() =>
    prisma.businessFavorite.findFirst({
      where: { user_id: userId, business_id: businessId }
    })
  );

  if (!existing) {
    return false;
  }

  await executeWithRetry(() =>
    prisma.businessFavorite.delete({
      where: { favorite_id: existing.favorite_id }
    })
  );

  return true;
}

/**
 * Remove travel plan from favorites
 */
export async function removeTravelPlanFavorite(userId: number, travelPlanId: number): Promise<boolean> {
  const existing = await executeWithRetry(() =>
    prisma.travelPlanFavorite.findFirst({
      where: { user_id: userId, travel_plan_id: travelPlanId }
    })
  );

  if (!existing) {
    return false;
  }

  await executeWithRetry(() =>
    prisma.travelPlanFavorite.delete({
      where: { favorite_id: existing.favorite_id }
    })
  );

  return true;
}

/**
 * Get user's favorites
 */
export async function getUserFavorites(userId: number) {
  const [businessFavorites, travelPlanFavorites] = await executeWithRetry(() =>
    Promise.all([
      prisma.businessFavorite.findMany({
        where: { user_id: userId },
        include: {
          business: {
            select: {
              business_id: true,
              name: true,
              description: true,
              picture: true,
              rating: true,
              city: true
            }
          }
        }
      }),
      prisma.travelPlanFavorite.findMany({
        where: { user_id: userId },
        include: {
          travel_plan: {
            select: {
              travel_plan_id: true,
              name: true,
              description: true,
              start_date: true,
              end_date: true,
              location: true
            }
          }
        }
      })
    ])
  );

  return { businessFavorites, travelPlanFavorites };
}

