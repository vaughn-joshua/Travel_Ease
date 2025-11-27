import { prisma } from "../src/lib/prisma.js";
import { supabaseAdmin, useSupabaseAuth } from "../src/lib/supabase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Get secrets from env
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-prod";

async function register(req, res) {
  try {
    const { first_name, last_name, email, contact_no, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // Use Supabase Auth if configured
    if (useSupabaseAuth()) {
      // Register with Supabase Auth
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for simplicity
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
          password: null // No password needed when using Supabase
        },
        select: {
          auth_id: true,
          first_name: true,
          last_name: true,
          email: true,
          contact_no: true
        }
      });

      // Generate session for immediate login
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email
      });

      res.status(201).json({ 
        message: "User registered successfully with Supabase",
        user,
        // Note: In production, client should use Supabase client SDK for auth
        supabase_user_id: data.user.id
      });
    } else {
      // Local JWT mode
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await prisma.user.create({
        data: {
          first_name,
          last_name,
          email,
          contact_no,
          password: hashedPassword
        },
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
          contact_no: true
        }
      });

      // Generate JWT
      const token = jwt.sign(
        { id: user.user_id, email: user.email },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(201).json({ 
        message: "User registered successfully",
        user,
        token
      });
    }
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Use Supabase Auth if configured
    if (useSupabaseAuth()) {
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
    } else {
      // Local JWT mode
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.user_id, email: user.email },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        message: "Login successful",
        user: {
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          contact_no: user.contact_no
        },
        token
      });
    }
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
      // Add business favorite
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
      // Add travel plan favorite
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
    
    // Handle duplicate favorite error
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Already in favorites" });
    }
    
    res.status(500).json({ error: error.message });
  }
}

async function favorite_id(req, res) {
  try {
    const { id } = req.params; // user_id

    // Get both business and travel plan favorites
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

export { register, login, favorite, favorite_id, user_id };
