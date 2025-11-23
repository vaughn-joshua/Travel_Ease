import { Router } from "express";
import { create_business } from "../business/index.js";
import { price_range } from "../business/index.js";
import { business_fetch } from "../business/index.js";
import { categories_fetch } from "../business/index.js";
import { edit_business } from "../business/index.js";
import { get_businesses } from "../business/index.js";

const router = Router();

router.post("/create_business", create_business);
router.post("/price_range", price_range);

router.get("/fetch_business/:id", business_fetch);
router.get("/fetch_categories/:id", categories_fetch);
router.get("/businesses", get_businesses);

router.put(`/edit_business/:id`, edit_business);

export default router;
