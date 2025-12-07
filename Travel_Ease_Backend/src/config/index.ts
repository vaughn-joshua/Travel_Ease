/**
 * Configuration Index
 * 
 * Aggregates and exports all configuration modules.
 * 
 * Note: Image uploads now use Supabase Storage instead of Cloudinary.
 * See src/lib/supabaseStorage.ts for image upload utilities.
 */

export { mapConfig, default as mapConfigDefault } from './map.js';
export { con as dbPool } from './database.js';

export type { MapConfig } from './map.js';

