import { endpoints } from '../../config/api';

interface CreateActivityData {
  travel_plan_id: number | string;
  notes?: string;
  target_date?: string;
  budget_range?: string;
  lat?: number;
  lng?: number;
  location?: string;
  name?: string;
  brgy?: string;
  province?: string;
  city?: string;
}

export async function create_activity(data: CreateActivityData): Promise<unknown> {
  try {
    const token = localStorage.getItem('token');
    const result = await fetch(endpoints.travelPlan.createActivity, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const response = await result.json();
    return response;
  } catch (e) {
    console.error(e);
    return null;
  }
}
