import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetch_previous_plans } from "../../utils/travel_plan/fetch_previous_plans";
import type { TravelPlan } from "../../types/travelPlan";

export default function Previous_Plans(): React.ReactElement {
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem("token"));

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    
    if (!token) {
      return;
    }

    const load_plans = async (): Promise<void> => {
      const data = await fetch_previous_plans();
      setPlans(data);
      // Check if token was cleared due to auth error
      if (!localStorage.getItem("token")) {
        setIsAuthenticated(false);
      }
    };
    load_plans();
  }, []);

  if (!isAuthenticated) {
    return (
      <div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Previous Plans</h3>
        <div className="text-center py-4 text-gray-500">
          <p><Link to="/login" className="text-blue-600 hover:underline">Sign in</Link> to view your previous plans</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">Previous Plans</h3>
      <div className="grid grid-cols-1 gap-4">
        {plans.length === 0 && <p className="text-gray-500">No previous plans</p>}
        {plans.map((plan) => (
          <div key={plan.id} className="card">
            <h3 className="font-semibold">{plan.title}</h3>
            <p className="text-sm text-gray-600">{plan.location}</p>
            <p className="text-sm text-gray-500">
              {plan.start_date} - {plan.end_date}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

