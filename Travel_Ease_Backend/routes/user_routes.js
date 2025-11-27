/*
routes

post login
post register
post favorite
delete favorite
get favorites
get user (own details)
*/

import { Router } from "express";
import { authenticateToken } from "../src/middleware/auth.js";
import { validate, registerSchema, loginSchema, createFavoriteSchema } from "../src/schemas/validation.js";
import {
  register,
  login,
  favorite,
  remove_favorite,
  favorite_id,
  user_id,
} from "../user/index.js";

const router = Router();

// Public routes (no auth required)
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// Protected routes (auth required)
router.post("/favorite", authenticateToken, validate(createFavoriteSchema), favorite);
router.delete("/favorite", authenticateToken, validate(createFavoriteSchema), remove_favorite);
router.get("/favorite/:id", authenticateToken, favorite_id);
router.get("/user/:id", authenticateToken, user_id);

export default router;
