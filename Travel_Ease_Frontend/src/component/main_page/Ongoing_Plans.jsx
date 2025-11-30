// Ongoing_Plans.jsx
// Displays the list of ongoing travel plans.
// Allows selecting a plan to preview its map, daily activities,
// and navigate to the full planner page. This also handles
// interactions coming from the Activities component (e.g., map updates).

import { useState, useEffect } from "react";
import { fetch_ongoing_plans } from "../../utils/travel_plan/fetch_ongoing_plans";
import { useNavigate } from "react-router-dom";
import Landing_Page from "../../pages/Landing_Page";
import Activities from "./Activities";

// Temporary static route
const itineraryRoute = {
  // Tagaytay Rotonda
  start: [14.1154, 120.9618], // SHOULD BE USER LOCATION
};

function Ongoing_Plans() {
  const navigate = useNavigate();

  // Stores all fetched ongoing plans
  const [plans, setPlans] = useState([]);

  // Stores the currently selected plan (null = none / list view)
  const [selected, setSelected] = useState();

  // Stores location of clicked activity (used to update map)
  const [clickedActivity, setClickActivity] = useState({
    start: null,
    end: null, // will be [lat, lng]
  });

  // Total number of days between start and end of selected plan
  const [days, setDays] = useState(0);

  // Stores formatted plan date range
  const [dates, setDates] = useState({
    start: 0,
    end: 0,
  });

  // Currently selected day in the activities list
  const [daySelected, setDaySelected] = useState(1);

  // Toggles reload state for activities component (forces re-fetch)
  const [loadActivity, setLoadActivity] = useState(false);

  // Receives coordinates from child component <Activities />
  const handleChildData = (lat, long) => {
    console.log({ lat, long });

    // Update end point for map path
    setClickActivity({ end: [lat, long] });
  };

  // Fetch ongoing plans on first render
  useEffect(() => {
    const load_plans = async () => {
      const data = await fetch_ongoing_plans();
      setPlans(data);
    };

    load_plans();
  }, []);

  // When user selects a plan, compute number of days and date range
  useEffect(() => {
    if (selected) {
      const start = new Date(selected.start_date);
      const end = new Date(selected.end_date);

      // Difference in milliseconds → convert to days
      const diffInMs = end - start;
      const daysTotal = Math.ceil(diffInMs / (1000 * 60 * 60 * 24)) + 1;

      setDays(daysTotal);
      setDates({
        start: start.toISOString(),
        end: end.toISOString(),
      });
    }
  }, [selected]);

  // Navigate to full travel planner page
  const handle_click = (key) => {
    navigate(`/planner/view/${key}`);
  };

  // Select a plan from the list
  const handle_selected = (data) => {
    setSelected(data);
  };

  // Back to list view
  const handle_back = () => {
    setSelected(null);
  };

  // When a day is clicked, reload activities list and update selected day
  const click_day = (i) => {
    setLoadActivity((prev) => !prev);
    setDaySelected(i);
  };

  return (
    <div className="space-y-3 ">
      {/* Show loading message before data is available */}
      {!plans && <p className="text-gray-500 italic">Loading...</p>}

      {/* =============================
          LIST VIEW — When no plan is selected
         ============================= */}
      {!selected &&
        plans.map((plan, index) => (
          <div
            className="card"
            key={index}
            onClick={() => handle_selected(plan)}
          >
            <h2>{plan.name}</h2>
            <p>{plan.description}</p>
            <p>
              {plan.start_date} - {plan.end_date}
            </p>
            <p>{plan.location}</p>
          </div>
        ))}

      {/* =============================
          PLAN VIEW — When a plan IS selected
         ============================= */}
      {selected && (
        <>
          {/* Main selected plan container */}
          <div
            key={selected.travel_plan_id}
            className="p-4 bg-white shadow-sm rounded-xl hover:shadow-md transition cursor-pointer h-[40vh] flex gap-5"
          >
            {/* MAP DISPLAY */}
            <div className="bg-amber-100 w-[50vw]">
              <Landing_Page
                start={itineraryRoute.start}
                end={clickedActivity.end} // updates when activity is clicked
                className="w-full h-full grid col-span-8"
              />
            </div>

            {/* RIGHT SIDE DETAILS */}
            <div>
              {/* Plan Header */}
              <div id="header" className="flex">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 w-[20vw]">
                    {selected.name}
                  </h2>

                  <p className="text-gray-600 text-sm mt-1">
                    {selected.description}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mt-2">
                    {selected.start_date} – {selected.end_date}
                  </p>
                  <p className="text-sm text-gray-500">{selected.location}</p>
                </div>
              </div>

              {/* DAY SELECTOR */}
              <div className="flex gap-5">
                {Array.from({ length: days }, (_, i) => (
                  <h3
                    className="text-sm cursor-pointer"
                    key={i}
                    onClick={() => click_day(i + 1)}
                  >
                    Day {i + 1}
                  </h3>
                ))}
              </div>

              {/* ACTIVITIES LIST FOR SELECTED DAY */}
              <div className="activities w-full">
                {dates.start && (
                  <Activities
                    status="view"
                    reference_id={selected.travel_plan_id}
                    load_state={loadActivity}
                    day_selected={daySelected}
                    dates={dates}
                    onSendData={handleChildData}
                  />
                )}
              </div>

              {/* View More BUTTON */}
              <button
                className="soft_btn mt-5"
                onClick={() => handle_click(selected.travel_plan_id)}
              >
                view more
              </button>
            </div>
          </div>

          {/* BACK TO LIST */}
          <button onClick={handle_back} className="soft_btn">
            back
          </button>
        </>
      )}
    </div>
  );
}

export default Ongoing_Plans;
