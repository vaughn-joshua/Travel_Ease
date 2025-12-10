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
  // #region agent log
  const _debugStart = Date.now();
  // #endregion
  // Skip API call if not authenticated
  const token = localStorage.getItem("token");
  if (!token) {
    return { ...EMPTY_RESULT, dbUnavailable: false };
  }

  try {
    const response = await api.get<GroupedPlansResult>("/travel_plan/all");
    // #region agent log
    const _totalPlans = (response.data.upcoming?.data?.length || 0) + (response.data.ongoing?.data?.length || 0) + (response.data.previous?.data?.length || 0);
    fetch('http://127.0.0.1:7242/ingest/410e2dac-4389-45cd-a989-70f6c3608015',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'fetch_grouped_plans.ts',message:'Frontend: grouped plans fetch complete',data:{elapsed:Date.now()-_debugStart,totalPlans:_totalPlans,dbUnavailable:response.data.dbUnavailable},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'FE'})}).catch(()=>{});
    // #endregion

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
