import { endpoints } from '../../config/api';

export async function delete_activity(activityId: number | string): Promise<boolean> {
  try {
    const token = localStorage.getItem('token');
    const result = await fetch(endpoints.travelPlan.deleteActivity(activityId), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return result.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}
