/**
 * Generate a URL-friendly slug from a title
 * - Converts to lowercase
 * - Replaces spaces and special chars with hyphens
 * - Removes consecutive hyphens
 * - Truncates to 200 chars
 */
export function generateSlug(title) {
  if (!title) return "";
  
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 200);
}

