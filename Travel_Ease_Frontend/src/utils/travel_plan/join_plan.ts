import { endpoints } from '../../config/api';

interface JoinPlanData {
  travel_plan_id: number;
  role?: string;
}

interface JoinPlanResponse {
  message: string;
  participant?: unknown;
  error?: string;
}

export async function join_plan(data: JoinPlanData): Promise<JoinPlanResponse | null> {
  try {
    const token = localStorage.getItem('token');
    const result = await fetch(`${endpoints.travelPlan.base}/join_plan`, {
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
