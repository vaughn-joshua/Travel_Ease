import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetch_plan_id } from "../utils/travel_plan/fetch_plan_id";
import { fetch_businesses } from "../utils/travel_plan/fetch_businesses";
import Activities from "../component/main_page/Activities";
import Edit_Plan from "../component/main_page/Edit_Plan";
import Create_Activity from "../component/main_page/Create_Activity";

function Planner() {
  const { id, status } = useParams();

  const [plan, setPlan] = useState();
  const [days, setDays] = useState(0);
  const [businesses, setBusinesses] = useState();
  const [loadActivity, setLoadActivity] = useState(false);
  const [daySelected, setDaySelected] = useState(1);

  const [activeModal, setActiveModal] = useState("");

  const [dates, setDates] = useState({
    start: 0,
    end: 0,
  });

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
  }, [id, activeModal]);

  useEffect(() => {
    if (plan) {
      const start = new Date(plan[0].start_date);
      const end = new Date(plan[0].end_date);

      const months = end - start;

      const days = Math.ceil(months / (1000 * 60 * 60 * 24)) + 1;

      setDays(days);

      setDates({ start: start.toISOString(), end: end.toISOString() });
    }
  }, [plan]);

  const click_day = (i) => {
    setLoadActivity((prev) => !prev);
    setDaySelected(i);
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

          {status !== "join" && (
            <button onClick={() => setActiveModal("activity")}>
              Add Activity
            </button>
          )}

          <div className="activities">
            {dates.start && (
              <Activities
                status={status}
                reference_id={id}
                load_state={loadActivity}
                day_selected={daySelected}
                dates={dates}
              />
            )}
          </div>
        </div>
      </div>
      <div className="plan_detail_container">
        <h1>{plan[0].name}</h1>

        {status === "join" && <button>join now</button>}
        {status === "start" && <button>start now</button>}
        {status === "view" && (
          <button onClick={() => setActiveModal("plan")}>edit</button>
        )}

        <p>{plan[0].description}</p>
        <p>{plan[0].location}</p>
        <p>{plan[0].start_date}</p>
        <p>{plan[0].end_date}</p>
        <p>{plan[0].max_slots}</p>
      </div>

      {activeModal === "activity" && (
        <Create_Activity
          business={businesses}
          dates={dates}
          id={id}
          on_close={() => {
            setLoadActivity((prev) => !prev);
            setActiveModal("");
          }}
        />
      )}
      {activeModal === "plan" && (
        <Edit_Plan
          data={plan}
          travel_plan={id}
          on_close={() => setActiveModal("")}
        />
      )}
    </>
  );
}

export default Planner;
