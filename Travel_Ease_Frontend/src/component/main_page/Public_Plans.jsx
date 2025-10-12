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
      <div className="public_plans_container">
        {!plans && <p>loading...</p>}

        {plans &&
          plans.map((plan, index) => {
            return (
              <div key={index} className="public_plans">
                <h3>{plan.name}</h3>
                <p>{plan.max_slots}</p>
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
