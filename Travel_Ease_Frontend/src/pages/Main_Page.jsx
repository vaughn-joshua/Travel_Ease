import { useState } from "react";
import Create_Plan from "../component/main_page/Create_Plan.jsx";
import Upcoming_Plans from "../component/main_page/Upcoming_Plans.jsx";
import Ongoing_Plans from "../component/main_page/Ongoing_Plans.jsx";
import Previous_Plans from "../component/main_page/Previous_Plans.jsx";
import Public_Plans from "../component/main_page/Public_Plans.jsx";
import Quick_Join from "../component/main_page/Quick_Join";
import Plan_Modal from "../component/main_page/Plan_Modal.jsx";

function Main_Page() {
  const [activeModal, setActiveModal] = useState("");
  const [results, setResults] = useState([]);

  return (
    <div className="bg-gray-50 w-full h-full p-6">
      <div className="flex gap-6">
        {/* LEFT SIDE */}
        <div className="flex-3">
          <div id="ongoing_plans">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-gray-900">
                Ongoing Plans
              </h3>
              <button
                onClick={() => setActiveModal("create")}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                + Create Plan
              </button>
            </div>
            <Ongoing_Plans />
          </div>

          <div className="mt-10">
            <Upcoming_Plans />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex-1">
          <div className="m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-gray-900">
                Suggested Plans
              </h3>
              <button
                onClick={() => setActiveModal("join")}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Quick Join
              </button>
            </div>
            <Public_Plans />
          </div>

          <div className="mt-8">
            <Previous_Plans />
          </div>
        </div>
      </div>
      {activeModal === "join" && (
        <Quick_Join
          on_close={(result) => {
            setActiveModal("quick");
            if (result.length > 0) {
              console.log(result);
              setResults(result);
            } else {
              setActiveModal("");
            }
          }}
        />
      )}
      {activeModal === "create" && (
        <Create_Plan on_close={() => setActiveModal("")} />
      )}
      {activeModal === "quick" && <Plan_Modal results={results} />}
    </div>
  );
}

export default Main_Page;
