import { Request, Response } from 'express';
import { prisma, executeWithRetry, handlePrismaError } from '../../../lib/prismaHelpers.js';
import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabase.js';

interface PrismaError extends Error {
  code?: string;
}

export async function register(req: Request, res: Response) {
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
    // Email/password registration collects all required fields, so profile is complete
    // has_email_identity=true because they registered with email/password
    const user = await executeWithRetry(() =>
      prisma.user.create({
        data: {
          auth_id: data.user.id,
          email,
          first_name,
          last_name,
          contact_no,
          password: '[SECURED BY SUPABASE]',
          auth_provider: 'password',
          has_email_identity: true, // User can log in with email+password
          profile_completed: true, // Profile is complete for email/password registration
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
        contact_no: user.contact_no,
        auth_provider: 'password',
        has_email_identity: true,
        profile_completed: true,
        role: user.role,
      },
      supabase_user_id: data.user.id
    });
  } catch (error) {
    console.error('Error in register:', error);
    return handlePrismaError(error, res, 'User registration');
  }
}

export async function login(req: Request, res: Response) {
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
          contact_no: true,
          auth_provider: true,
          has_email_identity: true,
          profile_completed: true, role: true,
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
        contact_no: user.contact_no,
        auth_provider: user.auth_provider ?? 'password',
        has_email_identity: user.has_email_identity ?? (user.auth_provider === 'password'), // Derive from provider if not set
        profile_completed: user.profile_completed ?? true, // Existing users default to true
        role: user.role,
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

export async function favorite(req: Request, res: Response) {
  try {
    const user_id = req.user!.id;
    const { business_id, travel_plan_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (business_id) {
      const fav = await executeWithRetry(() =>
        prisma.business_favorite.create({
          data: { user_id, business_id }
        })
      );
      return res.status(201).json({
        message: 'Business added to favorites',
        favorite: fav
      });
    } else if (travel_plan_id) {
      const fav = await executeWithRetry(() =>
        prisma.travel_plan_favorite.create({
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

export async function remove_favorite(req: Request, res: Response) {
  try {
    const user_id = req.user!.id;
    const { business_id, travel_plan_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (business_id) {
      const existing = await executeWithRetry(() =>
        prisma.business_favorite.findFirst({
          where: { user_id, business_id }
        })
      );

      if (!existing) {
        return res.status(404).json({ error: 'Favorite not found' });
      }

      await executeWithRetry(() =>
        prisma.business_favorite.delete({
          where: { favorite_id: existing.favorite_id }
        })
      );

      return res.json({ message: 'Business removed from favorites' });
    } else if (travel_plan_id) {
      const existing = await executeWithRetry(() =>
        prisma.travel_plan_favorite.findFirst({
          where: { user_id, travel_plan_id }
        })
      );

      if (!existing) {
        return res.status(404).json({ error: 'Favorite not found' });
      }

      await executeWithRetry(() =>
        prisma.travel_plan_favorite.delete({
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

export async function favorite_id(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    const [businessFavorites, travelPlanFavorites] = await executeWithRetry(() =>
      Promise.all([
        prisma.business_favorite.findMany({
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
        prisma.travel_plan_favorite.findMany({
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

export async function user_id(req: Request, res: Response) {
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
export async function oauth_sync(req: Request, res: Response) {
  try {
    // The authenticateToken middleware already verified the token and attached req.user
    const { id, email: userEmailFromToken } = req.user!;

    // Get the token from authorization header to verify Google email
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1]; // Bearer TOKEN

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
          has_email_identity: true,
          profile_completed: true,
        },
      })
    );

    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Email verification: Compare Google email from Supabase with user email from database
    if (token && isSupabaseConfigured()) {
      try {
        const { data: supabaseUserData, error: supabaseError } = await supabaseAdmin!.auth.getUser(token);

        if (!supabaseError && supabaseUserData?.user?.email) {
          const googleEmail = supabaseUserData.user.email.toLowerCase();
          const dbEmail = user.email.toLowerCase();

          // Verify email matches
          if (googleEmail !== dbEmail) {
            return res.status(400).json({
              error: "Google account email does not match your registered email",
              code: "EMAIL_MISMATCH",
            });
          }
        }
      } catch (supabaseError) {
        // If we can't verify email from Supabase, log but don't block
        // The authenticateToken middleware already verified the token
        console.warn('Could not verify Google email from Supabase:', supabaseError);
      }
    }

    // Update auth_provider to 'google' if it's not already set
    let updatedUser = user;
    if (user.auth_provider !== 'google') {
      updatedUser = await executeWithRetry(() =>
        prisma.user.update({
          where: { user_id: id },
          data: { auth_provider: 'google' },
          select: {
            user_id: true,
            auth_id: true,
            first_name: true,
            last_name: true,
            email: true,
            contact_no: true,
            created_at: true,
            auth_provider: true,
            has_email_identity: true,
            profile_completed: true,
            role: true,
          },
        })
      );
    }

    // Determine onboarding state based on profile_completed flag
    // A user needs onboarding if profile_completed is false/null
    const needsOnboarding = !updatedUser.profile_completed;

    // isNewUser: profile was just created via OAuth (first sign-in)
    // We treat users without profile_completed as new users
    const isNewUser = !updatedUser.profile_completed;

    res.json({
      message: needsOnboarding ? 'Welcome! Please complete your profile.' : 'OAuth sync successful',
      user: {
        user_id: updatedUser.user_id,
        auth_id: updatedUser.auth_id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        contact_no: updatedUser.contact_no,
        auth_provider: updatedUser.auth_provider ?? 'google',
        has_email_identity: updatedUser.has_email_identity ?? false, // Google OAuth users start without email identity
        profile_completed: updatedUser.profile_completed ?? false,
        role: updatedUser.role,
      },
      isNewUser,
      needsOnboarding,
    });
  } catch (error) {
    console.error('Error in oauth_sync:', error);
    return handlePrismaError(error, res, 'OAuth sync');
  }
}

/**
 * Update user profile (for onboarding or profile edits)
 * Sets profile_completed = true when required fields (first_name, last_name) are provided
 */
export async function update_profile(req: Request, res: Response) {
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

    // Build update data
    const updateData: Record<string, string | boolean> = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (contact_no !== undefined) updateData.contact_no = contact_no;

    // Determine if profile should be marked as completed
    // Profile is complete when first_name and last_name are set
    const finalFirstName = first_name ?? user.first_name;
    const finalLastName = last_name ?? user.last_name;
    const isProfileComplete = Boolean(finalFirstName?.trim() && finalLastName?.trim());

    // Only set profile_completed to true, never revert to false on update
    if (isProfileComplete && !user.profile_completed) {
      updateData.profile_completed = true;
    }

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
        contact_no: updatedUser.contact_no,
        auth_provider: updatedUser.auth_provider ?? 'password',
        has_email_identity: updatedUser.has_email_identity ?? (updatedUser.auth_provider === 'password'),
        profile_completed: updatedUser.profile_completed ?? false,
        role: updatedUser.role,
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
export async function get_me(req: Request, res: Response) {
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
          created_at: true,
          auth_provider: true,
          has_email_identity: true,
          profile_completed: true,
          role: true,
        }
      })
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user_id: user.user_id,
      auth_id: user.auth_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      contact_no: user.contact_no,
      created_at: user.created_at,
      auth_provider: user.auth_provider ?? 'password',
      has_email_identity: user.has_email_identity ?? (user.auth_provider === 'password'),
      profile_completed: user.profile_completed ?? true,
      role: user.role,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return handlePrismaError(error, res, 'Fetching profile');
  }
}

/**
 * Delete current user's account
 */
export async function delete_account(req: Request, res: Response) {
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
        prisma.business_favorite.deleteMany({ where: { user_id: userId } }),
        prisma.travel_plan_favorite.deleteMany({ where: { user_id: userId } })
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

/**
 * Disconnect Google account from user
 * Requires user to have set a password first (has_email_identity = true)
 * Updates auth_provider to 'password' after successful password verification
 * 
 * Flow:
 * 1. Check has_email_identity flag in our DB (set when user calls set_password)
 * 2. Verify password by signing in with Supabase
 * 3. Update auth_provider to 'password' in our DB
 */
export async function disconnect_google(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Password is required',
        code: 'PASSWORD_REQUIRED'
      });
    }

    // Require Supabase configuration
    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        error: 'Authentication service unavailable',
        code: 'DB_UNAVAILABLE'
      });
    }

    // Get user from database
    const user = await executeWithRetry(() =>
      prisma.user.findUnique({
        where: { user_id: userId }
      })
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.auth_provider !== 'google') {
      return res.status(400).json({
        error: 'Account is not connected with Google',
        code: 'NOT_GOOGLE_ACCOUNT'
      });
    }

    // Verify the password by attempting to sign in with email+password
    // This confirms the user has set a password and knows it
    const { error: passwordError } = await supabaseAdmin!.auth.signInWithPassword({
      email: user.email,
      password
    });

    if (passwordError) {
      console.error('Password verification failed:', passwordError.message);

      // If sign-in failed, check if it's because no password is set
      // vs. wrong password
      if (passwordError.message?.toLowerCase().includes('invalid login credentials')) {
        // Could be wrong password OR no email identity
        // Check our flag to give better error message
        if (!user.has_email_identity) {
          return res.status(400).json({
            error: 'You must set a password before disconnecting Google. This creates an email login method.',
            code: 'NO_EMAIL_IDENTITY'
          });
        }
      }

      return res.status(401).json({
        error: 'Incorrect password',
        code: 'INVALID_PASSWORD'
      });
    }

    // Password verified - user definitely has email identity
    // Update our flag if it was somehow out of sync
    if (!user.has_email_identity) {
      await executeWithRetry(() =>
        prisma.user.update({
          where: { user_id: userId },
          data: { has_email_identity: true }
        })
      );
    }

    // Password verified - update auth_provider to 'password' in our database
    // The user can now only sign in with email+password
    const userAfterDisconnect = await executeWithRetry(() =>
      prisma.user.update({
        where: { user_id: userId },
        data: { auth_provider: 'password' },
        select: {
          user_id: true,
          auth_id: true,
          first_name: true,
          last_name: true,
          email: true,
          contact_no: true,
          auth_provider: true,
          has_email_identity: true,
          profile_completed: true,
          role: true,
        }
      })
    );

    res.json({
      message: 'Google account disconnected successfully. You can now only sign in with your email and password.',
      user: {
        user_id: userAfterDisconnect.user_id,
        auth_id: userAfterDisconnect.auth_id,
        first_name: userAfterDisconnect.first_name,
        last_name: userAfterDisconnect.last_name,
        email: userAfterDisconnect.email,
        contact_no: userAfterDisconnect.contact_no,
        auth_provider: userAfterDisconnect.auth_provider,
        has_email_identity: userAfterDisconnect.has_email_identity,
        profile_completed: userAfterDisconnect.profile_completed,
        role: userAfterDisconnect.role,
      },
    });
  } catch (error) {
    console.error('Error disconnecting Google:', error);
    return handlePrismaError(error, res, 'Disconnecting Google');
  }
}

/**
 * Set password for Google OAuth users
 * This uses the admin API to update the user's password, creating an email identity
 * Required for Google users who want to disconnect their Google account
 */
export async function set_password(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const authId = req.user!.auth_id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Password is required',
        code: 'PASSWORD_REQUIRED'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Require Supabase configuration
    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        error: 'Authentication service unavailable',
        code: 'DB_UNAVAILABLE'
      });
    }

    // Get user from database
    const user = await executeWithRetry(() =>
      prisma.user.findUnique({
        where: { user_id: userId }
      })
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only Google users need this endpoint
    if (user.auth_provider !== 'google') {
      return res.status(400).json({
        error: 'This endpoint is only for Google OAuth users. Use the standard password change flow.',
        code: 'NOT_GOOGLE_USER'
      });
    }

    // Use admin API to update user's password
    // This creates an email identity for OAuth users
    if (!authId) {
      return res.status(400).json({
        error: 'User auth ID not found',
        code: 'NO_AUTH_ID'
      });
    }
    const { error: updateError } = await supabaseAdmin!.auth.admin.updateUserById(
      authId,
      { password }
    );

    if (updateError) {
      console.error('Supabase set password error:', updateError);
      return res.status(400).json({
        error: 'Failed to set password. Please try again.',
        code: 'SET_PASSWORD_FAILED',
        details: updateError.message
      });
    }

    // Update has_email_identity to true since user now has a password
    const updatedUser = await executeWithRetry(() =>
      prisma.user.update({
        where: { user_id: userId },
        data: { has_email_identity: true },
        select: {
          user_id: true,
          auth_id: true,
          first_name: true,
          last_name: true,
          email: true,
          contact_no: true,
          auth_provider: true,
          has_email_identity: true,
          profile_completed: true,
          role: true,
        }
      })
    );

    res.json({
      message: 'Password set successfully. You can now log in with your email and password, or disconnect your Google account.',
      has_email_identity: true,
      user: {
        user_id: updatedUser.user_id,
        auth_id: updatedUser.auth_id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        contact_no: updatedUser.contact_no,
        auth_provider: updatedUser.auth_provider,
        has_email_identity: updatedUser.has_email_identity,
        profile_completed: updatedUser.profile_completed,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Error setting password:', error);
    return handlePrismaError(error, res, 'Setting password');
  }
}

/**
 * Search users by email (for collaborator autocomplete)
 * Returns matching users excluding the current user
 */
export async function search_users(req: Request, res: Response) {
  try {
    const { q } = req.query;
    const currentUserId = req.user!.id;

    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json([]);
    }

    const users = await executeWithRetry(() =>
      prisma.user.findMany({
        where: {
          email: {
            contains: q,
            mode: 'insensitive'
          },
          user_id: {
            not: currentUserId
          }
        },
        select: {
          user_id: true,
          email: true,
          first_name: true,
          last_name: true
        },
        take: 5
      })
    );

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    return handlePrismaError(error, res, 'Searching users');
  }
}

/**
 * Change a user's role (SUPER_ADMIN only)
 * Validates that TRAVEL_AGENCY assignment requires Google verification
 */
export async function change_user_role(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const validRoles = ['SUPER_ADMIN', 'LGU_ADMIN', 'BUSINESS_OWNER', 'TRAVEL_AGENCY', 'USER'];

    // Validate role
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: `Role must be one of: ${validRoles.join(', ')}`
      });
    }

    const targetUserId = parseInt(userId, 10);
    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Fetch target user
    const targetUser = await executeWithRetry(() =>
      prisma.user.findUnique({
        where: { user_id: targetUserId }
      })
    );

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If assigning TRAVEL_AGENCY, ensure user is Google verified
    if (role === 'TRAVEL_AGENCY') {
      if (targetUser.auth_provider !== 'google' || !targetUser.has_email_identity) {
        return res.status(400).json({
          error: 'Cannot assign TRAVEL_AGENCY role',
          message: 'User must be verified with Google (auth_provider=google and has_email_identity=true)'
        });
      }
    }

    // Update user role
    const updatedUser = await executeWithRetry(() =>
      prisma.user.update({
        where: { user_id: targetUserId },
        data: { role: role as any }
      })
    );

    res.json({
      message: 'User role updated successfully',
      user: {
        user_id: updatedUser.user_id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Error changing user role:', error);
    return handlePrismaError(error, res, 'Changing user role');
  }
}

/**
 * Upgrade current user to TRAVEL_AGENCY role
 * Requirement: Must be verified with Google
 */
export async function upgrade_to_travel_agency(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    const user = await executeWithRetry(() =>
      prisma.user.findUnique({
        where: { user_id: userId }
      })
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already has the role
    if (user.role === 'TRAVEL_AGENCY') {
      return res.json({
        message: 'You are already a Travel Agency',
        user: {
          user_id: user.user_id,
          role: user.role
        }
      });
    }

    // Verify Google authentication requirement
    if (user.auth_provider !== 'google' || !user.has_email_identity) {
      return res.status(400).json({
        error: 'Cannot upgrade to Travel Agency',
        message: 'To become a Travel Agency, you must verify your account with Google first.',
        code: 'GOOGLE_AUTH_REQUIRED'
      });
    }

    // Perform upgrade
    const updatedUser = await executeWithRetry(() =>
      prisma.user.update({
        where: { user_id: userId },
        data: { role: 'TRAVEL_AGENCY' },
        select: {
          user_id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true
        }
      })
    );

    res.json({
      message: 'Successfully upgraded to Travel Agency',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error upgrading to travel agency:', error);
    return handlePrismaError(error, res, 'Upgrading to travel agency');
  }
}
