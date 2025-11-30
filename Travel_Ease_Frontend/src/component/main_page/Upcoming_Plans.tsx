import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetch_plans } from "../../utils/travel_plan/fetch_plans";
import type { TravelPlan } from "../../types/travelPlan";

export default function Upcoming_Plans(): React.ReactElement {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<TravelPlan[]>([]);

  useEffect(() => {
    const load_plans = async (): Promise<void> => {
      try {
        const data = await fetch_plans();
        setPlans(data);
      } catch (e) {
        console.error("Error fetching plans:", e);
      }
    };
    load_plans();
  }, []);

  const handle_click = (id: number): void => {
    navigate(`/planner/start/${id}`);
  };

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">Upcoming Plans</h3>
      <div className="grid grid-cols-3 gap-4">
        {plans.length === 0 && <p>No upcoming plans</p>}
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
    </div>
  );
}

