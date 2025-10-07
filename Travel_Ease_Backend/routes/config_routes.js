import { Router } from "express";
import { model_db } from "../config/index.js";

const router = Router();

router.get("/init_db", model_db);

export default router;
