import { useState } from "react";
import Create_Plan from "../component/main_page/Create_Plan.jsx";
import Upcoming_Plans from "../component/main_page/Upcoming_Plans.jsx";
import Ongoing_Plans from "../component/main_page/Ongoing_Plans.jsx";
import Previous_Plans from "../component/main_page/Previous_Plans.jsx";
import Public_Plans from "../component/main_page/Public_Plans.jsx";

function Main_Page() {
  const [clicked, setClicked] = useState(false);

  const handle_click = () => {
    setClicked(true);
  };

  const handle_close = () => {
    setClicked(false);
  };

  return (
    <>
      <div className="container">
        <div className="main_left_side">
          <div className="ongoing_plans">
            <div className="ongoing_title">
              <h3>ongoing plan</h3>
              <button onClick={handle_click}>create plan</button>
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
              <button>Quick Join</button>
            </div>
            <Public_Plans />
          </div>
          <div className="previous_plans">
            <Previous_Plans />
          </div>
        </div>
      </div>

      {clicked && <Create_Plan on_close={handle_close} />}
    </>
  );
}

export default Main_Page;
