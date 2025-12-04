import { useNavigate } from "react-router-dom";
import { usePublicPlans } from "../../features/travelPlans/queries";

export default function PublicPlans(): React.ReactElement {
  const navigate = useNavigate();

  // Use TanStack Query hook for fetching public plans
  const { data: plans = [], isLoading, isError } = usePublicPlans();

  const handle_click = (id: number): void => {
    navigate(`/planner/join/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500">Failed to load public plans</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {plans.length === 0 && <p>No public plans available</p>}
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handle_click(plan.id)}
        >
          <h3 className="font-semibold">{plan.title}</h3>
          <p className="text-sm text-gray-600">{plan.location}</p>
          <p className="text-sm text-gray-500">
            {plan.start_date} - {plan.end_date}
          </p>
          {plan.slots && (
            <p className="text-sm text-gray-500">
              {plan.approvedParticipants || 0}/{plan.slots} slots
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
