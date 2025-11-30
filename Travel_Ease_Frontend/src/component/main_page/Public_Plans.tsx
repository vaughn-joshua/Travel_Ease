import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetch_public_plans } from "../../utils/travel_plan/fetch_public_plans";
import type { TravelPlan } from "../../types/travelPlan";

export default function Public_Plans(): React.ReactElement {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<TravelPlan[]>([]);

  useEffect(() => {
    const load_plans = async (): Promise<void> => {
      try {
        const data = await fetch_public_plans();
        setPlans(data);
      } catch (e) {
        console.error("Error fetching public plans:", e);
      }
    };
    load_plans();
  }, []);

  const handle_click = (id: number): void => {
    navigate(`/planner/join/${id}`);
  };

  // Get ID from either id or travel_plan_id (backend returns travel_plan_id)
  const getPlanId = (plan: TravelPlan): number => plan.id || plan.travel_plan_id || 0;
  // Get title from either title or name (backend returns name)
  const getPlanTitle = (plan: TravelPlan): string => plan.title || (plan as any).name || 'Untitled';

  return (
    <div className="grid grid-cols-1 gap-4">
      {plans.length === 0 && <p>No public plans available</p>}
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
          {(plan.slots || (plan as any).max_slots) && (
            <p className="text-sm text-gray-500">
              {(plan as any).approvedParticipants || 0}/{plan.slots || (plan as any).max_slots} slots
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

