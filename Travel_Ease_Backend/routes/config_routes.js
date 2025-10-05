import { Router } from "express";
import { init_db } from "../config/index.js";

const router = Router();

router.get("/init_db", init_db);

export default router;
