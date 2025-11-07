import axios from "axios";
import type { Blog, BlogListResponse, BlogQueryParams } from "../types/blog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(
      `Making ${config.method?.toUpperCase()} request to: ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    console.log(`Response received: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      url: error.config?.url,
    });

    // Handle specific error cases
    if (error.response?.status === 500) {
      console.error("Internal server error - check backend logs");
    } else if (error.code === "ECONNREFUSED") {
      console.error("Connection refused - is the backend server running?");
    } else if (error.code === "ERR_NETWORK") {
      console.error("Network error - check your internet connection");
    }

    return Promise.reject(error);
  }
);

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

  // Create new blog
  createBlog: async (blogData: Partial<Blog>): Promise<Blog> => {
    const response = await api.post("/blogs", blogData);
    return response.data;
  },

  // Update blog
  updateBlog: async (
    id: string,
    blogData: Partial<Blog>
  ): Promise<Blog> => {
    const response = await api.put(`/blogs/${id}`, blogData);
    return response.data;
  },

  // Delete blog
  deleteBlog: async (id: string): Promise<void> => {
    await api.delete(`/blogs/${id}`);
  },
};

export default api;
