// Map and location domain types

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AddressComponents {
  barangay?: string;
  city?: string;
  province?: string;
  country?: string;
  postcode?: string;
}

export interface NormalizedPlace {
  id: string;
  name: string;
  fullLabel: string;
  lat: number;
  lng: number;
  type?: string;
  address?: AddressComponents;
}

export interface SearchResult {
  lat: number;
  lng: number;
  name: string;
  label: string;
  address?: AddressComponents;
  business_id?: number; // Optional: for linking to a business when adding from suggested businesses
}

export interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
}

export interface RouteSubmission {
  start: RoutePoint;
  end: RoutePoint;
}

// Nominatim API response types (legacy format)
export interface NominatimPlace {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  address?: {
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

// New backend-normalized format
export interface BackendPlace {
  placeId: string;
  label: string;
  coordinates: Coordinates;
  type?: string;
  address?: AddressComponents;
}

export interface SuggestionsResponse {
  suggestions: BackendPlace[];
}

export interface GeocodeResponse {
  place: BackendPlace;
}

// Search state machine types
export type SearchStatus = "idle" | "loading" | "success" | "error";

export interface SearchState {
  status: SearchStatus;
  query: string;
  suggestions: NormalizedPlace[];
  error: string | null;
}

export type SearchAction =
  | { type: "SET_QUERY"; payload: string }
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: NormalizedPlace[] }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "CLEAR_SUGGESTIONS" }
  | { type: "RESET" };

