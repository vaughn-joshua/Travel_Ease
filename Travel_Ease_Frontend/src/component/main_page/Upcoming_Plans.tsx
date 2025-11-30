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

  // Get the plan ID - backend returns travel_plan_id, frontend type has id
  const getPlanId = (plan: TravelPlan): number => plan.travel_plan_id ?? plan.id;
  // Get the plan title - backend returns name, frontend type has title
  const getPlanTitle = (plan: TravelPlan): string => plan.name ?? plan.title;

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">Upcoming Plans</h3>
      <div className="grid grid-cols-3 gap-4">
        {plans.length === 0 && <p>No upcoming plans</p>}
        {plans.map((plan) => (
          <div
            key={getPlanId(plan)}
            className="card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handle_click(getPlanId(plan))}
          >
            <h3 className="font-semibold">{getPlanTitle(plan)}</h3>
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

