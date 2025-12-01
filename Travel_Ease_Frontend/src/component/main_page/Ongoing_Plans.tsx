import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetch_ongoing_plans } from "../../utils/travel_plan/fetch_ongoing_plans";
import type { TravelPlan } from "../../types/travelPlan";

export default function Ongoing_Plans(): React.ReactElement {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem("token"));

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    
    if (!token) {
      return;
    }

    const load_plans = async (): Promise<void> => {
      const data = await fetch_ongoing_plans();
      setPlans(data);
      // Check if token was cleared due to auth error
      if (!localStorage.getItem("token")) {
        setIsAuthenticated(false);
      }
    };
    load_plans();
  }, []);

  const handle_click = (id: number): void => {
    navigate(`/planner/view/${id}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p><Link to="/login" className="text-blue-600 hover:underline">Sign in</Link> to view your ongoing plans</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {plans.length === 0 && <p className="text-gray-500">No ongoing plans</p>}
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handle_click(plan.id)}
        >
          <h3 className="font-semibold">{plan.title}</h3>
          <p className="text-sm text-gray-600">{plan.location}</p>
          <p className="text-sm text-gray-500">
            {plan.start_date} - {plan.end_date}
          </p>
        </div>
      ))}
    </div>
  );
}

