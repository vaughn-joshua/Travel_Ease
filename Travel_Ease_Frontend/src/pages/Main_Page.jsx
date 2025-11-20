import { useState } from "react";
import Create_Plan from "../component/main_page/Create_Plan.jsx";
import Upcoming_Plans from "../component/main_page/Upcoming_Plans.jsx";
import Ongoing_Plans from "../component/main_page/Ongoing_Plans.jsx";
import Previous_Plans from "../component/main_page/Previous_Plans.jsx";
import Public_Plans from "../component/main_page/Public_Plans.jsx";
import Quick_Join from "../component/main_page/Quick_Join";
import Plan_Modal from "../component/main_page/Plan_Modal.jsx";

function Main_Page() {
  // Tracks which modal is currently open. { "", "create", "join", "quick"  }
  const [activeModal, setActiveModal] = useState("");

  // Stores results returned from Quick Join
  const [results, setResults] = useState([]);

  // Closes modal & refreshes page (used after creating a plan)
  const handle_close = () => {
    window.location.reload(); // Reload also re-fetches updated plans
    console.log("closing na");
    setActiveModal("");
  };

  return (
    <div className="bg-gray-50 w-full h-full p-5">
      <div className="flex gap-6">
        {/* ============================
            LEFT COLUMN (Ongoing + Upcoming)
           ============================ */}
        <div className="flex-3">
          <div id="ongoing_plans">
            {/* Section Header & Create Plan Button */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-gray-900">
                Ongoing Plans
              </h3>

              {/* Opens the Create Plan modal */}
              <button
                onClick={() => setActiveModal("create")}
                className="hard_btn"
              >
                + Create Plan
              </button>
            </div>

            {/* Displays all ongoing plans */}
            <Ongoing_Plans />
          </div>

          {/* Upcoming plans section */}
          <div className="mt-6">
            <Upcoming_Plans />
          </div>
        </div>

        {/* ============================
            RIGHT COLUMN (Suggested + Previous)
           ============================ */}
        <div className="flex-1">
          <div className="">
            {/* Section Header & Quick Join Button*/}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-gray-900">
                Suggested Plans
              </h3>

              {/* Opens Quick Join modal */}
              <button
                onClick={() => setActiveModal("join")}
                className="hard_btn"
              >
                Quick Join
              </button>
            </div>

            {/* Publicly available plans */}
            <Public_Plans />
          </div>

          {/* Previous plans section */}
          <div className="mt-6">
            <Previous_Plans />
          </div>
        </div>
      </div>

      {/* ============================
          MODAL: Quick Join
          Returns results which lead to Plan_Modal
         ============================ */}
      {activeModal === "join" && (
        <Quick_Join
          on_close={(result) => {
            // Once Quick Join is done, move to next modal (Plan_Modal)
            setActiveModal("quick");

            // Only show Plan_Modal if results exist
            if (result.length > 0) {
              setResults(result);
            } else {
              // If no results, simply close modals
              setActiveModal("");
            }
          }}
        />
      )}

      {/* ============================
          MODAL: Create Plan
         ============================ */}
      {activeModal === "create" && <Create_Plan on_close={handle_close} />}

      {/* ============================
          MODAL: Plan Details for Quick Join Results
         ============================ */}
      {activeModal === "quick" && (
        <Plan_Modal results={results} on_close={() => setActiveModal("")} />
      )}
    </div>
  );
}

export default Main_Page;
