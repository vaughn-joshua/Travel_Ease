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
}

export interface TravelPlanDates {
  start: string;
  end: string;
}

export interface Activity {
  activity_id: number;
  travel_plan_id: number;
  user_id: number;
  name: string;
  location: string;
  lat: number;
  lng: number;
  brgy: string;
  province: string;
  city: string;
  target_date: string;
  budget_range: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePlanPayload {
  title: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  slots?: number;
  collaborators?: number;
  is_public?: boolean;
}

export interface UpdatePlanPayload extends Partial<CreatePlanPayload> {
  status?: PlanStatus;
}

export interface CreateActivityPayload {
  travel_plan_id: number;
  user_id: number;
  name?: string;
  location: string;
  lat: number;
  lng: number;
  brgy: string;
  province: string;
  city: string;
  target_date: string;
  budget_range: string;
  notes?: string;
}

export interface UpdateActivityPayload extends Partial<CreateActivityPayload> {}

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

