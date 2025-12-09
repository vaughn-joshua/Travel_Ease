import { z } from 'zod';

/**
 * Blog Status Enum
 * 
 * Blog State Machine:
 *   - Draft: created but not published
 *   - Published: visible to public
 *   - Archived: soft-deleted, not visible (terminal state)
 * 
 * Valid transitions:
 *   - Draft → Published
 *   - Published → Archived
 *   - Draft → Archived
 * 
 * Illegal (no resurrection from terminal state):
 *   - Archived → Draft
 *   - Archived → Published
 */
const blogStatusEnum = z.enum(['Draft', 'Published', 'Archived']);

export const createBlogSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long'),
  excerpt: z.string().min(1, 'Excerpt is required').max(500, 'Excerpt too long'),
  content: z.string().min(1, 'Content is required'),
  coverImageUrl: z.string().url('Invalid cover image URL'),
  category: z.string().min(1, 'Category is required'),
  isFeatured: z.boolean().default(false),
  readingMinutes: z.number().int().min(1, 'Reading minutes must be at least 1'),
  author: z.string().min(1, 'Author is required'),
  publishedAt: z.string().datetime().optional(),
  status: blogStatusEnum.default('Published')
});

export const updateBlogSchema = createBlogSchema.partial();

export const blogQuerySchema = z.object({
  category: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  pageSize: z.string().transform(Number).pipe(z.number().int().min(1).max(50)).default('10'),
  q: z.string().optional()
});

/**
 * Validates blog status transitions based on state machine rules.
 * Returns true if transition is valid, false if it violates state machine.
 */
export function isValidBlogStatusTransition(currentStatus: string, newStatus: string): boolean {
  // No change is always valid
  if (currentStatus === newStatus) return true;
  
  // Archived is terminal - no resurrection allowed
  if (currentStatus === 'Archived') return false;
  
  // Valid transitions from Draft
  if (currentStatus === 'Draft') {
    return newStatus === 'Published' || newStatus === 'Archived';
  }
  
  // Valid transitions from Published
  if (currentStatus === 'Published') {
    return newStatus === 'Archived';
  }
  
  return false;
}

