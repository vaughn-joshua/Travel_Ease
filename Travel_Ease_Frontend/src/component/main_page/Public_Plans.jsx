import { useState } from "react";
import { useEffect } from "react";
import { fetch_public_plans } from "../../utils/travel_plan/fetch_public_plans";

function Public_Plans() {
  const [plans, setPlans] = useState();
  useEffect(() => {
    const load_plans = async () => {
      const data = await fetch_public_plans();
      setPlans(data);
    };

    load_plans();
  }, []);

  return (
    <>
      <h3>Suggested Plans</h3>
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

export default Public_Plans;
