import { Router } from "express";
import { model_db } from "../config/index.js";
import { initAllSchemas } from "../database/index.js";
import { single_group } from "../database/run_single_group.js";

const router = Router();

router.get("/init_db", initAllSchemas);
router.get("/init_db/:table", single_group);

export default router;