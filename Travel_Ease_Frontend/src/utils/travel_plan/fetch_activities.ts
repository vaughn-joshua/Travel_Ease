import { endpoints } from '../../config/api';
import type { Activity } from '../../types/travelPlan';

export async function fetch_activities(planId: number | string): Promise<Activity[]> {
  try {
    const token = localStorage.getItem('token');
    const result = await fetch(endpoints.travelPlan.activities(planId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!result.ok) {
      throw new Error(`Failed to fetch activities: ${result.status}`);
    }

    const response = await result.json();
    return response.data || response || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}
