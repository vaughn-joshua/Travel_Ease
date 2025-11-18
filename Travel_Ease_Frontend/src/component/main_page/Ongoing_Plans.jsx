import { useState } from "react";
import { useEffect } from "react";
import { fetch_ongoing_plans } from "../../utils/travel_plan/fetch_ongoing_plans";
import { useNavigate } from "react-router-dom";
import Landing_Page from "../../pages/Landing_Page";
import Activities from "./Activities";

// Example Route Data (Defined locally for now)
const itineraryRoute = {
  start: [14.1154, 120.9618], // Tagaytay Rotonda
  end: [14.0953, 120.9376], // Sky Ranch
};

function Ongoing_Plans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState();

  const [clickedActivity, setClickActivity] = useState({
    start: 0,
    end: 0,
  });

  // store day number
  const [days, setDays] = useState(0);
  const [dates, setDates] = useState({
    start: 0,
    end: 0,
  });
  const [daySelected, setDaySelected] = useState(1);
  const [loadActivity, setLoadActivity] = useState(false);

  useEffect(() => {
    const load_plans = async () => {
      //fetch business data
      const data = await fetch_ongoing_plans();
      setPlans(data);
    };

    load_plans();
  }, []);

  useEffect(() => {
    if (selected) {
      const start = new Date(selected.start_date);
      const end = new Date(selected.end_date);

      const months = end - start;

      const days = Math.ceil(months / (1000 * 60 * 60 * 24)) + 1;

      setDays(days);

      setDates({ start: start.toISOString(), end: end.toISOString() });
    }
  }, [selected]);

  const handle_click = (key) => {
    navigate(`/planner/view/${key}`);
  };

  const handle_selected = (data) => {
    setSelected(data);
  };

  const handle_back = () => {
    setSelected(null);
  };

  const click_day = (i) => {
    setLoadActivity((prev) => !prev);
    setDaySelected(i);
  };

  return (
    <div className="space-y-3 ">
      {!plans && <p className="text-gray-500 italic">Loading...</p>}

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

      {selected && (
        <>
          <div
            key={selected.travel_plan_id}
            className="p-4 bg-white shadow-sm rounded-xl hover:shadow-md transition cursor-pointer h-[40vh] flex gap-5"
          >
            <div className="bg-amber-100 w-[50vw]">
              <Landing_Page
                start={itineraryRoute.start}
                end={itineraryRoute.end}
                className="w-full h-full grid col-span-8"
              />
            </div>

            <div>
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

              {/* day segregation */}
              <div className="flex gap-5">
                {Array.from({ length: days }, (_, i) => (
                  <h3
                    className="text-sm"
                    key={i}
                    onClick={() => click_day(i + 1)}
                  >
                    Day {i + 1}
                  </h3>
                ))}
              </div>

              {/* activities */}
              <div className="activities w-full">
                {dates.start && (
                  <Activities
                    status={"planner"}
                    reference_id={selected.travel_plan_id}
                    load_state={loadActivity}
                    day_selected={daySelected}
                    dates={dates}
                  />
                )}
              </div>

              <button
                className="soft_btn mt-5"
                onClick={() => handle_click(selected.travel_plan_id)}
              >
                view more
              </button>
            </div>
          </div>

          <button onClick={handle_back} className="soft_btn">
            back
          </button>
        </>
      )}
    </div>
  );
}

export default Ongoing_Plans;
