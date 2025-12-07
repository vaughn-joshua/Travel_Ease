/**
 * Supabase Storage Helper
 * 
 * Handles image uploads to Supabase Storage buckets.
 * Replaces Cloudinary for all image hosting needs.
 * 
 * Bucket Configuration:
 * - Public bucket named 'images' for general images (businesses, blogs)
 * - Path structure: {folder}/{timestamp}_{sanitizedFilename}
 * - Max file size: 6MB for standard uploads (Supabase default)
 * 
 * Usage:
 *   const result = await uploadImage({
 *     fileBuffer: buffer,
 *     contentType: 'image/jpeg',
 *     folder: 'business',
 *     filename: 'my-image.jpg'
 *   });
 *   // Returns: { path: 'business/123456_my-image.jpg', publicUrl: 'https://...' }
 */

import { supabaseAdmin, isSupabaseConfigured } from './supabase.js';
import { logger } from './logger.js';

// Default bucket name - can be overridden via env
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'image';

// Maximum file size (6MB - Supabase standard upload limit)
const MAX_FILE_SIZE = 6 * 1024 * 1024;

// Allowed content types
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

export interface UploadImageOptions {
  fileBuffer: Buffer;
  contentType: string;
  folder: string;
  filename: string;
}

export interface UploadResult {
  path: string;
  publicUrl: string;
}

export interface DeleteResult {
  success: boolean;
  path: string;
}

/**
 * Sanitize filename to be URL-safe
 */
function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 100); // Limit length
}

/**
 * Generate a unique path for the uploaded file
 */
function generatePath(folder: string, filename: string): string {
  const timestamp = Date.now();
  const sanitized = sanitizeFilename(filename);
  return `${folder}/${timestamp}_${sanitized}`;
}

/**
 * Upload an image to Supabase Storage
 * 
 * @param options Upload options including file buffer, content type, folder, and filename
 * @returns Object with path and public URL
 * @throws Error if upload fails or Supabase is not configured
 */
export async function uploadImage(options: UploadImageOptions): Promise<UploadResult> {
  const { fileBuffer, contentType, folder, filename } = options;

  // Validate Supabase configuration
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    throw new Error('Supabase is not configured. Cannot upload images.');
  }

  // Validate content type
  if (!ALLOWED_CONTENT_TYPES.includes(contentType.toLowerCase())) {
    throw new Error(`Invalid content type: ${contentType}. Allowed: ${ALLOWED_CONTENT_TYPES.join(', ')}`);
  }

  // Validate file size
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${fileBuffer.length} bytes. Maximum: ${MAX_FILE_SIZE} bytes (6MB)`);
  }

  // Generate unique path
  const path = generatePath(folder, filename);

  logger.debug({ 
    module: 'storage',
    bucket: STORAGE_BUCKET,
    path,
    size: fileBuffer.length,
    contentType 
  }, 'Uploading image to Supabase Storage');

  // Upload to Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, fileBuffer, {
      contentType,
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    logger.error({ 
      module: 'storage',
      error: error.message,
      path,
      bucket: STORAGE_BUCKET
    }, 'Failed to upload image to Supabase Storage');
    
    // Provide helpful error messages for common issues
    if (error.message.includes('Bucket not found')) {
      throw new Error(
        `Storage bucket "${STORAGE_BUCKET}" not found. ` +
        `Please create a PUBLIC bucket named "${STORAGE_BUCKET}" in Supabase Dashboard > Storage.`
      );
    }
    if (error.message.includes('not allowed') || error.message.includes('permission')) {
      throw new Error(
        `Permission denied for bucket "${STORAGE_BUCKET}". ` +
        `Ensure the bucket is set to PUBLIC in Supabase Dashboard.`
      );
    }
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  const publicUrl = urlData.publicUrl;

  logger.info({ 
    module: 'storage',
    path,
    publicUrl 
  }, 'Image uploaded successfully');

  return {
    path,
    publicUrl,
  };
}

/**
 * Upload multiple images to Supabase Storage
 * 
 * @param files Array of upload options
 * @returns Array of upload results
 */
export async function uploadImages(files: UploadImageOptions[]): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const file of files) {
    const result = await uploadImage(file);
    results.push(result);
  }

  return results;
}

/**
 * Delete an image from Supabase Storage
 * 
 * @param path The path of the file to delete
 * @returns Object indicating success and the path
 */
export async function deleteImage(path: string): Promise<DeleteResult> {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    throw new Error('Supabase is not configured. Cannot delete images.');
  }

  logger.debug({ 
    module: 'storage',
    bucket: STORAGE_BUCKET,
    path 
  }, 'Deleting image from Supabase Storage');

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) {
    logger.error({ 
      module: 'storage',
      error: error.message,
      path 
    }, 'Failed to delete image from Supabase Storage');
    throw new Error(`Delete failed: ${error.message}`);
  }

  logger.info({ 
    module: 'storage',
    path 
  }, 'Image deleted successfully');

  return {
    success: true,
    path,
  };
}

/**
 * Extract the storage path from a Supabase public URL
 * Useful for delete operations when you only have the public URL
 * 
 * @param publicUrl The public URL of the image
 * @returns The storage path, or null if not a valid Supabase URL
 */
export function extractPathFromUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    // Supabase public URLs look like: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const match = url.pathname.match(/\/storage\/v1\/object\/public\/[^\/]+\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Check if a URL is a Supabase Storage URL
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage/v1/object/public/');
}

/**
 * Check if Supabase Storage is properly configured and accessible
 */
export async function checkStorageHealth(): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return false;
  }

  try {
    // Try to list files in the bucket (empty is fine)
    const { error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .list('', { limit: 1 });

    return !error;
  } catch {
    return false;
  }
}

