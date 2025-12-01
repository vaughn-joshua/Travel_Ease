import { businessApi } from "../../services/api";
import type { Business } from "../../types/business";

// Raw business shape from backend /api/business/travel_spots (with reviewCount)
interface RawBusiness {
  business_id: number;
  user_id: number | null;
  name: string;
  house_number: string | null;
  street: string | null;
  brgy: string | null;
  city: string | null;
  latitude: number | null;
  longtitude: number | null; // Note: typo in backend field name
  description: string | null;
  rating: number | null;
  status: boolean | null;
  picture: string | null;
  reviewCount: number;
}

// Normalize backend data to match frontend Business type
function normalizeBusiness(raw: RawBusiness): Business {
  const addressParts = [raw.house_number, raw.street, raw.brgy, raw.city]
    .filter(Boolean)
    .join(", ");

  return {
    id: raw.business_id,
    name: raw.name,
    description: raw.description,
    categories: [], // Not returned by travel_spots endpoint
    hours: {},
    priceRange: null,
    media: {
      cover: raw.picture,
      gallery: [],
    },
    menuItems: [],
    reviews: [],
    reviewCount: raw.reviewCount ?? 0,
    location: {
      lat: raw.latitude,
      lng: raw.longtitude, // Note: backend typo
      address: addressParts || "Location not available",
    },
    rating: raw.rating ? Number(raw.rating) : null,
    owner: null,
  };
}

export interface FetchBusinessesOptions {
  search?: string;
  city?: string;
  limit?: number;
  signal?: AbortSignal;
}

export async function fetch_businesses(options: FetchBusinessesOptions = {}): Promise<Business[]> {
  try {
    const { search, city, limit, signal } = options;
    const response = await businessApi.getTravelSpots({ search, city, limit }, signal);

    // Guard against unexpected response shapes
    if (!response.data || !Array.isArray(response.data)) {
      if (import.meta.env.DEV) {
        console.warn("Unexpected response shape from travel_spots:", response);
      }
      return [];
    }

    return response.data.map(normalizeBusiness);
  } catch (e: any) {
    // Ignore aborted requests
    if (e.name === "CanceledError" || e.code === "ERR_CANCELED") {
      return [];
    }
    if (import.meta.env.DEV) {
      console.error("Error fetching businesses:", e);
    }
    return [];
  }
}

