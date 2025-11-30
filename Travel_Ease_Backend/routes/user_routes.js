/*
routes

post login
post register
post favorite
delete favorite
get favorites
get user (own details)
post oauth (sync OAuth user)
get me (current user profile)
put profile (update profile)
*/

import { Router } from "express";
import { authenticateToken } from "../src/middleware/auth.js";
import { validate, registerSchema, loginSchema, createFavoriteSchema, updateProfileSchema } from "../src/schemas/validation.js";
import {
  register,
  login,
  favorite,
  remove_favorite,
  favorite_id,
  user_id,
  oauth_sync,
  update_profile,
  get_me,
  delete_account,
} from "../user/index.js";

const router = Router();

// Public routes (no auth required)
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// OAuth sync route (called after Supabase OAuth callback)
router.post("/oauth", authenticateToken, oauth_sync);

// Current user routes
router.get("/me", authenticateToken, get_me);
router.put("/profile", authenticateToken, update_profile);
router.delete("/account", authenticateToken, delete_account);

// Protected routes (auth required)
router.post("/favorite", authenticateToken, validate(createFavoriteSchema), favorite);
router.delete("/favorite", authenticateToken, validate(createFavoriteSchema), remove_favorite);
router.get("/favorite/:id", authenticateToken, favorite_id);
router.get("/user/:id", authenticateToken, user_id);

export default router;
