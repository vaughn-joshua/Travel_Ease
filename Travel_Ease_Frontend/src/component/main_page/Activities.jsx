import { useState, useEffect } from "react";
import { fetch_activities } from "../../utils/travel_plan/fetch_activities";
import Edit_Activity from "./Edit_Activity";
import { delete_activity } from "../../utils/travel_plan/delete_activity";

function Activities({
  reference_id, // Travel plan ID
  load_state, // Toggler to reload activities (from parent)
  day_selected, // Which day the user selected (1, 2, 3...)
  dates, // Start and end date of the travel plan
  status, // "join", "planner", or default
  onSendData, // Parent function for sending clicked activity coords (map update)
}) {
  const [plans, setPlans] = useState(); // Activities for selected day
  const [clicked, setClicked] = useState(false); // Controls edit modal
  const [data, setData] = useState(); // Stores the activity selected for editing
  const [refresh, setRefresh] = useState(false); // Triggers reload after edit/delete
  const [confirmDelete, setConfirmDelete] = useState(""); // Delete confirmation modal state
  const [toDelete, setToDelete] = useState(""); // Activity ID to delete

  // ================================
  // Load and filter activities by day
  // ================================
  useEffect(() => {
    const load_plans = async () => {
      const data = await fetch_activities(reference_id);

      console.log(data);

      const starting_date = new Date(dates.start);
      let current_day;

      // Compute the actual calendar date based on selected day
      if (day_selected == 1) {
        current_day = starting_date;
      } else {
        const selected_day_ms = 1000 * 60 * 60 * 24 * (day_selected - 1);
        current_day = new Date(starting_date.getTime() + selected_day_ms);
      }

      // Filter activities that match the exact selected date
      const filtered_data = data.filter((item) => {
        const activity_date = new Date(item.target_date);
        return activity_date.toDateString() === current_day.toDateString();
      });

      setPlans(filtered_data);
    };

    load_plans();
  }, [load_state, refresh]);
  // Reload when parent toggles load_state OR local refresh toggles after edit/delete

  // ================================
  // Handle delete confirmation
  // ================================
  useEffect(() => {
    if (confirmDelete === "confirmed") {
      delete_activity(toDelete);

      // Reset state BEFORE refreshing
      setConfirmDelete("");
      setToDelete("");

      setRefresh((prev) => !prev); // Reload
    }
  }, [confirmDelete]);

  // ================================
  // Open edit modal
  // ================================
  const handle_click = (data) => {
    setClicked(true);
    if (data) setData(data);
  };

  // Close edit modal
  const handle_close = () => {
    setClicked(false);
    setRefresh((prev) => !prev); // Reload after saving edits
  };

  // ================================
  // Handle delete button click
  // ================================
  const handle_delete = (plan) => {
    setConfirmDelete("verify");
    setToDelete(plan.activity_id);
  };

  // ================================
  // Handle activity click
  // In planner mode → send map coordinates back to parent
  // ================================
  const click_plan = (plan) => {
    if (status == "view") {
      onSendData(plan.lat, plan.lng);
    }
  };

  return (
    <>
      <div className="mt-3">
        {!plans && <p>loading...</p>}

        {/* ================================
            Render activities for the day
           ================================ */}
        {plans &&
          plans.map((plan, index) => {
            return (
              // Activity Details
              <div
                key={index}
                className="card"
                onClick={() => click_plan(plan)}
              >
                <h1>{plan.location}</h1>
                <p>{plan.name}</p>
                <p>
                  {plan.brgy}, {plan.province}, {plan.city}
                </p>
                <p>{plan.notes}</p>
                <p>{plan.target_date}</p>
                <p>{plan.budget_range}</p>

                {/* ================================
                    Edit/Delete buttons
                    Show only when NOT in "join" or "planner" mode
                   ================================ */}
                {status !== "join" && status !== "planner" && (
                  <>
                    <button
                      onClick={() => handle_click(plan)}
                      className="soft_btn"
                    >
                      edit
                    </button>

                    <button
                      onClick={() => handle_delete(plan)}
                      className="soft_btn"
                    >
                      delete
                    </button>
                  </>
                )}
              </div>
            );
          })}
      </div>

      {/* ================================
          Edit Modal
         ================================ */}
      {clicked && (
        <Edit_Activity on_close={handle_close} data={data} dates={dates} />
      )}

      {/* ================================
          Delete Confirmation Modal
         ================================ */}
      {confirmDelete === "verify" && (
        <div className="modal">
          <div className="modal_body">
            <h1>are you sure?</h1>
            <button
              onClick={() => setConfirmDelete("confirmed")}
              className="hard_btn"
            >
              yes
            </button>
            <button
              className="soft_btn"
              onClick={() => {
                setConfirmDelete("");
                setToDelete("");
              }}
            >
              no
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Activities;
