import axios from "axios";
import type { Blog, BlogListResponse, BlogQueryParams } from "../types/blog";

const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const blogApi = {
  // Get paginated list of blogs
  getBlogs: async (params?: BlogQueryParams): Promise<BlogListResponse> => {
    const response = await api.get("/blogs", { params });
    return response.data;
  },

  // Get featured blogs
  getFeaturedBlogs: async (): Promise<Blog[]> => {
    const response = await api.get("/blogs/featured");
    return response.data;
  },

  // Get single blog by slug
  getBlogBySlug: async (slug: string): Promise<Blog> => {
    const response = await api.get(`/blogs/${slug}`);
    return response.data;
  },

  // Create new blog (protected)
  createBlog: async (
    blogData: Partial<Blog>,
    apiKey: string
  ): Promise<Blog> => {
    const response = await api.post("/blogs", blogData, {
      headers: { "x-api-key": apiKey },
    });
    return response.data;
  },

  // Update blog (protected)
  updateBlog: async (
    id: string,
    blogData: Partial<Blog>,
    apiKey: string
  ): Promise<Blog> => {
    const response = await api.put(`/blogs/${id}`, blogData, {
      headers: { "x-api-key": apiKey },
    });
    return response.data;
  },

  // Delete blog (protected)
  deleteBlog: async (id: string, apiKey: string): Promise<void> => {
    await api.delete(`/blogs/${id}`, {
      headers: { "x-api-key": apiKey },
    });
  },
};

export default api;


