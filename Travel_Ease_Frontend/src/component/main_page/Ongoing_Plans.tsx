import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetch_ongoing_plans } from "../../utils/travel_plan/fetch_ongoing_plans";
import type { TravelPlan } from "../../types/travelPlan";

export default function Ongoing_Plans(): React.ReactElement {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<TravelPlan[]>([]);

  useEffect(() => {
    const load_plans = async (): Promise<void> => {
      try {
        const data = await fetch_ongoing_plans();
        setPlans(data);
      } catch (e) {
        console.error("Error fetching ongoing plans:", e);
      }
    };
    load_plans();
  }, []);

  const handle_click = (id: number): void => {
    navigate(`/planner/view/${id}`);
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {plans.length === 0 && <p>No ongoing plans</p>}
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

