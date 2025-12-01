import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetch_previous_plans } from "../../utils/travel_plan/fetch_previous_plans";
import type { TravelPlan } from "../../types/travelPlan";

export default function Previous_Plans(): React.ReactElement {
  const { loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    // Check for token in localStorage (the fetch utility also checks this)
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetch_previous_plans();
      setPlans(data);
    } catch (err) {
      console.error("Error fetching previous plans:", err);
      setError("Failed to load previous plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadPlans();
    }
  }, [authLoading, loadPlans]);

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">Previous Plans</h3>
      
      {/* Loading state */}
      {(authLoading || loading) && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-red"></div>
        </div>
      )}

      {/* Error state */}
      {!authLoading && !loading && error && (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2 text-sm">{error}</p>
          <button 
            onClick={loadPlans}
            className="text-primary-red hover:underline text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!authLoading && !loading && !error && plans.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm">No previous plans</p>
        </div>
      )}

      {/* Plans list */}
      {!authLoading && !loading && !error && plans.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-3"
            >
              <h4 className="font-medium text-gray-900 text-sm">{plan.title}</h4>
              <p className="text-xs text-gray-600 mt-1">{plan.location}</p>
              <p className="text-xs text-gray-400 mt-1">
                {plan.start_date} - {plan.end_date}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
