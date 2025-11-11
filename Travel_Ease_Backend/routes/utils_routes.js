import { Router } from "express";
import multer from "multer";
import { upload_image } from "../utils/upload_image.js";

const router = Router();
const upload = multer({ dest: "uploads/" }); // Temporary local storage

router.post("/upload", upload.single("image"), upload_image);

export default router;
