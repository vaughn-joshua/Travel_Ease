import { Router } from "express";
import { create_business } from "../business/index.js";

const router = Router();

router.post("/create_business", create_business);

export default router;
