/**
 * API Configuration
 * Central configuration for all API endpoints
 */

// Use the proxy in development (Vite will forward /api to http://localhost:3001)
// In production, this would be the actual API URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Export specific endpoint builders if needed
export const endpoints = {
  // Travel Plan endpoints
  travelPlan: {
    base: `${API_BASE_URL}/travel_plan`,
    ongoing: `${API_BASE_URL}/travel_plan/ongoing_plan`,
    plans: `${API_BASE_URL}/travel_plan/plans`,
    previous: `${API_BASE_URL}/travel_plan/previous_plans`,
    public: `${API_BASE_URL}/travel_plan/public_plans`,
    quickJoin: `${API_BASE_URL}/travel_plan/quick_join`,
    byId: (id) => `${API_BASE_URL}/travel_plan/plans/${id}`,
    activities: (id) => `${API_BASE_URL}/travel_plan/activities/${id}`,
    createActivity: `${API_BASE_URL}/travel_plan/create_activity`,
    createPlan: `${API_BASE_URL}/travel_plan/create_plan`,
    editPlan: (id) => `${API_BASE_URL}/travel_plan/edit_plan/${id}`,
    editActivity: (id) => `${API_BASE_URL}/travel_plan/activity_edit/${id}`,
    updateActivity: (id) => `${API_BASE_URL}/travel_plan/update_activity/${id}`,
    deleteActivity: (id) => `${API_BASE_URL}/travel_plan/delete_activity/${id}`,
  },

  // Business endpoints
  business: {
    base: `${API_BASE_URL}/business`,
    businesses: `${API_BASE_URL}/business/businesses`,
    create: `${API_BASE_URL}/business/create_business`,
    byId: (id) => `${API_BASE_URL}/business/fetch_business/${id}`,
    categoriesById: (id) => `${API_BASE_URL}/business/fetch_categories/${id}`,
    edit: (id) => `${API_BASE_URL}/business/edit_business/${id}`,
    priceRange: `${API_BASE_URL}/business/price_range`,
    travelSpots: `${API_BASE_URL}/business/travel_spots`,
    reviews: (id) => `${API_BASE_URL}/business/travel_spots/reviews/${id}`,
    // New endpoints
    categories: `${API_BASE_URL}/business/categories`,
    menu: (id) => `${API_BASE_URL}/business/${id}/menu`,
    menuItem: (id, itemId) => `${API_BASE_URL}/business/${id}/menu/${itemId}`,
  },

  // User endpoints
  user: {
    register: `${API_BASE_URL}/user/register`,
    login: `${API_BASE_URL}/user/login`,
    favorite: `${API_BASE_URL}/user/favorite`,
    favoriteById: (id) => `${API_BASE_URL}/user/favorite/${id}`,
    byId: (id) => `${API_BASE_URL}/user/user/${id}`,
  },

  // Utils endpoints (image uploads)
  utils: {
    upload: `${API_BASE_URL}/utils/upload`,
    uploadImages: `${API_BASE_URL}/utils/upload_images`,
  },

  // Map endpoints
  map: {
    search: `${API_BASE_URL}/map/search`,
    suggestions: `${API_BASE_URL}/map/suggestions`,
    geocode: `${API_BASE_URL}/map/geocode`,
    reverse: `${API_BASE_URL}/map/reverse`,
    route: `${API_BASE_URL}/map/route`,
  },

  // Blog endpoints (already handled by api.ts)
  blogs: {
    base: `${API_BASE_URL}/blogs`,
    featured: `${API_BASE_URL}/blogs/featured`,
    bySlug: (slug) => `${API_BASE_URL}/blogs/${slug}`,
    byId: (id) => `${API_BASE_URL}/blogs/${id}`,
  }
};

export default API_BASE_URL;

