import { prisma } from "../src/lib/prisma.js";
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
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

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
    const user = await prisma.user.create({
      data: {
        auth_id: data.user.id,
        email,
        first_name,
        last_name,
        contact_no,
        password: null
      },
      select: {
        user_id: true,
        auth_id: true,
        first_name: true,
        last_name: true,
        email: true,
        contact_no: true
      }
    });

    res.status(201).json({ 
      message: "User registered successfully",
      user,
      supabase_user_id: data.user.id
    });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ error: error.message });
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
    const user = await prisma.user.findUnique({
      where: { auth_id: data.user.id },
      select: {
        user_id: true,
        auth_id: true,
        first_name: true,
        last_name: true,
        email: true,
        contact_no: true
      }
    });

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
    res.status(500).json({ error: error.message });
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
      const favorite = await prisma.businessFavorite.create({
        data: {
          user_id,
          business_id
        }
      });
      return res.status(201).json({ 
        message: "Business added to favorites",
        favorite 
      });
    } else if (travel_plan_id) {
      const favorite = await prisma.travelPlanFavorite.create({
        data: {
          user_id,
          travel_plan_id
        }
      });
      return res.status(201).json({ 
        message: "Travel plan added to favorites",
        favorite 
      });
    } else {
      return res.status(400).json({ error: "Must provide either business_id or travel_plan_id" });
    }
  } catch (error) {
    console.error("Error adding favorite:", error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Already in favorites" });
    }
    
    res.status(500).json({ error: error.message });
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
      const deleted = await prisma.businessFavorite.deleteMany({
        where: {
          user_id,
          business_id
        }
      });
      
      if (deleted.count === 0) {
        return res.status(404).json({ error: "Favorite not found" });
      }
      
      return res.json({ message: "Business removed from favorites" });
    } else if (travel_plan_id) {
      const deleted = await prisma.travelPlanFavorite.deleteMany({
        where: {
          user_id,
          travel_plan_id
        }
      });
      
      if (deleted.count === 0) {
        return res.status(404).json({ error: "Favorite not found" });
      }
      
      return res.json({ message: "Travel plan removed from favorites" });
    } else {
      return res.status(400).json({ error: "Must provide either business_id or travel_plan_id" });
    }
  } catch (error) {
    console.error("Error removing favorite:", error);
    res.status(500).json({ error: error.message });
  }
}

async function favorite_id(req, res) {
  try {
    const { id } = req.params;

    const [businessFavorites, travelPlanFavorites] = await Promise.all([
      prisma.businessFavorite.findMany({
        where: { user_id: parseInt(id) },
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
        where: { user_id: parseInt(id) },
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
    ]);

    res.json({
      business_favorites: businessFavorites,
      travel_plan_favorites: travelPlanFavorites
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: error.message });
  }
}

async function user_id(req, res) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
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
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: error.message });
  }
}

export { register, login, favorite, remove_favorite, favorite_id, user_id };
