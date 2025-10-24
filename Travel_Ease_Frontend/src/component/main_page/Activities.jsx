import { useState } from "react";
import { useEffect } from "react";
import { fetch_activities } from "../../utils/travel_plan/fetch_activities";
import Edit_Activity from "./Edit_Activity";

function Activities({
  reference_id,
  load_state,
  start_date,
  end_date,
  day_selected,
}) {
  const [plans, setPlans] = useState();
  const [clicked, setClicked] = useState(false);
  const [data, setData] = useState();

  useEffect(() => {
    const load_plans = async () => {
      const data = await fetch_activities(reference_id);
      const starting_date = new Date(start_date);
      let current_day;

      if (day_selected == 1) {
        current_day = starting_date;
      } else {
        const selected_day_ms = 1000 * 60 * 60 * 24 * (day_selected - 1);
        current_day = new Date(starting_date.getTime() + selected_day_ms);
      }

      const filtered_data = data.filter((item) => {
        const activity_date = new Date(item.target_date);
        return activity_date.toDateString() === current_day.toDateString();
      });

      setPlans(filtered_data);
    };

    load_plans();
  }, [load_state]);

  const handle_click = (data) => {
    setClicked((prev) => !prev);
    if (data) {
      setData(data);
    }
  };

  return (
    <>
      <div className="activity_container">
        {!plans && <p>loading...</p>}

        {plans &&
          plans.map((plan, index) => {
            return (
              <div key={index} className="activity">
                <h1>{plan.name}</h1>
                <p>{plan.address}</p>
                {/* <p>{plan.category}</p> */}
                <p>{plan.notes}</p>
                <p>{plan.target_date}</p>
                <p>{plan.budget_range}</p>

                <button
                  onClick={() => {
                    handle_click(plan);
                  }}
                >
                  edit
                </button>
              </div>
            );
          })}
      </div>

      {clicked && (
        <Edit_Activity
          on_close={handle_click}
          data={data}
          start_date={start_date}
          end_date={end_date}
        />
      )}
    </>
  );
}

export default Activities;
