import { useNavigate } from "react-router-dom";
import type { TravelPlan } from "../../types/travelPlan";

interface PlanModalProps {
  results: TravelPlan[];
  on_close: () => void;
}

export default function Plan_Modal({ results, on_close }: PlanModalProps): React.ReactElement {
  const navigate = useNavigate();

  const handle_join = (id: number): void => {
    navigate(`/planner/join/${id}`);
    on_close();
  };

  return (
    <div className="modal">
      <div className="modal_body">
        <h1 className="text-xl font-semibold text-red-600 text-center mb-4">
          Matching Plans
        </h1>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-center text-gray-500">No matching plans found</p>
          ) : (
            results.map((plan) => (
              <div
                key={plan.id}
                className="card cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handle_join(plan.id)}
              >
                <h3 className="font-semibold">{plan.title}</h3>
                <p className="text-sm text-gray-600">{plan.description}</p>
                <p className="text-sm text-gray-500">{plan.location}</p>
                <p className="text-sm text-gray-400">
                  {plan.start_date} - {plan.end_date}
                </p>
                {plan.slots && (
                  <p className="text-sm text-green-600">
                    {plan.collaborators || 0}/{plan.slots} participants
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button onClick={on_close} className="soft_btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

