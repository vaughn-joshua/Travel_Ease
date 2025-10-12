import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetch_plan_id } from "../utils/travel_plan/fetch_plan_id";
import Create_Activity from "../component/main_page/Create_Activity";
import { fetch_businesses } from "../utils/travel_plan/fetch_businesses";

function Planner() {
  const { id } = useParams();
  const [plan, setPlan] = useState();
  const [businesses, setBusinesses] = useState();
  const [activity, setActivity] = useState(false);

  useEffect(() => {
    const load_data = async () => {
      try {
        const business_data = await fetch_businesses();
        const plan_data = await fetch_plan_id(id);
        setPlan(plan_data);
        setBusinesses(business_data);
      } catch (e) {
        console.log({ e });
      }
    };

    load_data();
  }, [id]);

  const handle_click = () => {
    setActivity(true);
  };

  if (!plan) {
    return <p>loading...</p>;
  }

  return (
    <>
      <div className="planner_top">
        <div className="map_containers"></div>
        <div className="activity_container">
          <h1>activities</h1>
          <button onClick={handle_click}>Add Activity</button>
        </div>
      </div>
      <div className="plan_detail_container">
        <h1>{plan[0].name}</h1>
        <p>{plan[0].description}</p>
        <p>{plan[0].location}</p>
        <p>{plan[0].start_date}</p>
        <p>{plan[0].end_date}</p>
        <p>{plan[0].max_slots}</p>
      </div>

      {activity && <Create_Activity id={id} business={businesses} />}
    </>
  );
}

export default Planner;
