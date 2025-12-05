import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import CreatePlan from "../components/dashboard/CreatePlan";
import UpcomingPlans from "../components/dashboard/UpcomingPlans";
import OngoingPlans from "../components/dashboard/OngoingPlans";
import PreviousPlans from "../components/dashboard/PreviousPlans";
import PublicPlans from "../components/dashboard/PublicPlans";
import QuickJoin from "../components/dashboard/QuickJoin";
import PlanModal from "../components/dashboard/PlanModal";
import type { TravelPlan } from "../types/travelPlan";
import { travelPlanKeys } from "../lib/queryKeys";

type ModalType = "" | "create" | "join" | "quick";

export default function MainPage(): React.ReactElement {
  const queryClient = useQueryClient();
  
  // Tracks which modal is currently open
  const [activeModal, setActiveModal] = useState<ModalType>("");

  // Stores results returned from Quick Join
  const [results, setResults] = useState<TravelPlan[]>([]);

  // Closes modal - no reload needed, TanStack Query handles cache invalidation
  const handle_close = (): void => {
    // Invalidate plan queries to refetch fresh data
    queryClient.invalidateQueries({ queryKey: travelPlanKeys.all });
    setActiveModal("");
  };

  return (
    <div className="bg-gray-50 w-full min-h-screen p-5">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN (Ongoing + Upcoming) */}
        <div className="flex-[3] min-w-0">
          <div id="ongoing_plans">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-gray-900">
                Ongoing Plans
              </h3>
              <button
                onClick={() => setActiveModal("create")}
                className="hard_btn"
              >
                + Create Plan
              </button>
            </div>
            <OngoingPlans />
          </div>

          <div className="mt-6">
            <UpcomingPlans />
          </div>
        </div>

        {/* RIGHT COLUMN (Suggested + Previous) */}
        <div className="flex-1 min-w-0">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-gray-900">
                Suggested Plans
              </h3>
              <button
                onClick={() => setActiveModal("join")}
                className="hard_btn"
              >
                Quick Join
              </button>
            </div>
            <PublicPlans />
          </div>

          <div className="mt-6">
            <PreviousPlans />
          </div>
        </div>
      </div>

      {/* MODAL: Quick Join */}
      {activeModal === "join" && (
        <QuickJoin
          on_close={(result: TravelPlan[]) => {
            setActiveModal("quick");
            if (result.length > 0) {
              setResults(result);
            } else {
              setActiveModal("");
            }
          }}
        />
      )}

      {/* MODAL: Create Plan */}
      {activeModal === "create" && <CreatePlan on_close={handle_close} />}

      {/* MODAL: Plan Details for Quick Join Results */}
      {activeModal === "quick" && (
        <PlanModal results={results} on_close={() => setActiveModal("")} />
      )}
    </div>
  );
}
