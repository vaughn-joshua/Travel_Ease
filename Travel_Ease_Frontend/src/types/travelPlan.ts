// Travel Plan domain types
// Backend now returns normalized DTOs with both naming conventions for compatibility:
//   - id/travel_plan_id (both present)
//   - title/name (both present)
//   - slots/max_slots (both present)
//   - is_public/visibility (both present)
//   - status uses PascalCase: Draft, Active, Completed, Cancelled

export type PlanStatus = "Draft" | "Active" | "Completed" | "Cancelled";

export interface TravelPlan {
  // ID fields - backend returns both
  id: number;
  travel_plan_id: number;
  // Title/name - backend returns both
  title: string;
  name: string;
  description: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  // Status - PascalCase
  status: PlanStatus;
  // Visibility - backend returns both
  is_public: boolean;
  visibility: boolean;
  // Slots - backend returns both
  slots: number | null;
  max_slots: number | null;
  // Participant count from backend
  approvedParticipants?: number;
  slotsAvailable?: number | null;
  isFull?: boolean;
  participantCount?: number;
  user_id?: number;
  visibility_timestamp?: string | null;
  visibility_end_date?: string | null;
  // User relation if included
  user?: {
    user_id: number;
    first_name: string;
    last_name: string;
  };
  // User participation info (returned by public_plans when authenticated)
  isOwner?: boolean;
  isParticipant?: boolean;
  participantRole?: "Owner" | "Admin" | "Editor" | "Viewer" | null;
  // Accommodation info
  accommodation?: {
    business_id: number;
    name: string;
    lat?: number | null;
    lng?: number | null;
  } | null;
}

export interface TravelPlanDates {
  start: string;
  end: string;
}

// Activity DTO - matches backend normalized response
export interface Activity {
  activity_id: number;
  travel_plan_id: number;
  business_id?: number | null;
  user_id: number;
  
  // Location fields
  location: string | null;
  name: string | null;
  lat: number | null;
  lng: number | null;
  brgy: string | null;
  province: string | null;
  city: string | null;
  
  // Activity details
  notes: string | null;
  target_date: string | null;
  budget_range: BudgetRange | null;
  is_priority: boolean;
  
  // User info from relation (flattened)
  first_name?: string;
  last_name?: string;
  
  // Business relation if included
  business?: {
    business_id: number;
    name: string;
    latitude: number | null;
    longtitude: number | null;
  };
}

export interface CollaboratorPayload {
  user_id: number;
  role?: 'Admin' | 'Editor' | 'Viewer';
  status?: boolean;
}

export interface CreatePlanPayload {
  title: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  slots?: number;
  accommodation_id?: number;
  collaborators?: CollaboratorPayload[];
  is_public?: boolean;
}

export interface UpdatePlanPayload extends Omit<Partial<CreatePlanPayload>, 'accommodation_id'> {
  status?: PlanStatus;
  accommodation_id?: number | null;
}

export interface CreateActivityPayload {
  travel_plan_id: number;
  // Location fields
  location?: string;
  name?: string;
  lat?: number;
  lng?: number;
  brgy?: string;
  province?: string;
  city?: string;
  // Activity details
  target_date?: string;
  budget_range?: BudgetRange;
  notes?: string;
  business_id?: number; // Optional: link activity to a business
}

export interface UpdateActivityPayload {
  target_date?: string;
  budget_range?: BudgetRange;
  notes?: string;
  is_priority?: boolean;
}

export interface EditActivityDatePayload {
  target_date: string;
}

export interface QuickJoinPayload {
  location: string;
  start_date: string;
  end_date: string;
}

export interface Participant {
  id: number;
  user_id: number;
  travel_plan_id: number;
  role: "owner" | "admin" | "editor" | "viewer";
  joined_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export type BudgetRange =
  | "0-100"
  | "100-200"
  | "200-400"
  | "400-700"
  | "700-1000"
  | "1000-1500"
  | "1500+";

export const BUDGET_RANGES: BudgetRange[] = [
  "0-100",
  "100-200",
  "200-400",
  "400-700",
  "700-1000",
  "1000-1500",
  "1500+",
];

