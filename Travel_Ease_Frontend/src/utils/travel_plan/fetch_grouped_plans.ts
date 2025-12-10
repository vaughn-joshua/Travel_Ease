import api from "../../services/api";
import type { GroupedPlansResult, PlanGroupData } from "../../types/travelPlan";

const EMPTY_GROUP: PlanGroupData = {
  data: [],
  total: 0,
};

const EMPTY_RESULT: GroupedPlansResult = {
  upcoming: EMPTY_GROUP,
  ongoing: EMPTY_GROUP,
  previous: EMPTY_GROUP,
  dbUnavailable: false,
};

/**
 * Fetch all user's travel plans in a single request, grouped by status:
 * - upcoming: Draft plans
 * - ongoing: Active plans
 * - previous: Completed/Cancelled plans
 * 
 * This consolidates 3 separate API calls into one for better performance.
 */
export async function fetch_grouped_plans(): Promise<GroupedPlansResult> {
  // Skip API call if not authenticated
  const token = localStorage.getItem("token");
  if (!token) {
    return { ...EMPTY_RESULT, dbUnavailable: false };
  }

  try {
    const response = await api.get<GroupedPlansResult>("/travel_plan/all");

    return {
      upcoming: response.data.upcoming || EMPTY_GROUP,
      ongoing: response.data.ongoing || EMPTY_GROUP,
      previous: response.data.previous || EMPTY_GROUP,
      dbUnavailable: Boolean(response.data.dbUnavailable),
    };
  } catch (e: any) {
    const status = e.response?.status;
    const code = e.response?.data?.code;
    const isAuthError = status === 401 || status === 403;
    const isDbUnavailable =
      status === 503 || code === "CONNECTION_ERROR" || code === "DB_UNAVAILABLE";

    if (import.meta.env.DEV && !isAuthError) {
      console.error("Error fetching grouped plans:", e);
    }

    return {
      ...EMPTY_RESULT,
      dbUnavailable: Boolean(isDbUnavailable),
    };
  }
}
