import { useState } from "react";
import { useEffect } from "react";
import { fetch_previous_plans } from "../../utils/travel_plan/fetch_previous_plans";
import { useNavigate } from "react-router-dom";

function Previous_Plans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState();

  useEffect(() => {
    const load_plans = async () => {
      const data = await fetch_previous_plans();
      setPlans(data);
    };

    load_plans();
  }, []);

  const handle_click = (key) => {
    navigate(`/planner/start/${key}`);
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
    <>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">
        Your Previous Plans
      </h3>
      <div className="h-[50vh] overflow-y-auto space-y-3 m-4">
        {!plans && <p className="text-gray-500 italic">Loading...</p>}

        {plans &&
          plans.map((plan) => (
            <div
              key={plan.travel_plan_id}
              onClick={() => handle_click(plan.travel_plan_id)}
              className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-gray-800">{plan.name}</h2>
                <span className="text-sm text-gray-500">{plan.location}</span>
              </div>
              <p className="text-gray-600 mt-1">{plan.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                {formatDate(plan.start_date)} – {formatDate(plan.end_date)}
              </p>
            </div>
          ))}
      </div>
    </>
  );
}

export default Previous_Plans;
