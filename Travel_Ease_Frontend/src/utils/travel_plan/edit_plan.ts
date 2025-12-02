import { endpoints } from '../../config/api';
import type { PlanStatus } from '../../types/travelPlan';

interface EditPlanData {
  name?: string;
  title?: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  max_slots?: number;
  slots?: number;
  visibility?: boolean;
  is_public?: boolean;
  status?: PlanStatus;
}

interface EditPlanResponse {
  message?: string;
  plan?: Record<string, unknown>;
  error?: string;
  details?: string;
}

export async function edit_plan(id: number | string, data: EditPlanData): Promise<EditPlanResponse | null> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { error: 'Authentication required. Please log in.' };
    }

    // Normalize field names for backend compatibility
    const payload: Record<string, unknown> = {};
    if (data.title !== undefined) payload.name = data.title;
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.location !== undefined) payload.location = data.location;
    if (data.start_date !== undefined) payload.start_date = data.start_date;
    if (data.end_date !== undefined) payload.end_date = data.end_date;
    if (data.max_slots !== undefined) payload.max_slots = data.max_slots;
    if (data.slots !== undefined) payload.max_slots = data.slots;
    if (data.visibility !== undefined) payload.visibility = data.visibility;
    if (data.is_public !== undefined) payload.visibility = data.is_public;
    if (data.status !== undefined) payload.status = data.status;

    const result = await fetch(endpoints.travelPlan.editPlan(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const response: EditPlanResponse = await result.json();

    if (!result.ok) {
      return {
        error: response.error || `Failed to update plan: ${result.status}`,
        details: response.details,
      };
    }

    return response;
  } catch (e) {
    console.error('Error editing plan:', e);
    return { error: e instanceof Error ? e.message : 'Failed to update plan' };
  }
}
