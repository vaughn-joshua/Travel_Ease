/**
 * API Configuration
 * Central configuration for all API endpoints
 *
 * NOTE: These paths are relative to the axios baseURL ("/api").
 * Do NOT include "/api" prefix here - it's added by the axios instance.
 */

import type { Endpoints } from "../types/api";

// Use the proxy in development (Vite will forward /api to http://localhost:3001)
// In production, this would be the actual API URL
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || "/api";

// Export specific endpoint builders
// Paths are relative to baseURL - do not include /api prefix
export const endpoints: Endpoints = {
  // Travel Plan endpoints
  travelPlan: {
    base: `/travel_plan`,
    ongoing: `/travel_plan/ongoing_plan`,
    plans: `/travel_plan/plans`,
    previous: `/travel_plan/previous_plans`,
    public: `/travel_plan/public_plans`,
    quickJoin: `/travel_plan/quick_join`,
    requestJoin: `/travel_plan/request_join`,
    joinPlan: `/travel_plan/join_plan`,
    pendingRequests: (id: string | number) =>
      `/travel_plan/${id}/pending_requests`,
    approveJoin: (planId: string | number, participantId: string | number) =>
      `/travel_plan/${planId}/approve/${participantId}`,
    denyJoin: (planId: string | number, participantId: string | number) =>
      `/travel_plan/${planId}/deny/${participantId}`,
    byId: (id) => `/travel_plan/plans/${id}`,
    activities: (id) => `/travel_plan/activities/${id}`,
    createActivity: `/travel_plan/create_activity`,
    createPlan: `/travel_plan/create_plan`,
    editPlan: (id) => `/travel_plan/edit_plan/${id}`,
    editActivity: (id) => `/travel_plan/activity_edit/${id}`,
    updateActivity: (id) => `/travel_plan/update_activity/${id}`,
    deleteActivity: (id) => `/travel_plan/delete_activity/${id}`,
    // Participant/Collaborator endpoints
    participants: (id) => `/travel_plan/${id}/participants`,
    participantById: (planId, userId) =>
      `/travel_plan/${planId}/participants/${userId}`,
  },

  // Business endpoints
  business: {
    base: `/business`,
    businesses: `/business/businesses`,
    create: `/business/create_business`,
    myBusinesses: `/business/my-businesses`,
    byId: (id) => `/business/fetch_business/${id}`,
    categoriesById: (id) => `/business/fetch_categories/${id}`,
    edit: (id) => `/business/edit_business/${id}`,
    delete: (id) => `/business/delete_business/${id}`,
    // priceRange is deprecated - price data now stored directly on business table
    // priceRange: `/business/price_range`,
    travelSpots: `/business/travel_spots`,
    reviews: (id) => `/business/travel_spots/reviews/${id}`,
    categories: `/business/categories`,
    menu: (id) => `/business/${id}/menu`,
    menuItem: (id, itemId) => `/business/${id}/menu/${itemId}`,
  },

  // User endpoints
  user: {
    register: `/user/register`,
    login: `/user/login`,
    favorite: `/user/favorite`,
    favoriteById: (id) => `/user/favorite/${id}`,
    byId: (id) => `/user/user/${id}`,
  },

  // Utils endpoints (image uploads)
  utils: {
    upload: `/utils/upload`,
    uploadImages: `/utils/upload_images`,
  },

  // Map endpoints
  map: {
    search: `/map/search`,
    suggestions: `/map/suggestions`,
    geocode: `/map/geocode`,
    reverse: `/map/reverse`,
    route: `/map/route`,
  },

  // Blog endpoints
  blogs: {
    base: `/blogs`,
    featured: `/blogs/featured`,
    overview: `/blogs/overview`,
    bySlug: (slug) => `/blogs/${slug}`,
    byId: (id) => `/blogs/${id}`,
  },

  // Review endpoints
  reviews: {
    business: `/reviews/business`,
    travelPlan: `/reviews/travel_plan`,
    travelPlanById: (id: string | number) => `/reviews/travel_plan/${id}`,
  },
};

export default API_BASE_URL;
