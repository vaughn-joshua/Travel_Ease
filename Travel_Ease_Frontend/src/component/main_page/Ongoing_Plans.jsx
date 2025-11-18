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
    <div className="space-y-3 ">
      {!plans && <p className="text-gray-500 italic">Loading...</p>}

      {!selected &&
        plans.map((plan, index) => (
          <div
            className="card"
            key={index}
            onClick={() => handle_selected(plan)}
          >
            <h2>{plan.name}</h2>
            <p>{plan.description}</p>
            <p>
              {plan.start_date} - {plan.end_date}
            </p>
            <p>{plan.location}</p>
          </div>
        ))}

      {selected && (
        <>
          <div
            key={selected.travel_plan_id}
            onClick={() => handle_click(selected.travel_plan_id)}
            className="p-4 bg-white shadow-sm rounded-xl hover:shadow-md transition cursor-pointer h-[40vh]"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {selected.name}
            </h2>
            <p className="text-gray-600 text-sm mt-1">{selected.description}</p>
            <p className="text-sm text-gray-500 mt-2">
              {selected.start_date} – {selected.end_date}
            </p>
            <p className="text-sm text-gray-500">{selected.location}</p>
          </div>

          <button onClick={handle_back} className="soft_btn">
            back
          </button>
        </>
      )}
    </div>
  );
}

export default Ongoing_Plans;
