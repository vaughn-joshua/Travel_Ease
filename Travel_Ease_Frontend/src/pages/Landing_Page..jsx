import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Register from "../component/business/Register";

function Landing_Page() {
  const [register, setRegister] = useState(false);

  // const navigate = useNavigate();

  const handle_click = () => {
    // navigate("/business");
    setRegister(true);
  };

  const handle_close = () => {
    setRegister(false);
  };

  return (
    <>
      <button onClick={handle_click} className="hard_btn">
        Click here to open business account
      </button>
      {register && <Register on_close={handle_close} />}
    </>
  );
}

export default Landing_Page;
