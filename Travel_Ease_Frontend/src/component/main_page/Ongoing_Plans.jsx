import { useState } from "react";
import { useEffect } from "react";
import { fetch_ongoing_plans } from "../../utils/travel_plan/fetch_ongoing_plans";
import { useNavigate } from "react-router-dom";

function Ongoing_Plans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState();

  useEffect(() => {
    const load_plans = async () => {
      const data = await fetch_ongoing_plans();
      setPlans(data);
    };

    load_plans();
  }, []);

  const handle_click = (key) => {
    navigate(`/planner/view/${key}`);
  };

  return (
    <div className="space-y-3">
      {!plans && <p className="text-gray-500 italic">Loading...</p>}

      {plans &&
        plans.map((plan) => (
          <div
            key={plan.travel_plan_id}
            onClick={() => handle_click(plan.travel_plan_id)}
            className="p-4 bg-white shadow-sm rounded-xl hover:shadow-md transition cursor-pointer"
          >
            <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
            <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
            <p className="text-sm text-gray-500 mt-2">
              {plan.start_date} – {plan.end_date}
            </p>
            <p className="text-sm text-gray-500">{plan.location}</p>
          </div>
        ))}
    </div>
  );
}

export default Ongoing_Plans;
