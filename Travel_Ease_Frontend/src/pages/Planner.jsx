import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetch_plan_id } from "../utils/travel_plan/fetch_plan_id";
import Create_Activity from "../component/main_page/Create_Activity";
import { fetch_businesses } from "../utils/travel_plan/fetch_businesses";
import Activities from "../component/main_page/Activities";
import Edit_Plan from "../component/main_page/Edit_Plan";

function Planner() {
  const { id, status } = useParams();

  const [plan, setPlan] = useState();
  const [days, setDays] = useState(0);
  const [start_date, setStart_date] = useState(0);
  const [end_date, setEnd_date] = useState(0);
  const [businesses, setBusinesses] = useState();
  const [clicked, setClicked] = useState(false);
  const [loadActivity, setLoadActivity] = useState(false);
  const [daySelected, setDaySelected] = useState(1);

  const [edit, setEdit] = useState(false);

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
  }, [id, clicked]);

  useEffect(() => {
    if (plan) {
      const start = new Date(plan[0].start_date);
      const end = new Date(plan[0].end_date);

      const months = end - start;

      const days = Math.ceil(months / (1000 * 60 * 60 * 24)) + 1;

      setDays(days);
      setStart_date(start.toISOString());
      setEnd_date(end.toISOString());
    }
  }, [plan]);

  const handle_click = () => {
    setClicked(true);
  };

  const handle_close = () => {
    setClicked(false);
  };

  const load_activity = () => {
    setClicked(false);
    setLoadActivity((prev) => !prev);
    setDaySelected(1);
  };

  const click_day = (i) => {
    setLoadActivity((prev) => !prev);
    setDaySelected(i);
  };

  const edit_plan = () => {
    setEdit((prev) => !prev);
  };

  if (!plan) {
    return <p>loading...</p>;
  }

  return (
    <>
      <div className="planner_top">
        <div className="map_containers"></div>
        <div className="activities">
          <div className="travel_plan_days">
            {Array.from({ length: days }, (_, i) => (
              <h4 key={i} onClick={() => click_day(i + 1)}>
                Day {i + 1}
              </h4>
            ))}
          </div>

          <button onClick={handle_click}>Add Activity</button>
          <div className="activities">
            {start_date && (
              <Activities
                reference_id={id}
                load_state={loadActivity}
                start_date={start_date}
                end_date={end_date}
                day_selected={daySelected}
              />
            )}
          </div>
        </div>
      </div>
      <div className="plan_detail_container">
        <h1>{plan[0].name}</h1>

        {status === "join" && <button>join now</button>}
        {status === "start" && <button>start now</button>}
        {status === "view" && <button onClick={edit_plan}>edit</button>}

        <p>{plan[0].description}</p>
        <p>{plan[0].location}</p>
        <p>{plan[0].start_date}</p>
        <p>{plan[0].end_date}</p>
        <p>{plan[0].max_slots}</p>
      </div>
      {clicked && (
        <Create_Activity
          id={id}
          business={businesses}
          on_close={handle_close}
          load_activities={load_activity}
        />
      )}
      {edit && <Edit_Plan data={plan} on_close={edit_plan} />}
    </>
  );
}

export default Planner;
