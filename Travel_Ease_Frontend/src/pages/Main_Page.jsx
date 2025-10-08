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
      <div className="public_plans">
        <Public_Plans />
      </div>
      <div className="ongoing_plans">
        <Ongoing_Plans />
      </div>
      <div className="upcoming_plans">
        <Upcoming_Plans />
      </div>
      <div className="previous_plans">
        <Previous_Plans />
      </div>
      <button onClick={handle_click}>create plan</button>
      {clicked && <Create_Plan on_close={handle_close} />}
    </>
  );
}

export default Main_Page;
