import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetch_plans } from "../../utils/travel_plan/fetch_plans";

function Upcoming_Plans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState();

  useEffect(() => {
    const load_plans = async () => {
      const data = await fetch_plans();
      setPlans(data);
    };

    load_plans();
  }, []);

  const handle_click = (key) => {
    navigate(`/planner/start/${key}`);
  };

  return (
    <>
      <h3>your on upcoming_plans</h3>
      <div className="plans_container">
        {!plans && <p>loading...</p>}

        {plans &&
          plans.map((plan) => {
            return (
              <div
                key={plan.travel_plan_id}
                className="plans"
                onClick={() => handle_click(plan.travel_plan_id)}
              >
                <h1>{plan.travel_plan_id}</h1>
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

export default Upcoming_Plans;
