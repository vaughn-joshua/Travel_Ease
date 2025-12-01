import { Router } from 'express';
import multer from 'multer';
import { upload_image } from '../utils/upload_image.js';
import { upload_images } from '../utils/upload_images.js';
import { authenticateToken } from '../src/middleware/auth.js';

const router = Router();
const upload = multer();

router.post('/upload', authenticateToken, upload.single('image'), upload_image);
router.post('/upload_images', authenticateToken, upload.array('files'), upload_images);

export default router;

