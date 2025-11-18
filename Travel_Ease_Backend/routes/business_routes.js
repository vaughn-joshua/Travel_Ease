/*
routes

post business
post register business
get businesses
*/

import { Router } from "express";
import { get_businesses } from "../business/index.js";

const router = Router();

router.get("/businesses", get_businesses);

export default router;
