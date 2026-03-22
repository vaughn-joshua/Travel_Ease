// Sort options
export type SortOption = "default" | "price_asc" | "price_desc" | "rating_desc" | "name_asc";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "default", label: "Default (Rating)" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating_desc", label: "Highest Rated" },
  { value: "name_asc", label: "Name: A to Z" },
];

export const CATEGORIES = [
  { value: "accommodation", label: "Accommodation" },
  { value: "food_drinks", label: "Food & Drinks" },
  { value: "tours_activities", label: "Tours & Activities" },
  { value: "transport_transfers", label: "Transport & Transfers" },
  { value: "travel_services", label: "Travel Services" },
  { value: "shopping_souvenirs", label: "Shopping & Souvenirs" },
  { value: "wellness_medical", label: "Wellness & Medical" },
  { value: "events_experiences", label: "Events & Experiences" },
  { value: "outdoor_gear_rental", label: "Outdoor / Gear Rental" },
] as const;

export const PRICE_RANGES = [
  { value: "0-100", label: "₱0 - ₱100", min: 0, max: 100 },
  { value: "100-200", label: "₱100 - ₱200", min: 100, max: 200 },
  { value: "200-400", label: "₱200 - ₱400", min: 200, max: 400 },
  { value: "400-700", label: "₱400 - ₱700", min: 400, max: 700 },
  { value: "700-1000", label: "₱700 - ₱1,000", min: 700, max: 1000 },
  { value: "1000-1500", label: "₱1,000 - ₱1,500", min: 1000, max: 1500 },
  { value: "1500+", label: "₱1,500+", min: 1500, max: Infinity },
] as const;

export const PRICE_SLIDER_MIN = 0;
export const PRICE_SLIDER_MAX = 5000;
export const PRICE_SLIDER_STEP = 50;
