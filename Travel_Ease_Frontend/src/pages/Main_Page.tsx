import { useState } from "react";
import Create_Plan from "../component/main_page/Create_Plan";
import Upcoming_Plans from "../component/main_page/Upcoming_Plans";
import Ongoing_Plans from "../component/main_page/Ongoing_Plans";
import Previous_Plans from "../component/main_page/Previous_Plans";
import Public_Plans from "../component/main_page/Public_Plans";
import Quick_Join from "../component/main_page/Quick_Join";
import Plan_Modal from "../component/main_page/Plan_Modal";
import type { TravelPlan } from "../types/travelPlan";

type ModalType = "" | "create" | "join" | "quick";

export default function Main_Page(): React.ReactElement {
  // Tracks which modal is currently open
  const [activeModal, setActiveModal] = useState<ModalType>("");

  // Stores results returned from Quick Join
  const [results, setResults] = useState<TravelPlan[]>([]);

  // Closes modal & refreshes page (used after creating a plan)
  const handle_close = (): void => {
    window.location.reload();
    console.log("closing na");
    setActiveModal("");
  };

  return (
    <div className="bg-gray-50 w-full h-full p-5">
      <div className="flex gap-6">
        {/* LEFT COLUMN (Ongoing + Upcoming) */}
        <div className="flex-3">
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
            <Ongoing_Plans />
          </div>

          <div className="mt-6">
            <Upcoming_Plans />
          </div>
        </div>

        {/* RIGHT COLUMN (Suggested + Previous) */}
        <div className="flex-1">
          <div className="">
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
            <Public_Plans />
          </div>

          <div className="mt-6">
            <Previous_Plans />
          </div>
        </div>
      </div>

      {/* MODAL: Quick Join */}
      {activeModal === "join" && (
        <Quick_Join
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
      {activeModal === "create" && <Create_Plan on_close={handle_close} />}

      {/* MODAL: Plan Details for Quick Join Results */}
      {activeModal === "quick" && (
        <Plan_Modal results={results} on_close={() => setActiveModal("")} />
      )}
    </div>
  );
}

