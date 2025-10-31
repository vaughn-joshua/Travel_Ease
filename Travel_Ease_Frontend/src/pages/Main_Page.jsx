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
    <>
      <div className="container">
        <div className="main_left_side">
          <div className="ongoing_plans">
            <div className="ongoing_title">
              <h3>ongoing plan</h3>
              <button onClick={() => setActiveModal("create")}>
                create plan
              </button>
            </div>
            <Ongoing_Plans />
          </div>
          <div className="upcoming_plans">
            <Upcoming_Plans />
          </div>
        </div>
        <div className="main_right_side">
          <div className="public_plans">
            <div className="public_plan_title">
              <h3>Suggested Plans</h3>
              <button onClick={() => setActiveModal("join")}>Quick Join</button>
            </div>
            <Public_Plans />
          </div>
          <div className="previous_plans">
            <Previous_Plans />
          </div>
        </div>
      </div>

      {activeModal === "join" && (
        <Quick_Join
          on_close={(result) => {
            setActiveModal("quick");
            if (result) {
              console.log(result);
              setResults(result);
            }
          }}
        />
      )}
      {activeModal === "create" && (
        <Create_Plan on_close={() => setActiveModal("")} />
      )}
      {activeModal === "quick" && <Plan_Modal results={results} />}
    </>
  );
}

export default Main_Page;
