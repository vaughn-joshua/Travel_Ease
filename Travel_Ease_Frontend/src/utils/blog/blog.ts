import type { Blog } from "../../types/blog";

/**
 * Format a date string for display
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "January 15, 2024")
 */
export function formatBlogDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Calculate estimated reading time based on word count
 * @param content - The blog content
 * @param wordsPerMinute - Average reading speed (default: 200)
 * @returns Estimated reading time in minutes
 */
export function calculateReadingTime(
  content: string,
  wordsPerMinute: number = 200
): number {
  if (!content) return 0;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Get word count from content
 * @param content - The content to count words from
 * @returns Number of words
 */
export function getWordCount(content: string): number {
  if (!content) return 0;
  return content.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Truncate text to a maximum length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Sort blogs by date (newest first)
 * @param blogs - Array of blogs to sort
 * @returns Sorted array of blogs
 */
export function sortBlogsByDate(blogs: Blog[]): Blog[] {
  return [...blogs].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/**
 * Filter blogs by category
 * @param blogs - Array of blogs to filter
 * @param category - Category to filter by
 * @returns Filtered array of blogs
 */
export function filterBlogsByCategory(blogs: Blog[], category: string): Blog[] {
  return blogs.filter(
    (blog) => blog.category.toLowerCase() === category.toLowerCase()
  );
}

