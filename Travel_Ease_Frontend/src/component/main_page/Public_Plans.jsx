import { useState } from "react";
import { useEffect } from "react";
import { fetch_public_plans } from "../../utils/travel_plan/fetch_public_plans";
import { useNavigate } from "react-router-dom";

function Public_Plans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState();

  useEffect(() => {
    const load_plans = async () => {
      const data = await fetch_public_plans();
      setPlans(data);
    };

    load_plans();
  }, []);

  const handle_click = (key) => {
    navigate(`/planner/join/${key}`);
  };

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div className="h-[40vh] overflow-y-auto space-y-2">
      {!plans && <p className="text-gray-500 italic">Loading...</p>}

      {plans &&
        plans.map((plan) => (
          <div
            key={plan.travel_plan_id}
            onClick={() => handle_click(plan.travel_plan_id)}
            className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition cursor-pointer"
          >
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {plan.name}
              </h2>
              <p className="text-sm text-gray-500">Slots: {plan.max_slots}</p>
            </div>
            <p className="text-sm text-gray-500">
              {formatDate(plan.start_date)} – {formatDate(plan.end_date)}
            </p>
            <p className="text-gray-600 mt-1">{plan.location}</p>
          </div>
        ))}
    </div>
  );
}

export default Public_Plans;
