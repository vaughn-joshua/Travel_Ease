/**
 * Multiple Images Upload Handler
 * 
 * Handles multiple image uploads to Supabase Storage.
 * POST /api/utils/upload_images
 * 
 * Request:
 *   - multipart/form-data
 *   - Fields: files (multiple files), names[] (array), folders[] (array)
 * 
 * Response:
 *   - { secure_url: string[] } - Array of public URLs for uploaded images
 */

import { Request, Response } from "express";
import { uploadImage as uploadToSupabase } from "../../lib/supabaseStorage.js";
import { logger } from "../../lib/logger.js";

interface MulterFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

export async function upload_image(req: Request, res: Response) {
  // Single image upload - delegate to the multi-file handler
  return upload_images(req, res);
}

export async function upload_images(req: Request, res: Response): Promise<Response | void> {
  try {
    logger.debug({ module: 'upload' }, 'Multiple images upload requested');

    const files = Array.isArray(req.files) ? req.files as MulterFile[] : undefined;

    // Handle array field names with [] suffix (e.g., names[], folders[])
    // Body parser might parse these as 'names[]' keys or as 'names' arrays
    let rawNames: any = req.body.names || req.body['names[]'];
    let rawFolders: any = req.body.folders || req.body['folders[]'];

    // Ensure arrays
    let namesArr: string[];
    let foldersArr: string[];
    
    if (!Array.isArray(rawNames)) {
      // Could be a JSON string or single value
      try {
        namesArr = JSON.parse(rawNames);
        if (!Array.isArray(namesArr)) namesArr = [namesArr];
      } catch {
        namesArr = rawNames ? [rawNames] : [];
      }
    } else {
      namesArr = rawNames;
    }

    if (!Array.isArray(rawFolders)) {
      try {
        foldersArr = JSON.parse(rawFolders);
        if (!Array.isArray(foldersArr)) foldersArr = [foldersArr];
      } catch {
        foldersArr = rawFolders ? [rawFolders] : [];
      }
    } else {
      foldersArr = rawFolders;
    }

    logger.debug({ 
      module: 'upload',
      fileCount: files?.length || 0,
      names: namesArr,
      folders: foldersArr 
    }, 'Processing file uploads');

    // Validate files exist
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // If names array is shorter than files, generate names for remaining
    while (namesArr.length < files.length) {
      namesArr.push(`upload_${Date.now()}_${namesArr.length}`);
    }

    const secure_urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const folder = foldersArr[i] || foldersArr[0] || "uploads";
      const filename = namesArr[i] || file.originalname || `upload_${Date.now()}_${i}`;

      // Upload to Supabase Storage
      const result = await uploadToSupabase({
        fileBuffer: file.buffer,
        contentType: file.mimetype,
        folder: folder,
        filename: filename,
      });

      secure_urls.push(result.publicUrl);
    }

    logger.info({ 
      module: 'upload',
      count: secure_urls.length,
      urls: secure_urls 
    }, 'Multiple images uploaded successfully');

    // Return in same format as Cloudinary did for backwards compatibility
    res.json({ secure_url: secure_urls });
  } catch (error: any) {
    logger.error({ 
      module: 'upload',
      error: error.message 
    }, 'Multiple images upload failed');
    
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
