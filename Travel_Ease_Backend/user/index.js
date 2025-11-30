import { User, BusinessFavorite, TravelPlanFavorite, Business, TravelPlan } from "../src/models/index.js";
import { executeWithRetry } from "../src/lib/sequelize.js";
import { handleSequelizeError, USER_SAFE_ATTRIBUTES } from "../src/lib/queryHelpers.js";
import { supabaseAdmin, isSupabaseConfigured } from "../src/lib/supabase.js";

async function register(req, res) {
  try {
    const { first_name, last_name, email, contact_no, password } = req.body;

    // Require Supabase configuration
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ 
        error: "Authentication service unavailable",
        details: "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      });
    }

    // Check if user already exists
    const existingUser = await executeWithRetry(() =>
      User.findOne({ where: { email } })
    );

    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // Register with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
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
      console.error("Supabase registration error:", error);
      return res.status(400).json({ error: error.message });
    }

    // Create user profile in our database with auth_provider set to 'password'
    const user = await executeWithRetry(() =>
      User.create({
        auth_id: data.user.id,
        email,
        first_name,
        last_name,
        contact_no,
        password: null,
        auth_provider: 'password',
        profile_completed: true  // Email registrations have complete profiles
      })
    );

    res.status(201).json({ 
      message: "User registered successfully",
      user: {
        user_id: user.user_id,
        auth_id: user.auth_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        contact_no: user.contact_no,
        auth_provider: user.auth_provider,
        profile_completed: user.profile_completed
      },
      supabase_user_id: data.user.id
    });
  } catch (error) {
    console.error("Error in register:", error);
    return handleSequelizeError(error, res, 'User registration');
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Require Supabase configuration
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ 
        error: "Authentication service unavailable",
        details: "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      });
    }

    // Login with Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Get user profile from our database
    const user = await executeWithRetry(() =>
      User.findOne({
        where: { auth_id: data.user.id },
        attributes: ['user_id', 'auth_id', 'first_name', 'last_name', 'email', 'contact_no', 'auth_provider', 'profile_completed']
      })
    );

    if (!user) {
      return res.status(404).json({ error: "User profile not found" });
    }

    res.json({
      message: "Login successful",
      user: {
        user_id: user.user_id,
        auth_id: user.auth_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        contact_no: user.contact_no,
        auth_provider: user.auth_provider || 'password',
        profile_completed: user.profile_completed
      },
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at
    });
  } catch (error) {
    console.error("Error in login:", error);
    return handleSequelizeError(error, res, 'User login');
  }
}

async function favorite(req, res) {
  try {
    const user_id = req.user.id;
    const { business_id, travel_plan_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (business_id) {
      const favorite = await executeWithRetry(() =>
        BusinessFavorite.create({ user_id, business_id })
      );
      return res.status(201).json({ 
        message: "Business added to favorites",
        favorite 
      });
    } else if (travel_plan_id) {
      const favorite = await executeWithRetry(() =>
        TravelPlanFavorite.create({ user_id, travel_plan_id })
      );
      return res.status(201).json({ 
        message: "Travel plan added to favorites",
        favorite 
      });
    } else {
      return res.status(400).json({ error: "Must provide either business_id or travel_plan_id" });
    }
  } catch (error) {
    console.error("Error adding favorite:", error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: "Already in favorites" });
    }
    
    return handleSequelizeError(error, res, 'Adding favorite');
  }
}

