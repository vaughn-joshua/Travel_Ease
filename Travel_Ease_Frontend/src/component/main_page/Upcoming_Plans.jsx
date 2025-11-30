import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetch_plans } from "../../utils/travel_plan/fetch_plans";

function Upcoming_Plans() {
  const navigate = useNavigate();

  // State to store user’s upcoming plans
  const [plans, setPlans] = useState();

  // Load plans on component mount
  useEffect(() => {
    const load_plans = async () => {
      const data = await fetch_plans();
      setPlans(data);
    };

    load_plans();
  }, []);

  // Navigate to plan details
  const handle_click = (key) => {
    navigate(`/planner/start/${key}`);
  };

  // Format date into readable format
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
      <h3 className="text-2xl font-semibold text-gray-900 mb-2">
        Your Upcoming Plans
      </h3>

      <div className="flex flex-wrap gap-4">
        {/* Show loading text while fetching plans */}
        {!plans && <p className="text-gray-500 italic">Loading...</p>}

        {plans &&
          // Only show plans **NOT** having status "join" or "planner"
          plans
            .filter(
              (plan) => plan.status !== "join" && plan.status !== "planner"
            )
            .map((plan) => (
              <div
                key={plan.travel_plan_id}
                onClick={() => handle_click(plan.travel_plan_id)}
                className="min-w-sm min-h-40 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <div className="flex justify-between items-center mb-1">
                  <h2 className="font-semibold text-gray-900">{plan.name}</h2>
                  <p className="text-sm text-gray-500">{plan.location}</p>
                </div>

                <p className="text-gray-600 text-sm">{plan.description}</p>

                <p className="text-sm text-gray-500 mt-2">
                  {formatDate(plan.start_date)} – {formatDate(plan.end_date)}
                </p>
              </div>
            ))}
      </div>
    </>
  );
}

export default Upcoming_Plans;
