import { endpoints } from "../../config/api";
import type { Business } from "../../types/business";

// Raw response shape from backend /api/business/travel_spots
interface TravelSpotsResponse {
  message: string;
  data: RawBusiness[];
}

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
    reviewCount: 0,
    location: {
      lat: raw.latitude,
      lng: raw.longtitude, // Note: backend typo
      address: addressParts || "Location not available",
    },
    rating: raw.rating ? Number(raw.rating) : null,
    owner: null,
  };
}

export async function fetch_businesses(): Promise<Business[]> {
  try {
    const result = await fetch(endpoints.business.travelSpots, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!result.ok) {
      throw new Error(`Failed to fetch businesses: ${result.status}`);
    }

    const response: TravelSpotsResponse = await result.json();
    
    // Guard against unexpected response shapes
    if (!response.data || !Array.isArray(response.data)) {
      console.warn("Unexpected response shape from travel_spots:", response);
      return [];
    }

    return response.data.map(normalizeBusiness);
  } catch (e) {
    console.error("Error fetching businesses:", e);
    return [];
  }
}

