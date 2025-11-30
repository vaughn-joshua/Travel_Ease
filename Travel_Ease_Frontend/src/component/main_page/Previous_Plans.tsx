import { useState, useEffect } from "react";
import { fetch_previous_plans } from "../../utils/travel_plan/fetch_previous_plans";
import type { TravelPlan } from "../../types/travelPlan";

export default function Previous_Plans(): React.ReactElement {
  const [plans, setPlans] = useState<TravelPlan[]>([]);

  useEffect(() => {
    const load_plans = async (): Promise<void> => {
      try {
        const data = await fetch_previous_plans();
        setPlans(data);
      } catch (e) {
        console.error("Error fetching previous plans:", e);
      }
    };
    load_plans();
  }, []);

  // Get the plan ID - backend returns travel_plan_id, frontend type has id
  const getPlanId = (plan: TravelPlan): number => plan.travel_plan_id ?? plan.id;
  // Get the plan title - backend returns name, frontend type has title
  const getPlanTitle = (plan: TravelPlan): string => plan.name ?? plan.title;

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">Previous Plans</h3>
      <div className="grid grid-cols-1 gap-4">
        {plans.length === 0 && <p>No previous plans</p>}
        {plans.map((plan) => (
          <div key={getPlanId(plan)} className="card">
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

