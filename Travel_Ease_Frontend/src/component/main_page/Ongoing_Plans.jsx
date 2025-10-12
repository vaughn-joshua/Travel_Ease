import { useState } from "react";
import { useEffect } from "react";
import { fetch_ongoing_plans } from "../../utils/travel_plan/fetch_ongoing_plans";

function Ongoing_Plans() {
  const [plans, setPlans] = useState();
  useEffect(() => {
    const load_plans = async () => {
      const data = await fetch_ongoing_plans();
      setPlans(data);
    };

    load_plans();
  }, []);

  return (
    <>
      <div className="plans_container">
        {!plans && <p>loading...</p>}

        {plans &&
          plans.map((plan, index) => {
            return (
              <div key={index} className="plans">
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
