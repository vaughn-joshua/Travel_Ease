import axios from "axios";
import type {
  Blog,
  BlogListResponse,
  BlogQueryParams,
  BlogOverviewResponse,
} from "../types/blog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Event emitter for auth events (e.g., 401 unauthorized)
type AuthEventCallback = () => void;
const authEventListeners: AuthEventCallback[] = [];

export const authEvents = {
  /** Subscribe to 401 unauthorized events */
  onUnauthorized(callback: AuthEventCallback): () => void {
    authEventListeners.push(callback);
    return () => {
      const idx = authEventListeners.indexOf(callback);
      if (idx !== -1) authEventListeners.splice(idx, 1);
    };
  },
  /** Emit unauthorized event to all listeners */
  emitUnauthorized() {
    authEventListeners.forEach((cb) => cb());
  },
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout (allows for Supabase free tier cold starts)
});

// Request interceptor - adds auth header and logging
api.interceptors.request.use(
  (config) => {
    // Attach auth token from localStorage if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Only log in development
    if (import.meta.env.DEV) {
      console.log(
        `Making ${config.method?.toUpperCase()} request to: ${config.url}`
      );
    }
    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error("Request error:", error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    // Only log in development
    if (import.meta.env.DEV) {
      console.log(
        `Response received: ${response.status} ${response.config.url}`
      );
    }
    // Handle 204 No Content responses (empty body)
    if (response.status === 204) {
      return { ...response, data: null };
    }
    return response;
  },
  (error) => {
    // Silently ignore aborted/cancelled requests (e.g., from React StrictMode double-render)
    if (axios.isCancel(error) || error.code === "ERR_CANCELED") {
      return Promise.reject(error);
    }

    // Emit unauthorized event on 401/403 to trigger auth state cleanup
    // Backend returns 401 for missing token, 403 for invalid/expired token
    if (error.response?.status === 401 || error.response?.status === 403) {
      authEvents.emitUnauthorized();
    }

    // Only log detailed errors in development (skip abort errors)
    if (import.meta.env.DEV) {
      console.error("API Error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        url: error.config?.url,
      });

      // Handle specific error cases with helpful messages
      if (error.response?.status === 500) {
        console.error("Internal server error - check backend logs");
      } else if (error.response?.status === 503) {
        console.error("Service unavailable - database may be down");
      } else if (error.response?.data?.code === "CONNECTION_ERROR") {
        console.error(
          "Database connection error - Supabase may be paused or unreachable"
        );
      } else if (error.code === "ECONNREFUSED") {
        console.error("Connection refused - is the backend server running?");
      } else if (error.code === "ERR_NETWORK") {
        console.error("Network error - check your internet connection");
      } else if (error.code === "ECONNABORTED") {
        console.error(
          "Request timeout - backend may be slow or database unreachable"
        );
      }
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

  // Get aggregated overview (featured + category slices) in one call
  getOverview: async (signal?: AbortSignal): Promise<BlogOverviewResponse> => {
    const response = await api.get("/blogs/overview", { signal });
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
  updateBlog: async (id: string, blogData: Partial<Blog>): Promise<Blog> => {
    const response = await api.put(`/blogs/${id}`, blogData);
    return response.data;
  },

  // Delete blog
  deleteBlog: async (id: string): Promise<void> => {
    try {
      await api.delete(`/blogs/${id}`);
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

// Travel spots query params
interface TravelSpotsParams {
  search?: string;
  city?: string;
  category?: string;
  limit?: number;
}

// Travel spots response (matches backend enriched shape)
interface TravelSpotsResponse {
  message: string;
  data: Array<{
    business_id: number;
    user_id: number | null;
    name: string;
    house_number: string | null;
    street: string | null;
    brgy: string | null;
    city: string | null;
    latitude: number | null;
    longtitude: number | null;
    description: string | null;
    rating: number | null;
    status: boolean | null;
    picture: string | null;
    reviewCount: number;
  }>;
  fromCache?: boolean;
}

export const businessApi = {
  // Get paginated list of businesses
  getBusinesses: async (
    params?: BusinessQueryParams
  ): Promise<BusinessListResponse> => {
    const response = await api.get("/business/businesses", { params });
    return response.data;
  },

  // Get travel spots with optional search/city/limit (public, cached on backend)
  getTravelSpots: async (
    params?: TravelSpotsParams,
    signal?: AbortSignal
  ): Promise<TravelSpotsResponse> => {
    const response = await api.get("/business/travel_spots", {
      params,
      signal,
    });
    return response.data;
  },

  // Get single business by ID
  getBusiness: async (id: string | number): Promise<Business> => {
    const response = await api.get(`/business/fetch_business/${id}`);
    return response.data;
  },

  // Create new business
  createBusiness: async (
    data: any
  ): Promise<{ message: string; business_id: number }> => {
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

  // Get categories for a specific business by ID
  getCategoriesById: async (
    businessId: string | number
  ): Promise<Array<{ category_id: number; category_name: string }>> => {
    const response = await api.get(`/business/fetch_categories/${businessId}`);
    return response.data;
  },

  // Create price range for business categories
  createPriceRange: async (data: {
    id?: number;
    business_id?: string | number;
    categories?: Array<{
      category_id: number;
      min_price: number;
      max_price: number;
    }>;
  }): Promise<any> => {
    const response = await api.post("/business/price_range", data);
    return response.data;
  },

  // Menu Items
  getMenuItems: async (
    businessId: string | number
  ): Promise<{ items: MenuItem[]; total: number }> => {
    const response = await api.get(`/business/${businessId}/menu`);
    return response.data;
  },

  createMenuItem: async (
    businessId: string | number,
    data: Partial<MenuItem>
  ): Promise<{ message: string; item: MenuItem }> => {
    const response = await api.post(`/business/${businessId}/menu`, data);
    return response.data;
  },

  updateMenuItem: async (
    businessId: string | number,
    itemId: number,
    data: Partial<MenuItem>
  ): Promise<{ message: string; item: MenuItem }> => {
    const response = await api.put(
      `/business/${businessId}/menu/${itemId}`,
      data
    );
    return response.data;
  },

  deleteMenuItem: async (
    businessId: string | number,
    itemId: number
  ): Promise<void> => {
    await api.delete(`/business/${businessId}/menu/${itemId}`);
  },

  // Delete business
  deleteBusiness: async (id: string | number): Promise<void> => {
    await api.delete(`/business/delete_business/${id}`);
  },

  // Get current user's businesses
  getMyBusinesses: async (): Promise<{
    data: Array<{
      business_id: number;
      name: string;
      description: string;
      city: string;
      rating: number | null;
      status: boolean;
      picture: string | null;
      categories?: { category_name: string }[];
    }>;
  }> => {
    const response = await api.get("/business/my-businesses");
    return response.data;
  },
};

// User types
interface AuthUser {
  user_id: number;
  auth_id?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  contact_no?: string | null;
}

interface AuthResponse {
  message: string;
  user: AuthUser;
  token: string;
  refresh_token?: string;
  expires_at?: number;
}

interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  contact_no?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface FavoritesResponse {
  business_favorites: Array<{
    favorite_id: number;
    business: {
      business_id: number;
      name: string;
      description: string | null;
      picture: string | null;
      rating: number | null;
      city: string | null;
    } | null;
  }>;
  travel_plan_favorites: Array<{
    favorite_id: number;
    travel_plan: {
      travel_plan_id: number;
      name: string;
      description: string | null;
      start_date: string | null;
      end_date: string | null;
      location: string | null;
    } | null;
  }>;
}

// User search result type
export interface UserSearchResult {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export const userApi = {
  // Register new user
  register: async (data: RegisterPayload): Promise<AuthResponse> => {
    const response = await api.post("/user/register", data);
    return response.data;
  },

  // Login user
  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const response = await api.post("/user/login", data);
    return response.data;
  },

  // Search users by email (for collaborator autocomplete)
  searchUsers: async (query: string): Promise<UserSearchResult[]> => {
    if (!query || query.length < 2) return [];
    const response = await api.get("/user/search", { params: { q: query } });
    return response.data;
  },

  // Get user favorites
  getFavorites: async (id: string | number): Promise<FavoritesResponse> => {
    const response = await api.get(`/user/favorite/${id}`);
    return response.data;
  },

  // Add favorite
  addFavorite: async (data: {
    business_id?: number;
    travel_plan_id?: number;
  }): Promise<any> => {
    const response = await api.post("/user/favorite", data);
    return response.data;
  },

  // Remove favorite
  removeFavorite: async (data: {
    business_id?: number;
    travel_plan_id?: number;
  }): Promise<any> => {
    const response = await api.delete("/user/favorite", { data });
    return response.data;
  },
};

// Review types
interface ReviewUser {
  user_id: number;
  first_name: string;
  last_name: string;
}

interface BusinessReview {
  review_id: number;
  user_id: number;
  business_id: number;
  rating: number | null;
  content: string | null;
  review_date: string;
  user?: ReviewUser;
}

interface TravelPlanReview {
  review_id: number;
  user_id: number;
  travel_plan_id: number;
  rating: number | null;
  content: string | null;
  review_date: string;
  user?: ReviewUser;
}

interface CreateReviewPayload {
  rating?: number;
  content?: string;
}

export const reviewApi = {
  // Create a business review
  createBusinessReview: async (
    businessId: number,
    data: CreateReviewPayload
  ): Promise<{ message: string; review: BusinessReview }> => {
    const response = await api.post("/reviews/business", {
      business_id: businessId,
      ...data,
    });
    return response.data;
  },

  // Create a travel plan review
  createTravelPlanReview: async (
    travelPlanId: number,
    data: CreateReviewPayload
  ): Promise<{ message: string; review: TravelPlanReview }> => {
    const response = await api.post("/reviews/travel_plan", {
      travel_plan_id: travelPlanId,
      ...data,
    });
    return response.data;
  },

  // Get reviews for a travel plan
  getTravelPlanReviews: async (
    travelPlanId: number | string
  ): Promise<{ message: string; data: TravelPlanReview[] }> => {
    const response = await api.get(`/reviews/travel_plan/${travelPlanId}`);
    return response.data;
  },

  // Get reviews for a business (using existing endpoint)
  getBusinessReviews: async (
    businessId: number | string
  ): Promise<{ message: string; data: BusinessReview[] }> => {
    const response = await api.get(
      `/business/travel_spots/reviews/${businessId}`
    );
    return response.data;
  },
};

// Notification types
export interface Notification {
  notification_id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data: {
    travel_plan_id?: number;
    inviter_id?: number;
    inviter_name?: string;
    plan_name?: string;
  } | null;
  is_read: boolean;
  created_at: string;
}

export const notificationApi = {
  // Get all notifications
  getNotifications: async (): Promise<{ message: string; data: Notification[] }> => {
    const response = await api.get("/notification");
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get("/notification/unread-count");
    return response.data;
  },

  // Mark as read
  markAsRead: async (id: number): Promise<{ message: string }> => {
    const response = await api.patch(`/notification/${id}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async (): Promise<{ message: string; count: number }> => {
    const response = await api.patch("/notification/read-all");
    return response.data;
  },

  // Delete notification
  deleteNotification: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/notification/${id}`);
    return response.data;
  },

  // Respond to invitation
  respondToInvitation: async (
    notificationId: number,
    accept: boolean
  ): Promise<{ message: string }> => {
    const response = await api.post("/notification/respond-invitation", {
      notification_id: notificationId,
      accept,
    });
    return response.data;
  },
};

export default api;
