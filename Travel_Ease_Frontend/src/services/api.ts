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
    // Handle 204 No Content responses (empty body)
    if (response.status === 204) {
      return { ...response, data: null };
    }
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
    try {
      const response = await api.delete(`/blogs/${id}`);
      // 204 No Content is a successful response with no body
      return;
    } catch (error: any) {
      // If it's a 204, it's actually successful
      if (error.response?.status === 204) {
        return;
      }
      throw error;
    }
  },
};

// Business types
interface Business {
  id: number;
  name: string;
  description: string | null;
  categories: { id: number; name: string }[];
  hours: Record<string, { open: string | null; close: string | null }>;
  priceRange: { min: number; max: number } | null;
  media: { cover: string | null; gallery: string[] };
  menuItems: MenuItem[];
  reviews: Review[];
  reviewCount: number;
  location: {
    lat: number | null;
    lng: number | null;
    address: string;
  };
  rating: number | null;
  owner: { id: number; name: string; email: string } | null;
}

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string | null;
  isAvailable: boolean;
}

interface Review {
  id: number;
  rating: number | null;
  content: string | null;
  date: string;
  user: { id: number; name: string } | null;
}

interface BusinessListResponse {
  items: Business[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface BusinessQueryParams {
  page?: number;
  pageSize?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  status?: boolean;
}

export const businessApi = {
  // Get paginated list of businesses
  getBusinesses: async (params?: BusinessQueryParams): Promise<BusinessListResponse> => {
    const response = await api.get("/business/businesses", { params });
    return response.data;
  },

  // Get single business by ID
  getBusiness: async (id: string | number): Promise<Business> => {
    const response = await api.get(`/business/fetch_business/${id}`);
    return response.data;
  },

  // Create new business
  createBusiness: async (data: any): Promise<{ message: string; business_id: number }> => {
    const response = await api.post("/business/create_business", data);
    return response.data;
  },

  // Update business
  updateBusiness: async (id: string | number, data: any): Promise<any> => {
    const response = await api.put(`/business/edit_business/${id}`, data);
    return response.data;
  },

  // Get categories for filter dropdown
  getCategories: async (): Promise<{ categories: string[] }> => {
    const response = await api.get("/business/categories");
    return response.data;
  },

  // Menu Items
  getMenuItems: async (businessId: string | number): Promise<{ items: MenuItem[]; total: number }> => {
    const response = await api.get(`/business/${businessId}/menu`);
    return response.data;
  },

  createMenuItem: async (businessId: string | number, data: Partial<MenuItem>): Promise<{ message: string; item: MenuItem }> => {
    const response = await api.post(`/business/${businessId}/menu`, data);
    return response.data;
  },

  updateMenuItem: async (businessId: string | number, itemId: number, data: Partial<MenuItem>): Promise<{ message: string; item: MenuItem }> => {
    const response = await api.put(`/business/${businessId}/menu/${itemId}`, data);
    return response.data;
  },

  deleteMenuItem: async (businessId: string | number, itemId: number): Promise<void> => {
    await api.delete(`/business/${businessId}/menu/${itemId}`);
  },
};

export default api;
