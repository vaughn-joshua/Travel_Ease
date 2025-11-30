// Travel Plan domain types
// Note: Backend uses travel_plan_id/name, frontend historically used id/title
// Both are supported for compatibility

export interface TravelPlan {
  // ID fields - backend returns travel_plan_id
  id: number;
  travel_plan_id?: number;
  // Title/name - backend returns name
  title: string;
  name?: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  // Status - backend uses PascalCase: Draft, Active, Completed, Cancelled
  status?: "Draft" | "Active" | "Completed" | "Cancelled" | "draft" | "ongoing" | "completed" | "cancelled";
  // Visibility - backend uses visibility boolean
  is_public?: boolean;
  visibility?: boolean;
  // Slots - backend uses max_slots
  slots?: number;
  max_slots?: number;
  // Participant count from backend
  approvedParticipants?: number;
  collaborators?: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
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
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  slots?: number;
  collaborators?: number;
  is_public?: boolean;
}

export interface UpdatePlanPayload extends Partial<CreatePlanPayload> {}

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

