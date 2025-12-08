/**
 * Travel Plan API Service
 *
 * Centralized API service for all travel plan mutations.
 * Uses the shared axios instance which handles auth headers automatically.
 */

import api from "./api";
import { endpoints } from "../config/api";
import type {
  TravelPlan,
  Activity,
  CreatePlanPayload,
  UpdatePlanPayload,
  CreateActivityPayload,
  UpdateActivityPayload,
  QuickJoinPayload,
} from "../types/travelPlan";
import type { Participant } from "../utils/travel_plan/fetch_participants";

// ─────────────────────────────────────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────────────────────────────────────

interface CreatePlanResponse {
  message: string;
  travel_plan_id: number;
  id: number;
  title: string;
  name: string;
}

interface UpdatePlanResponse {
  message: string;
  plan: TravelPlan;
}

interface CreateActivityResponse {
  message: string;
  activity: Activity;
}

interface UpdateActivityResponse {
  message: string;
  activity: Activity;
}

interface DeleteActivityResponse {
  message: string;
}

interface JoinPlanResponse {
  message: string;
  participant?: Participant;
  error?: string;
}

interface RequestJoinResponse {
  message: string;
  participant?: Participant;
  error?: string;
}

interface ParticipantResponse {
  message: string;
  participant?: Participant;
}

