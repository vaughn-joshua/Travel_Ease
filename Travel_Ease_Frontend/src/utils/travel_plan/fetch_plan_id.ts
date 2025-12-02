import { endpoints } from '../../config/api';
import type { TravelPlan } from '../../types/travelPlan';

export async function fetch_plan_id(id: number | string): Promise<TravelPlan | null> {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('fetch_plan_id: No auth token found in localStorage');
      throw new Error('Authentication required. Please log in.');
    }

    const result = await fetch(endpoints.travelPlan.byId(id), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!result.ok) {
      const errorBody = await result.text();
      console.error(`fetch_plan_id: API error ${result.status}:`, errorBody);
      
      if (result.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      if (result.status === 403) {
        throw new Error('You do not have permission to view this plan.');
      }
      if (result.status === 404) {
        throw new Error('Plan not found.');
      }
      throw new Error(`Failed to fetch plan: ${result.status}`);
    }

    const data = await result.json();
    return data;
  } catch (e) {
    console.error('fetch_plan_id error:', e);
    throw e; // Re-throw so TanStack Query can handle the error
  }
}