async function remove_favorite(req, res) {
  try {
    const user_id = req.user.id;
    const { business_id, travel_plan_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (business_id) {
      const deleted = await executeWithRetry(() =>
        BusinessFavorite.destroy({
          where: { user_id, business_id }
        })
      );
      
      if (deleted === 0) {
        return res.status(404).json({ error: "Favorite not found" });
      }
      
      return res.json({ message: "Business removed from favorites" });
    } else if (travel_plan_id) {
      const deleted = await executeWithRetry(() =>
        TravelPlanFavorite.destroy({
          where: { user_id, travel_plan_id }
        })
      );
      
      if (deleted === 0) {
        return res.status(404).json({ error: "Favorite not found" });
      }
      
      return res.json({ message: "Travel plan removed from favorites" });
    } else {
      return res.status(400).json({ error: "Must provide either business_id or travel_plan_id" });
    }
  } catch (error) {
    console.error("Error removing favorite:", error);
    return handleSequelizeError(error, res, 'Removing favorite');
  }
}

async function favorite_id(req, res) {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    const [businessFavorites, travelPlanFavorites] = await executeWithRetry(() =>
      Promise.all([
        BusinessFavorite.findAll({
          where: { user_id: userId },
          include: [{
            model: Business,
            as: 'business',
            attributes: ['business_id', 'name', 'description', 'picture', 'rating', 'city']
          }]
        }),
        TravelPlanFavorite.findAll({
          where: { user_id: userId },
          include: [{
            model: TravelPlan,
            as: 'travelPlan',
            attributes: ['travel_plan_id', 'name', 'description', 'start_date', 'end_date', 'location']
          }]
        })
      ])
    );

    res.json({
      business_favorites: businessFavorites,
      travel_plan_favorites: travelPlanFavorites
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return handleSequelizeError(error, res, 'Fetching favorites');
  }
}

async function user_id(req, res) {
  try {
    const { id } = req.params;

    const user = await executeWithRetry(() =>
      User.findByPk(parseInt(id), {
        attributes: ['user_id', 'auth_id', 'first_name', 'last_name', 'email', 'contact_no', 'created_at']
      })
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return handleSequelizeError(error, res, 'Fetching user');
  }
}

/**
 * OAuth sync endpoint - called after Supabase OAuth (e.g., Google sign-in)
 * Creates or retrieves the internal user profile linked to the Supabase auth_id
 * Returns the user profile + indicates if this is a new user (for onboarding)
 */
async function oauth_sync(req, res) {
  try {
    // The authenticateToken middleware already verified the token and attached req.user
    // req.user contains: { id, auth_id, email, first_name, last_name }
    const { id, auth_id, email, first_name, last_name } = req.user;

    // Fetch full user profile
    const user = await executeWithRetry(() =>
      User.findByPk(id, {
        attributes: ['user_id', 'auth_id', 'first_name', 'last_name', 'email', 'contact_no', 'auth_provider', 'profile_completed', 'created_at']
      })
    );

    if (!user) {
      return res.status(404).json({ error: "User profile not found" });
    }

    // Check if this is a newly created user (profile not completed)
    const isNewUser = !user.profile_completed;

    // If auth_provider is not set, update it to 'google' (for OAuth users)
    if (!user.auth_provider) {
      await user.update({ auth_provider: 'google' });
    }

    res.json({
      message: isNewUser ? "Welcome! Please complete your profile." : "OAuth sync successful",
      user: {
        user_id: user.user_id,
        auth_id: user.auth_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        contact_no: user.contact_no,
        auth_provider: user.auth_provider || 'google',
        profile_completed: user.profile_completed
      },
      isNewUser,
      needsOnboarding: isNewUser
    });
  } catch (error) {
    console.error("Error in oauth_sync:", error);
    return handleSequelizeError(error, res, 'OAuth sync');
  }
}

/**
 * Update user profile (for onboarding or profile edits)
 */
async function update_profile(req, res) {
  try {
    const userId = req.user.id;
    const { first_name, last_name, contact_no } = req.body;

    const user = await executeWithRetry(() =>
      User.findByPk(userId)
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update fields
    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (contact_no !== undefined) updateData.contact_no = contact_no;
    
    // Mark profile as completed if basic info is provided
    if (first_name && last_name) {
      updateData.profile_completed = true;
    }

    await user.update(updateData);

    res.json({
      message: "Profile updated successfully",
      user: {
        user_id: user.user_id,
        auth_id: user.auth_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        contact_no: user.contact_no,
        auth_provider: user.auth_provider,
        profile_completed: user.profile_completed
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return handleSequelizeError(error, res, 'Updating profile');
  }
}

/**
 * Get current user's own profile (from token)
 */
async function get_me(req, res) {
  try {
    const userId = req.user.id;

    const user = await executeWithRetry(() =>
      User.findByPk(userId, {
        attributes: ['user_id', 'auth_id', 'first_name', 'last_name', 'email', 'contact_no', 'auth_provider', 'profile_completed', 'created_at']
      })
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return handleSequelizeError(error, res, 'Fetching profile');
  }
}

/**
 * Delete current user's account
 */
async function delete_account(req, res) {
  try {
    const userId = req.user.id;
    const authId = req.user.auth_id;

    const user = await executeWithRetry(() =>
      User.findByPk(userId)
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete user from Supabase Auth if configured
    if (isSupabaseConfigured() && authId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(authId);
      } catch (supabaseError) {
        console.error("Error deleting user from Supabase:", supabaseError);
        // Continue with local deletion even if Supabase deletion fails
      }
    }

    // Delete associated favorites first
    await executeWithRetry(() =>
      Promise.all([
        BusinessFavorite.destroy({ where: { user_id: userId } }),
        TravelPlanFavorite.destroy({ where: { user_id: userId } })
      ])
    );

    // Delete user from local database
    await executeWithRetry(() =>
      user.destroy()
    );

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return handleSequelizeError(error, res, 'Deleting account');
  }
}

export { register, login, favorite, remove_favorite, favorite_id, user_id, oauth_sync, update_profile, get_me, delete_account };
