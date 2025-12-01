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

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">Previous Plans</h3>
      <div className="grid grid-cols-1 gap-4">
        {plans.length === 0 && <p>No previous plans</p>}
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

