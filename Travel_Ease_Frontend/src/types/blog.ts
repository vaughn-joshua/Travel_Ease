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
