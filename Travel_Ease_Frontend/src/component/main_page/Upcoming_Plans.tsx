import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetch_plans } from "../../utils/travel_plan/fetch_plans";
import type { TravelPlan } from "../../types/travelPlan";

export default function Upcoming_Plans(): React.ReactElement {
  const navigate = useNavigate();
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
      const data = await fetch_plans();
      setPlans(data);
    } catch (err) {
      console.error("Error fetching upcoming plans:", err);
      setError("Failed to load upcoming plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadPlans();
    }
  }, [authLoading, loadPlans]);

  const handle_click = (id: number): void => {
    navigate(`/planner/start/${id}`);
  };

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">Upcoming Plans</h3>
      
      {/* Loading state */}
      {(authLoading || loading) && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
        </div>
      )}

      {/* Error state */}
      {!authLoading && !loading && error && (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">{error}</p>
          <button 
            onClick={loadPlans}
            className="text-primary-red hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!authLoading && !loading && !error && plans.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No upcoming plans</p>
          <p className="text-sm mt-1">Your future travel plans will appear here</p>
        </div>
      )}

      {/* Plans grid */}
      {!authLoading && !loading && !error && plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handle_click(plan.id)}
            >
              <h3 className="font-semibold text-gray-900">{plan.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{plan.location}</p>
              <p className="text-sm text-gray-500 mt-2">
                {plan.start_date} - {plan.end_date}
              </p>
              {plan.participants !== undefined && (
                <p className="text-xs text-gray-400 mt-2">
                  {plan.participants}/{plan.max_slots} participants
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
