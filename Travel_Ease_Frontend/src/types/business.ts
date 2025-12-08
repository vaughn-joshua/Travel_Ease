// Business domain types

export interface BusinessCategory {
  id: number;
  name: string;
}

/**
 * Raw travel spot data from API (different shape from transformed Business)
 */
export interface TravelSpotBusiness {
  business_id: number;
  user_id: number | null;
  name: string;
  house_number: string | null;
  street: string | null;
  brgy: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null; // Fixed: backend returns 'longitude' (Prisma model field name)
  description: string | null;
  rating: number | null;
  status: boolean | null;
  picture: string | null;
  reviewCount: number;
  min_price: number | null;
  max_price: number | null;
}

export interface BusinessHours {
  open: string | null;
  close: string | null;
}

export interface BusinessHoursMap {
  monday?: BusinessHours;
  tuesday?: BusinessHours;
  wednesday?: BusinessHours;
  thursday?: BusinessHours;
  friday?: BusinessHours;
  saturday?: BusinessHours;
  sunday?: BusinessHours;
  [key: string]: BusinessHours | undefined;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface BusinessMedia {
  cover: string | null;
  gallery: string[];
}

export interface BusinessLocation {
  lat: number | null;
  lng: number | null;
  address: string;
}

export interface BusinessOwner {
  id: number;
  name: string;
  email: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string | null;
  isAvailable: boolean;
}

export interface BusinessReview {
  id: number;
  rating: number | null;
  content: string | null;
  date: string;
  user: { id: number; name: string } | null;
}

export interface Business {
  id: number;
  name: string;
  description: string | null;
  categories: BusinessCategory[];
  hours: BusinessHoursMap;
  priceRange: PriceRange | null;
  media: BusinessMedia;
  menuItems: MenuItem[];
  reviews: BusinessReview[];
  reviewCount: number;
  location: BusinessLocation;
  rating: number | null;
  owner: BusinessOwner | null;
}

export interface BusinessListResponse {
  items: Business[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BusinessQueryParams {
  page?: number;
  pageSize?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  status?: boolean;
}

export interface CreateBusinessPayload {
  name: string;
  description?: string;
  categoryIds: number[];
  hours?: BusinessHoursMap;
  priceMin?: number;
  priceMax?: number;
  coverImage?: string;
  gallery?: string[];
  lat?: number;
  lng?: number;
  address?: string;
}

export interface UpdateBusinessPayload extends Partial<CreateBusinessPayload> {}

export interface CreateBusinessResponse {
  message: string;
  business_id: number;
}

export interface MenuItemsResponse {
  items: MenuItem[];
  total: number;
}

export interface MenuItemResponse {
  message: string;
  item: MenuItem;
}

