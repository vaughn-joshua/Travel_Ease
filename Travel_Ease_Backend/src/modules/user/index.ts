import { Request, Response } from 'express';
import { prisma, executeWithRetry, handlePrismaError } from '../../lib/prismaHelpers.js';
import { supabaseAdmin, isSupabaseConfigured } from '../../lib/supabase.js';

interface PrismaError extends Error {
  code?: string;
}

async function register(req: Request, res: Response) {
  try {
    const { first_name, last_name, email, contact_no, password } = req.body;

    // Require Supabase configuration
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ 
        error: 'Authentication service unavailable',
        details: 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
      });
    }

    // Check if user already exists
    const existingUser = await executeWithRetry(() =>
      prisma.user.findUnique({ where: { email } })
    );

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

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
      console.error('Supabase registration error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Create user profile in our database
    const user = await executeWithRetry(() =>
      prisma.user.create({
        data: {
          auth_id: data.user.id,
          email,
          first_name,
          last_name,
          contact_no,
          password: null
        }
      })
    );

    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        user_id: user.user_id,
        auth_id: user.auth_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        contact_no: user.contact_no
      },
      supabase_user_id: data.user.id
    });
  } catch (error) {
    console.error('Error in register:', error);
    return handlePrismaError(error, res, 'User registration');
  }
}

async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Require Supabase configuration
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ 
        error: 'Authentication service unavailable',
        details: 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
      });
    }

    // Login with Supabase
    const { data, error } = await supabaseAdmin!.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({
      message: 'Login successful',
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
      expires_at: data.session.expires_at
    });
  } catch (error) {
    console.error('Error in login:', error);
    return handlePrismaError(error, res, 'User login');
  }
}

async function favorite(req: Request, res: Response) {
  try {
    const user_id = req.user!.id;
    const { business_id, travel_plan_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (business_id) {
      const fav = await executeWithRetry(() =>
        prisma.businessFavorite.create({
          data: { user_id, business_id }
        })
      );
      return res.status(201).json({ 
        message: 'Business added to favorites',
        favorite: fav
      });
    } else if (travel_plan_id) {
      const fav = await executeWithRetry(() =>
        prisma.travelPlanFavorite.create({
          data: { user_id, travel_plan_id }
        })
      );
      return res.status(201).json({ 
        message: 'Travel plan added to favorites',
        favorite: fav
      });
    } else {
      return res.status(400).json({ error: 'Must provide either business_id or travel_plan_id' });
    }
  } catch (error) {
    console.error('Error adding favorite:', error);
    
    const prismaError = error as PrismaError;
    if (prismaError.code === 'P2002') {
      return res.status(409).json({ error: 'Already in favorites' });
    }
    
    return handlePrismaError(error, res, 'Adding favorite');
  }
}

async function remove_favorite(req: Request, res: Response) {
  try {
    const user_id = req.user!.id;
    const { business_id, travel_plan_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (business_id) {
      const existing = await executeWithRetry(() =>
        prisma.businessFavorite.findFirst({
          where: { user_id, business_id }
        })
      );
      
      if (!existing) {
        return res.status(404).json({ error: 'Favorite not found' });
      }

      await executeWithRetry(() =>
        prisma.businessFavorite.delete({
          where: { favorite_id: existing.favorite_id }
        })
      );
      
      return res.json({ message: 'Business removed from favorites' });
    } else if (travel_plan_id) {
      const existing = await executeWithRetry(() =>
        prisma.travelPlanFavorite.findFirst({
          where: { user_id, travel_plan_id }
        })
      );
      
      if (!existing) {
        return res.status(404).json({ error: 'Favorite not found' });
      }

      await executeWithRetry(() =>
        prisma.travelPlanFavorite.delete({
          where: { favorite_id: existing.favorite_id }
        })
      );
      
      return res.json({ message: 'Travel plan removed from favorites' });
    } else {
      return res.status(400).json({ error: 'Must provide either business_id or travel_plan_id' });
    }
  } catch (error) {
    console.error('Error removing favorite:', error);
    return handlePrismaError(error, res, 'Removing favorite');
  }
}

async function favorite_id(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

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

    res.json({
      business_favorites: businessFavorites,
      travel_plan_favorites: travelPlanFavorites
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return handlePrismaError(error, res, 'Fetching favorites');
  }
}

async function user_id(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const user = await executeWithRetry(() =>
      prisma.user.findUnique({
        where: { user_id: parseInt(id) },
        select: {
          user_id: true,
          auth_id: true,
          first_name: true,
          last_name: true,
          email: true,
          contact_no: true,
          created_at: true
        }
      })
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return handlePrismaError(error, res, 'Fetching user');
  }
}

/**
 * OAuth sync endpoint - called after Supabase OAuth (e.g., Google sign-in)
 * Creates or retrieves the internal user profile linked to the Supabase auth_id
 * Returns the user profile + indicates if this is a new user (for onboarding)
 */
async function oauth_sync(req: Request, res: Response) {
  try {
    // The authenticateToken middleware already verified the token and attached req.user
    const { id } = req.user!;

    // Fetch full user profile
    const user = await executeWithRetry(() =>
      prisma.user.findUnique({
        where: { user_id: id },
        select: {
          user_id: true,
          auth_id: true,
          first_name: true,
          last_name: true,
          email: true,
          contact_no: true,
          created_at: true,
          auth_provider: true,
        },
      })
    );

    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Check if this is a newly created user (no contact info = likely new)
    const isNewUser = !user.contact_no;

    res.json({
      message: isNewUser ? 'Welcome! Please complete your profile.' : 'OAuth sync successful',
      user: {
        user_id: user.user_id,
        auth_id: user.auth_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        contact_no: user.contact_no,
        auth_provider: user.auth_provider ?? 'google',
      },
      isNewUser,
      needsOnboarding: isNewUser,
    });
  } catch (error) {
    console.error('Error in oauth_sync:', error);
    return handlePrismaError(error, res, 'OAuth sync');
  }
}

/**
 * Update user profile (for onboarding or profile edits)
 */
async function update_profile(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { first_name, last_name, contact_no } = req.body;

    const user = await executeWithRetry(() =>
      prisma.user.findUnique({
        where: { user_id: userId }
      })
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    const updateData: Record<string, string> = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (contact_no !== undefined) updateData.contact_no = contact_no;

    const updatedUser = await executeWithRetry(() =>
      prisma.user.update({
        where: { user_id: userId },
        data: updateData
      })
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        user_id: updatedUser.user_id,
        auth_id: updatedUser.auth_id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        contact_no: updatedUser.contact_no
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return handlePrismaError(error, res, 'Updating profile');
  }
}

/**
 * Get current user's own profile (from token)
 */
async function get_me(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

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
          created_at: true
        }
      })
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return handlePrismaError(error, res, 'Fetching profile');
  }
}

/**
 * Delete current user's account
 */
async function delete_account(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const authId = req.user!.auth_id;

    const user = await executeWithRetry(() =>
      prisma.user.findUnique({
        where: { user_id: userId }
      })
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
      prisma.user.delete({
        where: { user_id: userId }
      })
    );

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return handlePrismaError(error, res, 'Deleting account');
  }
}

export { register, login, favorite, remove_favorite, favorite_id, user_id, oauth_sync, update_profile, get_me, delete_account };

