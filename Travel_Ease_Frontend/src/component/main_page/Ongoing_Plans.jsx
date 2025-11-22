import { useState } from "react";
import { useEffect } from "react";
import { fetch_ongoing_plans } from "../../utils/travel_plan/fetch_ongoing_plans";
import { useNavigate } from "react-router-dom";

function Ongoing_Plans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState();

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

  const handle_selected = (data) => {
    setSelected(data);
  };

  const handle_back = () => {
    setSelected(null);
  };

  return (
    <div className="space-y-4">
      {!plans && (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500 italic">Loading...</p>
        </div>
      )}

      {!selected &&
        plans.map((plan, index) => (
          <div
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-gray-100 overflow-hidden"
            key={index}
            onClick={() => handle_selected(plan)}
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3 gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#E10600] transition-colors flex-1">
                  {plan.name}
                </h2>
                <span className="px-2 py-1 bg-[#E10600] text-white text-xs font-semibold rounded-full uppercase tracking-wide whitespace-nowrap flex-shrink-0">
                  Ongoing
                </span>
              </div>
              {plan.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {plan.description}
                </p>
              )}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-[#E10600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{plan.start_date} – {plan.end_date}</span>
                </div>
                {plan.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-[#E10600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{plan.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

      {selected && (
        <>
          <div
            key={selected.travel_plan_id}
            onClick={() => handle_click(selected.travel_plan_id)}
            className="p-4 sm:p-6 bg-white rounded-xl shadow-lg border-2 border-[#E10600] cursor-pointer transition-all hover:shadow-xl"
          >
            <div className="flex items-start justify-between mb-4 gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex-1">
                {selected.name}
              </h2>
              <span className="px-2 sm:px-3 py-1 bg-[#E10600] text-white text-xs font-semibold rounded-full uppercase tracking-wide whitespace-nowrap flex-shrink-0">
                Active
              </span>
            </div>
            {selected.description && (
              <p className="text-gray-600 text-sm mb-4">{selected.description}</p>
            )}
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-[#E10600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{selected.start_date} – {selected.end_date}</span>
              </div>
              {selected.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-[#E10600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{selected.location}</span>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-[#E10600] font-semibold uppercase tracking-wide">Click to view details →</p>
            </div>
          </div>

          <button 
            onClick={handle_back} 
            className="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            ← Back to Plans
          </button>
        </>
      )}
    </div>
  );
}

export default Ongoing_Plans;
