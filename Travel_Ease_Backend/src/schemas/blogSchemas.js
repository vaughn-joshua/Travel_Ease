import { z } from "zod";
export const createBlogSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  slug: z.string().min(1, "Slug is required").max(200, "Slug too long"),
  excerpt: z.string().min(1, "Excerpt is required").max(500, "Excerpt too long"),
  content: z.string().min(1, "Content is required"),
  coverImageUrl: z.string().url("Invalid cover image URL"),
  category: z.string().min(1, "Category is required"),
  isFeatured: z.boolean().default(false),
  readingMinutes: z.number().int().min(1, "Reading minutes must be at least 1"),
  author: z.string().min(1, "Author is required"),
  publishedAt: z.string().datetime().optional()
});
export const updateBlogSchema = createBlogSchema.partial();
export const blogQuerySchema = z.object({
  category: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default("1"),
  pageSize: z.string().transform(Number).pipe(z.number().int().min(1).max(50)).default("10"),
  q: z.string().optional()
});