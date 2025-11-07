import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Plan_Modal({ results, on_close }) {
  const navigate = useNavigate();

  useEffect(() => {
    console.log(results);
  }, [results]);

  const handle_click = (key) => {
    navigate(`/planner/join/${key}`);
  };

  const handle_close = () => {
    on_close();
  };

  return (
    <div className="modal ">
      <div className="modal_body max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <h1 className="text-xl font-semibold text-red-600 text-center mb-4">
          Matching Travel Plans
        </h1>

        {results.length === 0 ? (
          <p className="text-gray-500 text-center">No matching plans found.</p>
        ) : (
          <div className="space-y-3">
            {results.map((res) => (
              <div
                key={res.travel_plan_id}
                onClick={() => handle_click(res.travel_plan_id)}
                className="card cursor-pointer hover:shadow-lg hover:bg-red-50 transition-all duration-200"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                  {res.name}
                </h2>
                <p className="text-sm text-gray-600">
                  📍 <span className="font-medium">{res.location}</span>
                </p>
                <p className="text-sm text-gray-600">
                  📅 {res.start_date} → {res.end_date}
                </p>
                <p className="text-sm text-gray-600">
                  👥 Slots: <span className="font-medium">{res.max_slots}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button className="soft_btn" onClick={handle_close}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default Plan_Modal;
