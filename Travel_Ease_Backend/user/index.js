import { prisma } from "../src/lib/prisma.js";

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

    // Create new user
    // NOTE: In production, you should hash the password before storing!
    const user = await prisma.user.create({
      data: {
        first_name,
        last_name,
        email,
        contact_no,
        password // TODO: Hash this password in production!
      },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        contact_no: true
      }
    });

    res.status(201).json({ 
      message: "User registered successfully",
      user 
    });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    // NOTE: In production, compare hashed password!
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Return user data (excluding password)
    res.json({
      message: "Login successful",
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        contact_no: user.contact_no
      }
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: error.message });
  }
}

async function favorite(req, res) {
  try {
    const { user_id, business_id, travel_plan_id } = req.body;

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
        first_name: true,
        last_name: true,
        email: true,
        contact_no: true
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
