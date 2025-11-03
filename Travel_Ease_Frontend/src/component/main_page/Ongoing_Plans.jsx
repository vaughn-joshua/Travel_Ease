import { useState } from "react";
import { useEffect } from "react";
import { fetch_ongoing_plans } from "../../utils/travel_plan/fetch_ongoing_plans";
import { useNavigate } from "react-router-dom";

function Ongoing_Plans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState();

  useEffect(() => {
    const load_plans = async () => {
      const data = await fetch_ongoing_plans();
      setPlans(data);
    };

    load_plans();
  }, []);

  const handle_click = (key) => {
    navigate(`/planner/view/${key}`);
  };

  return (
    <>
      <div className="plans_container">
        {!plans && <p>loading...</p>}

        {plans &&
          plans.map((plan, index) => {
            return (
              <div
                key={index}
                className="plans bg-white rounded drop-shadow"
                onClick={() => handle_click(plan.travel_plan_id)}
              >
                <h1>{plan.name}</h1>
                <p>{plan.description}</p>
                <p>{plan.start_date}</p>
                <p>{plan.end_date}</p>
                <p>{plan.location}</p>
              </div>
            );
          })}
      </div>
    </>
  );
}

export default Ongoing_Plans;
