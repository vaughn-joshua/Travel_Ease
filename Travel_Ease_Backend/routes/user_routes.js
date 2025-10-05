/*
routes

post login
post register
post favorite
get favorites
get user (own details)
*/

import { Router } from "express";
import {
  register,
  login,
  favorite,
  favorite_id,
  user_id,
} from "../user/index.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/favorite", favorite);
router.get("/favorite/:id", favorite_id);
router.get("/user/:id", user_id);

export default router;
