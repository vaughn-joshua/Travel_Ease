import { useState } from "react";
import { useEffect } from "react";
import { fetch_public_plans } from "../../utils/travel_plan/fetch_public_plans";
import { useNavigate } from "react-router-dom";

function Public_Plans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState();
  const [postedAt, setPostedAt] = useState([]);

  useEffect(() => {
    const load_plans = async () => {
      const data = await fetch_public_plans();
      setPlans(data);

      data.map((plan, index) => {
        // get current time
        const current_date = new Date();

        const timestamp = new Date(plan.visibility_timestamp);

        // compute for time difference relative to the current time
        const time_difference = Math.round(
          (current_date - timestamp) / 1000 / 60
        );

        //set the postedAt
        setPostedAt((prev) => [...prev, time_difference]);
      });
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
    <div className="h-[40vh] overflow-y-auto space-y-3 pr-1 sm:pr-2">
      {!plans && (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500 italic text-sm">Loading...</p>
        </div>
      )}

      {plans &&
        plans.map((plan, index) => (
          <div
            key={plan.travel_plan_id}
            onClick={() => handle_click(plan.travel_plan_id)}
            className="group p-4 sm:p-5 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-gray-100"
          >
            <div className="flex justify-between items-start mb-3 gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#E10600] transition-colors flex-1 pr-2">
                {plan.name}
              </h2>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="px-2 sm:px-3 py-1 bg-[#E10600] text-white text-xs font-bold rounded-full whitespace-nowrap">
                  {plan.max_slots} Slots
                </span>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {postedAt[index] !== undefined ? `${postedAt[index]} min ago` : 'Just now'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <svg className="w-4 h-4 text-[#E10600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(plan.start_date)} – {formatDate(plan.end_date)}</span>
            </div>
            {plan.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-[#E10600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">{plan.location}</span>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-[#E10600] font-semibold uppercase tracking-wide">Click to join →</p>
            </div>
          </div>
        ))}
    </div>
  );
}

export default Public_Plans;
