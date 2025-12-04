/**
 * Shared constants for Activity domain
 * Budget ranges are stored in DB as Prisma enum values like 'RANGE_0_100', etc.
 * These values must stay in sync with:
 *   - Prisma schema (prisma/schema.prisma) - enum range
 *   - Zod validation schemas (src/schemas/validation.ts)
 *   - Frontend types and UI components
 */

// Budget range values as displayed to users (frontend format)
export const BUDGET_RANGES = [
  "0-100",
  "100-200",
  "200-400",
  "400-700",
  "700-1000",
  "1000-1500",
  "1500+",
];

// Prisma enum values (database format)
export const PRISMA_BUDGET_RANGES = [
  "RANGE_0_100",
  "RANGE_100_200",
  "RANGE_200_400",
  "RANGE_400_700",
  "RANGE_700_1000",
  "RANGE_1000_1500",
  "RANGE_1500_PLUS",
];

// Map from frontend format to Prisma enum format
export const BUDGET_RANGE_TO_PRISMA: Record<string, string> = {
  "0-100": "RANGE_0_100",
  "100-200": "RANGE_100_200",
  "200-400": "RANGE_200_400",
  "400-700": "RANGE_400_700",
  "700-1000": "RANGE_700_1000",
  "1000-1500": "RANGE_1000_1500",
  "1500+": "RANGE_1500_PLUS",
};

// Map from Prisma enum format to frontend format
export const BUDGET_RANGE_FROM_PRISMA: Record<string, string> =
  Object.fromEntries(
    Object.entries(BUDGET_RANGE_TO_PRISMA).map(([k, v]) => [v, k])
  );

// Legacy aliases for backward compatibility
export const BUDGET_RANGE_MAP = BUDGET_RANGE_FROM_PRISMA;
export const BUDGET_RANGE_REVERSE_MAP = BUDGET_RANGE_TO_PRISMA;

/**
 * Normalize budget range input to Prisma enum format
 * Accepts either format: 'RANGE_0_100' or '0-100'
 * @param value - Budget range value
 * @returns Prisma enum value or null if invalid
 */
export function normalizeBudgetRange(
  value: string | null | undefined
): string | null {
  if (!value) return null;

  // If it's already in Prisma format, validate and return
  if (PRISMA_BUDGET_RANGES.includes(value)) {
    return value;
  }

  // If it's in frontend format, convert to Prisma format
  if (BUDGET_RANGE_TO_PRISMA[value]) {
    return BUDGET_RANGE_TO_PRISMA[value];
  }

  return null;
}

interface ActivityData {
  activity_id: number;
  travel_plan_id: number | null;
  business_id?: number | null;
  user_id?: number | null;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
  brgy?: string | null;
  province?: string | null;
  city?: string | null;
  name?: string | null;
  notes?: string | null;
  target_date?: Date | null;
  budget_range?: string | null;
  is_priority?: boolean | null;
  user?: {
    first_name: string;
    last_name: string;
  } | null;
  business?: any;
  toJSON?: () => any;
}

/**
 * Format a single activity to normalized DTO shape
 * @param activity - Prisma model instance or plain object
 * @param extras - Additional fields to merge
 * @returns Normalized activity DTO
 */
export function formatActivity(
  activity: ActivityData,
  extras: Record<string, any> = {}
): Record<string, any> {
  const data = activity.toJSON ? activity.toJSON() : activity;

  // Convert Prisma enum to frontend format
  const budgetRange = data.budget_range
    ? BUDGET_RANGE_FROM_PRISMA[data.budget_range] || data.budget_range
    : null;

  return {
    activity_id: data.activity_id,
    travel_plan_id: data.travel_plan_id,
    business_id: data.business_id,
    user_id: data.user_id,

    // Location fields
    location: data.location,
    lat: data.lat,
    lng: data.lng,
    brgy: data.brgy,
    province: data.province,
    city: data.city,
    name: data.name,

    // Activity details
    notes: data.notes,
    target_date: data.target_date,
    budget_range: budgetRange,
    is_priority: data.is_priority ?? false,

    // Include user relation if present
    ...(data.user && {
      first_name: data.user.first_name,
      last_name: data.user.last_name,
    }),

    // Include business relation if present
    ...(data.business && { business: data.business }),

    // Merge any extras
    ...extras,
  };
}

/**
 * Format an array of activities
 * @param activities - Array of Prisma result objects or plain objects
 * @returns Array of normalized activity DTOs
 */
export function formatActivities(
  activities: ActivityData[]
): Record<string, any>[] {
  return activities.map((activity) => formatActivity(activity));
}

