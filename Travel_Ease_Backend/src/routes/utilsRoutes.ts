import { Router } from 'express';
import multer from 'multer';
import { upload_image } from '../shared/utils/uploadImage.js';
import { upload_images } from '../shared/utils/uploadImages.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const upload = multer();

router.post('/upload', authenticateToken, upload.single('image'), upload_image);
router.post('/upload_images', authenticateToken, upload.array('files'), upload_images);

export default router;

