import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetch_plan_id } from "../utils/travel_plan/fetch_plan_id";

function Planner() {
  const { id } = useParams();
  const [plan, setPlan] = useState();

  useEffect(() => {
    const load_plan = async () => {
      const data = await fetch_plan_id(id);
      setPlan(data);
    };

    load_plan();
  }, []);

  if (!plan) {
    return <p>loading...</p>;
  }

  return (
    <>
      <h1>{plan[0].name}</h1>
      <p>{plan[0].description}</p>
      <p>{plan[0].location}</p>
      <p>{plan[0].start_date}</p>
      <p>{plan[0].end_date}</p>
      <p>{plan[0].max_slots}</p>
      <div className="activity_continaer">
        <h3>activities</h3>
      </div>
    </>
  );
}

export default Planner;
