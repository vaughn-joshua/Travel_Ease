import { endpoints } from "../../config/api";

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

export async function fetch_participants(planId: number | string): Promise<Participant[]> {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No authentication token found for fetch_participants.");
      return [];
    }

    const result = await fetch(endpoints.travelPlan.participants(planId), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!result.ok) {
      throw new Error(`Failed to fetch participants: ${result.status}`);
    }

    const response: ParticipantsResponse = await result.json();
    return response.data || [];
  } catch (e) {
    console.error("Error fetching participants:", e);
    return [];
  }
}

/**
 * @deprecated Use `useRemoveParticipant` mutation hook from features/travelPlans/mutations.ts instead.
 * This utility will be removed in a future version.
 */
export async function remove_participant(planId: number | string, userId: number): Promise<boolean> {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication required");
    }

    const result = await fetch(endpoints.travelPlan.participantById(planId, userId), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!result.ok) {
      const error = await result.json();
      throw new Error(error.error || `Failed to remove participant: ${result.status}`);
    }

    return true;
  } catch (e) {
    console.error("Error removing participant:", e);
    throw e;
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

    const result = await fetch(endpoints.travelPlan.participantById(planId, userId), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });

    if (!result.ok) {
      const error = await result.json();
      throw new Error(error.error || `Failed to update participant: ${result.status}`);
    }

    const response = await result.json();
    return response.participant;
  } catch (e) {
    console.error("Error updating participant:", e);
    throw e;
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

    const result = await fetch(endpoints.travelPlan.participantById(planId, userId), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ status: true }),
    });

    if (!result.ok) {
      const error = await result.json();
      throw new Error(error.error || `Failed to approve participant: ${result.status}`);
    }

    const response = await result.json();
    return response.participant;
  } catch (e) {
    console.error("Error approving participant:", e);
    throw e;
  }
}