interface UserRoleResponse {
  isOwner: boolean;
  role: "Admin" | "Editor" | "Viewer" | null;
  isParticipant: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Travel Plan API
// ─────────────────────────────────────────────────────────────────────────────

export const travelPlanApi = {
  // ─────────────────────────────────────────────────────────────────────────
  // Plan CRUD
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a new travel plan
   */
  createPlan: async (data: CreatePlanPayload): Promise<CreatePlanResponse> => {
    console.log("[travelPlanApi.createPlan] ========== API CALL ==========");
    console.log("[travelPlanApi.createPlan] Endpoint:", endpoints.travelPlan.createPlan);
    console.log("[travelPlanApi.createPlan] Payload:", JSON.stringify(data, null, 2));
    try {
      const response = await api.post<CreatePlanResponse>(
        endpoints.travelPlan.createPlan,
        data
      );
      console.log("[travelPlanApi.createPlan] ✅ Response status:", response.status);
      console.log("[travelPlanApi.createPlan] Response data:", response.data);
      return response.data;
    } catch (error) {
      console.error("[travelPlanApi.createPlan] ❌ API Error:", error);
      throw error;
    }
  },

  /**
   * Update an existing travel plan
   */
  updatePlan: async (
    id: number | string,
    data: UpdatePlanPayload
  ): Promise<UpdatePlanResponse> => {
    // Normalize field names for backend compatibility
    const payload: Record<string, unknown> = {};
    if (data.title !== undefined) payload.name = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.location !== undefined) payload.location = data.location;
    if (data.start_date !== undefined) payload.start_date = data.start_date;
    if (data.end_date !== undefined) payload.end_date = data.end_date;
    if (data.slots !== undefined) payload.max_slots = data.slots;
    if (data.is_public !== undefined) payload.visibility = data.is_public;
    if (data.status !== undefined) payload.status = data.status;
    // Handle accommodation_id: include null to remove, undefined to not change
    if (data.accommodation_id !== undefined) {
      payload.accommodation_id = data.accommodation_id;
    }

    console.log("[travelPlanApi.updatePlan] ========== API CALL ==========");
    console.log("[travelPlanApi.updatePlan] Plan ID:", id);
    console.log("[travelPlanApi.updatePlan] Endpoint:", endpoints.travelPlan.editPlan(id));
    console.log("[travelPlanApi.updatePlan] Payload:", JSON.stringify(payload, null, 2));
    try {
      const response = await api.put<UpdatePlanResponse>(
        endpoints.travelPlan.editPlan(id),
        payload
      );
      console.log("[travelPlanApi.updatePlan] ✅ Response status:", response.status);
      console.log("[travelPlanApi.updatePlan] Response data:", response.data);
      return response.data;
    } catch (error) {
      console.error("[travelPlanApi.updatePlan] ❌ API Error:", error);
      throw error;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Activity CRUD
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a new activity in a travel plan
   */
  createActivity: async (
    data: CreateActivityPayload
  ): Promise<CreateActivityResponse> => {
    console.log("[travelPlanApi.createActivity] ========== API CALL ==========");
    console.log("[travelPlanApi.createActivity] Endpoint:", endpoints.travelPlan.createActivity);
    console.log("[travelPlanApi.createActivity] Payload:", JSON.stringify(data, null, 2));
    try {
      const response = await api.post<CreateActivityResponse>(
        endpoints.travelPlan.createActivity,
        data
      );
      console.log("[travelPlanApi.createActivity] ✅ Response status:", response.status);
      console.log("[travelPlanApi.createActivity] Response data:", response.data);
      return response.data;
    } catch (error) {
      console.error("[travelPlanApi.createActivity] ❌ API Error:", error);
      throw error;
    }
  },

  /**
   * Update an existing activity
   */
  updateActivity: async (
    activityId: number | string,
    data: UpdateActivityPayload
  ): Promise<UpdateActivityResponse> => {
    console.log("[travelPlanApi.updateActivity] ========== API CALL ==========");
    console.log("[travelPlanApi.updateActivity] Activity ID:", activityId);
    console.log("[travelPlanApi.updateActivity] Endpoint:", endpoints.travelPlan.editActivity(activityId));
    console.log("[travelPlanApi.updateActivity] Payload:", JSON.stringify(data, null, 2));
    try {
      const response = await api.put<UpdateActivityResponse>(
        endpoints.travelPlan.editActivity(activityId),
        data
      );
      console.log("[travelPlanApi.updateActivity] ✅ Response status:", response.status);
      console.log("[travelPlanApi.updateActivity] Response data:", response.data);
      return response.data;
    } catch (error) {
      console.error("[travelPlanApi.updateActivity] ❌ ERROR - Full error:", error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error("[travelPlanApi.updateActivity] Response status:", axiosError.response?.status);
        console.error("[travelPlanApi.updateActivity] Response data:", axiosError.response?.data);
      }
      throw error;
    }
  },

  /**
   * Delete an activity
   */
  deleteActivity: async (
    activityId: number | string
  ): Promise<DeleteActivityResponse> => {
    const response = await api.delete<DeleteActivityResponse>(
      endpoints.travelPlan.deleteActivity(activityId)
    );
    return response.data;
  },

  /**
   * Toggle an activity's priority
   */
  toggleActivityPriority: async (
    activityId: number | string
  ): Promise<UpdateActivityResponse> => {
    const response = await api.patch<UpdateActivityResponse>(
      `/travel_plan/activity/${activityId}/priority`
    );
    return response.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Join / Request Join
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Search for public plans to join (Quick Join)
   */
  quickJoinSearch: async (data: QuickJoinPayload): Promise<TravelPlan[]> => {
    const response = await api.post<TravelPlan[]>(
      endpoints.travelPlan.quickJoin,
      data
    );
    return response.data;
  },

  /**
   * Join a travel plan directly
   */
  joinPlan: async (data: {
    travel_plan_id: number;
    role?: string;
  }): Promise<JoinPlanResponse> => {
    const response = await api.put<JoinPlanResponse>(
      endpoints.travelPlan.joinPlan,
      data
    );
    return response.data;
  },

  /**
   * Request to join a travel plan (requires approval)
   */
  requestJoin: async (data: {
    travel_plan_id: number;
  }): Promise<RequestJoinResponse> => {
    const response = await api.post<RequestJoinResponse>(
      endpoints.travelPlan.requestJoin,
      data
    );
    return response.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Participant Management
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Remove a participant from a travel plan
   */
  removeParticipant: async (
    planId: number | string,
    userId: number
  ): Promise<ParticipantResponse> => {
    const response = await api.delete<ParticipantResponse>(
      endpoints.travelPlan.participantById(planId, userId)
    );
    return response.data;
  },

  /**
   * Update a participant's role
   */
  updateParticipantRole: async (
    planId: number | string,
    userId: number,
    role: "Admin" | "Editor" | "Viewer"
  ): Promise<ParticipantResponse> => {
    const response = await api.put<ParticipantResponse>(
      endpoints.travelPlan.participantById(planId, userId),
      { role }
    );
    return response.data;
  },

  /**
   * Approve a pending participant
   */
  approveParticipant: async (
    planId: number | string,
    userId: number
  ): Promise<ParticipantResponse> => {
    const response = await api.put<ParticipantResponse>(
      endpoints.travelPlan.participantById(planId, userId),
      { status: true }
    );
    return response.data;
  },

  /**
   * Add a new participant to a travel plan
   */
  addParticipant: async (
    planId: number | string,
    data: { user_id: number; role?: "Admin" | "Editor" | "Viewer"; status?: boolean }
  ): Promise<ParticipantResponse> => {
    const response = await api.post<ParticipantResponse>(
      endpoints.travelPlan.participants(planId),
      {
        user_id: data.user_id,
        role: data.role || "Viewer",
        status: data.status ?? true,
      }
    );
    return response.data;
  },

  /**
   * Get the current user's role for a specific plan
   */
  getUserRole: async (planId: number | string): Promise<UserRoleResponse> => {
    const response = await api.get<UserRoleResponse>(
      `/travel_plan/${planId}/user-role`
    );
    return response.data;
  },
};

export default travelPlanApi;

