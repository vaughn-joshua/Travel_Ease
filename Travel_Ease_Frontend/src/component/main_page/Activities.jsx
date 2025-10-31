import { useState } from "react";
import { useEffect } from "react";
import { fetch_activities } from "../../utils/travel_plan/fetch_activities";
import Edit_Activity from "./Edit_Activity";
import { delete_activity } from "../../utils/travel_plan/delete_activity";

function Activities({ reference_id, load_state, day_selected, dates, status }) {
  const [plans, setPlans] = useState();
  const [clicked, setClicked] = useState(false);
  const [data, setData] = useState();
  const [refresh, setRefresh] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [toDelete, setToDelete] = useState("");

  useEffect(() => {
    const load_plans = async () => {
      const data = await fetch_activities(reference_id);
      const starting_date = new Date(dates.start);
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
  }, [load_state, refresh]);

  useEffect(() => {
    if (confirmDelete === "confirmed") {
      delete_activity(toDelete);
      setRefresh((prev) => !prev);
    }
  }, [confirmDelete]);

  const handle_click = (data) => {
    setClicked(true);
    if (data) {
      setData(data);
    }
  };

  const handle_close = (data) => {
    setClicked(false);
    setRefresh((prev) => !prev);
  };

  const handle_delete = (plan) => {
    setConfirmDelete("verify");
    setToDelete(plan.activity_id);
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

                {status !== "join" && (
                  <>
                    <button
                      onClick={() => {
                        handle_click(plan);
                      }}
                    >
                      edit
                    </button>

                    <button onClick={() => handle_delete(plan)}>delete</button>
                  </>
                )}
              </div>
            );
          })}
      </div>

      {clicked && (
        <Edit_Activity on_close={handle_close} data={data} dates={dates} />
      )}

      {confirmDelete === "verify" && (
        <div className="modal">
          <h1>are you sure?</h1>
          <button onClick={() => setConfirmDelete("confirmed")}>yes</button>
          <button
            onClick={() => {
              setConfirmDelete("");
              setToDelete("");
            }}
          >
            no
          </button>
        </div>
      )}
    </>
  );
}

export default Activities;
