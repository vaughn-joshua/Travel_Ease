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

    // Create user profile in our database
    const user = await executeWithRetry(() =>
      User.create({
        auth_id: data.user.id,
        email,
        first_name,
        last_name,
        contact_no,
        password: null
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
        contact_no: user.contact_no
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
        attributes: ['user_id', 'auth_id', 'first_name', 'last_name', 'email', 'contact_no']
      })
    );

    if (!user) {
      return res.status(404).json({ error: "User profile not found" });
    }

    res.json({
      message: "Login successful",
      user,
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

export { register, login, favorite, remove_favorite, favorite_id, user_id };
