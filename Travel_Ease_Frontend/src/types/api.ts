// API response and utility types

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: ValidationError[];
}

export interface ValidationError {
  path?: string[];
  message: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// Image upload types
export interface UploadResponse {
  url: string;
  public_id?: string;
}

export interface MultiUploadResponse {
  urls: string[];
  public_ids?: string[];
}

// Endpoints configuration type
export interface TravelPlanEndpoints {
  base: string;
  ongoing: string;
  plans: string;
  previous: string;
  public: string;
  quickJoin: string;
  byId: (id: number | string) => string;
  activities: (id: number | string) => string;
  createActivity: string;
  createPlan: string;
  editPlan: (id: number | string) => string;
  editActivity: (id: number | string) => string;
  updateActivity: (id: number | string) => string;
  deleteActivity: (id: number | string) => string;
  // Participant/Collaborator endpoints
  participants: (id: number | string) => string;
  participantById: (planId: number | string, userId: number | string) => string;
}

export interface BusinessEndpoints {
  base: string;
  businesses: string;
  create: string;
  byId: (id: number | string) => string;
  categoriesById: (id: number | string) => string;
  edit: (id: number | string) => string;
  priceRange: string;
  travelSpots: string;
  reviews: (id: number | string) => string;
  categories: string;
  menu: (id: number | string) => string;
  menuItem: (id: number | string, itemId: number | string) => string;
}

export interface UserEndpoints {
  register: string;
  login: string;
  favorite: string;
  favoriteById: (id: number | string) => string;
  byId: (id: number | string) => string;
}

export interface UtilsEndpoints {
  upload: string;
  uploadImages: string;
}

export interface MapEndpoints {
  search: string;
  suggestions: string;
  geocode: string;
  reverse: string;
  route: string;
}

export interface BlogEndpoints {
  base: string;
  featured: string;
  overview: string;
  bySlug: (slug: string) => string;
  byId: (id: string) => string;
}

export interface Endpoints {
  travelPlan: TravelPlanEndpoints;
  business: BusinessEndpoints;
  user: UserEndpoints;
  utils: UtilsEndpoints;
  map: MapEndpoints;
  blogs: BlogEndpoints;
}

