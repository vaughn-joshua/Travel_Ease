import { endpoints } from '../../config/api';

interface EditActivityData {
  activity_id?: number;
  target_date?: string;
  budget_range?: string;
  notes?: string;
  is_priority?: boolean;
}

export async function edit_activity(activityIdOrData: number | EditActivityData, payload?: EditActivityData): Promise<unknown> {
  try {
    let activityId: number;
    let data: EditActivityData;
    
    if (typeof activityIdOrData === 'number') {
      activityId = activityIdOrData;
      data = payload || {};
    } else {
      activityId = activityIdOrData.activity_id!;
      data = activityIdOrData;
    }
    
    const token = localStorage.getItem('token');
    const result = await fetch(endpoints.travelPlan.editActivity(activityId), {
      method: 'PUT',
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
