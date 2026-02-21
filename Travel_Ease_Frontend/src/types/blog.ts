export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: string;
  isFeatured: boolean;
  readingMinutes: number;
  publishedAt: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogListResponse {
  items: Blog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BlogQueryParams {
  category?: string;
  page?: number;
  pageSize?: number;
  q?: string;
}

export interface BlogOverviewResponse {
  featured: Blog[];
  destinations: Blog[];
  tips: Blog[];
  clientEducation: Blog[];
  fromCache?: boolean;
}

// ─── RSS Feed Types ───────────────────────────────────────────────────────────

/** A single normalized item from an external RSS/Atom feed */
export interface RSSFeedItem {
  title: string;
  link: string;
  pubDate: string;
  author: string;
  excerpt: string;
  imageUrl: string | null;
  sourceName: string;
}

/** Response shape from GET /api/blogs/rss-feed */
export interface RSSFeedResponse {
  items: RSSFeedItem[];
  feedTitle: string;
  fromCache: boolean;
}
