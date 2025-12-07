/**
 * Single Image Upload Handler
 * 
 * Handles single image uploads to Supabase Storage.
 * POST /api/utils/upload
 * 
 * Request:
 *   - multipart/form-data
 *   - Fields: image (file), name (optional), folder (optional)
 * 
 * Response:
 *   - { secure_url: string } - The public URL of the uploaded image
 */

import { Request, Response } from "express";
import { uploadImage as uploadToSupabase } from "../../lib/supabaseStorage.js";
import { logger } from "../../lib/logger.js";

interface MulterRequest extends Omit<Request, 'file'> {
  file?: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
  };
}

export async function upload_image(req: MulterRequest, res: Response) {
  try {
    logger.debug({ module: 'upload' }, 'Single image upload requested');

    // Validate file exists
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { name, folder = "uploads" } = req.body;
    const file = req.file;

    // Use provided name or generate from original filename
    const filename = name || file.originalname || `upload_${Date.now()}`;

    // Upload to Supabase Storage
    const result = await uploadToSupabase({
      fileBuffer: file.buffer,
      contentType: file.mimetype,
      folder: folder,
      filename: filename,
    });

    logger.info({ 
      module: 'upload',
      folder,
      filename,
      publicUrl: result.publicUrl 
    }, 'Image uploaded successfully');

    // Return in same format as Cloudinary did for backwards compatibility
    res.json({ secure_url: result.publicUrl });
  } catch (error: any) {
    logger.error({ 
      module: 'upload',
      error: error.message 
    }, 'Image upload failed');
    
    // Return 503 for storage configuration issues (bucket not found, etc.)
    // This follows the state machine pattern for graceful degradation
    const isConfigError = error.message.includes('bucket') || 
                          error.message.includes('not configured') ||
                          error.message.includes('Permission denied');
    
    res.status(isConfigError ? 503 : 500).json({ 
      error: "Upload failed", 
      details: error.message,
      code: isConfigError ? 'STORAGE_UNAVAILABLE' : 'UPLOAD_FAILED'
    });
  }
}
