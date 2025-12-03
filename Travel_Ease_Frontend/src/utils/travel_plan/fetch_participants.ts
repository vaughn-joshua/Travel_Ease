import api from "../../services/api";

export interface ParticipantUser {
  user_id: number;
  first_name: string;
  last_name: string;
  email?: string;
}

export interface Participant {
  participant_id: number;
  travel_plan_id: number;
  user_id: number;
  role: "Admin" | "Editor" | "Viewer";
  status: boolean;
  joined_at?: string;
  user?: ParticipantUser;
}

export interface ParticipantsResponse {
  message: string;
  data: Participant[];
}

export async function fetch_participants(
  planId: number | string
): Promise<Participant[]> {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No authentication token found for fetch_participants.");
      return [];
    }

    const response = await api.get<ParticipantsResponse>(
      `/travel_plan/${planId}/participants`
    );
    return response.data.data || [];
  } catch (e) {
    console.error("Error fetching participants:", e);
    return [];
  }
}

/**
 * @deprecated Use `useRemoveParticipant` mutation hook from features/travelPlans/mutations.ts instead.
 * This utility will be removed in a future version.
 */
export async function remove_participant(
  planId: number | string,
  userId: number
): Promise<boolean> {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication required");
    }

    await api.delete(`/travel_plan/${planId}/participants/${userId}`);
    return true;
  } catch (e: any) {
    console.error("Error removing participant:", e);
    throw new Error(
      e.response?.data?.error ||
        `Failed to remove participant: ${e.response?.status}`
    );
  }
}

/**
 * @deprecated Use `useUpdateParticipantRole` mutation hook from features/travelPlans/mutations.ts instead.
 * This utility will be removed in a future version.
 */
export async function update_participant_role(
  planId: number | string,
  userId: number,
  role: "Admin" | "Editor" | "Viewer"
): Promise<Participant | undefined> {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await api.put<{ participant: Participant }>(
      `/travel_plan/${planId}/participants/${userId}`,
      { role }
    );
    return response.data.participant;
  } catch (e: any) {
    console.error("Error updating participant:", e);
    throw new Error(
      e.response?.data?.error ||
        `Failed to update participant: ${e.response?.status}`
    );
  }
}

/**
 * @deprecated Use `useApproveParticipant` mutation hook from features/travelPlans/mutations.ts instead.
 * This utility will be removed in a future version.
 */
export async function approve_participant(
  planId: number | string,
  userId: number
): Promise<Participant | undefined> {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await api.put<{ participant: Participant }>(
      `/travel_plan/${planId}/participants/${userId}`,
      { status: true }
    );
    return response.data.participant;
  } catch (e: any) {
    console.error("Error approving participant:", e);
    throw new Error(
      e.response?.data?.error ||
        `Failed to approve participant: ${e.response?.status}`
    );
  }
}
