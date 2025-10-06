import { useState } from "react";
import Create_Plan from "../component/main_page/Create_Plan.jsx";

function Main_Page() {
  const [clicked, setClicked] = useState(false);

  const handle_click = () => {
    setClicked(true);
  };

  return (
    <>
      <h1>your in main page</h1>
      <p>hi Vaughn</p>
      <button onClick={handle_click}>create plan</button>
      {clicked && <Create_Plan />}
    </>
  );
}

export default Main_Page;
