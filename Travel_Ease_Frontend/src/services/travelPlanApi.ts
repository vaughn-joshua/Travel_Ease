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
    const response = await api.post<CreatePlanResponse>(
      endpoints.travelPlan.createPlan,
      data
    );
    return response.data;
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

    const response = await api.put<UpdatePlanResponse>(
      endpoints.travelPlan.editPlan(id),
      payload
    );
    return response.data;
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
    const response = await api.post<CreateActivityResponse>(
      endpoints.travelPlan.createActivity,
      data
    );
    return response.data;
  },

  /**
   * Update an existing activity
   */
  updateActivity: async (
    activityId: number | string,
    data: UpdateActivityPayload
  ): Promise<UpdateActivityResponse> => {
    const response = await api.put<UpdateActivityResponse>(
      endpoints.travelPlan.editActivity(activityId),
      data
    );
    return response.data;
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
};

export default travelPlanApi;

