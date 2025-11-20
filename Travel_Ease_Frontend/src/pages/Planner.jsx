import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetch_plan_id } from "../utils/travel_plan/fetch_plan_id";
import { fetch_businesses } from "../utils/travel_plan/fetch_businesses";
import Activities from "../component/main_page/Activities";
import Edit_Plan from "../component/main_page/Edit_Plan";
import Create_Activity from "../component/main_page/Create_Activity";
import { useNavigate } from "react-router-dom";
import { edit_plan } from "../utils/travel_plan/edit_plan";
import Landing_Page from "./Landing_Page";

const itineraryRoute = {
  // Tagaytay Rotonda
  start: [14.1154, 120.9618], // SHOULD BE USER LOCATION
};

function Planner() {
  const { id, status } = useParams();

  const navigate = useNavigate();
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

  const [clickedActivity, setClickActivity] = useState({
    start: null,
    end: null, // will be [lat, lng]
  });

  const handle_close = () => {
    window.location.reload();
    console.log("closing na");
    setActiveModal("");
  };

  const handleChildData = (lat, long) => {
    console.log({ lat, long });

    // Update end point for map path
    setClickActivity({ end: [lat, long] });
  };

  useEffect(() => {
    const load_data = async () => {
      try {
        const business_data = await fetch_businesses();

        // fetch plan details
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

  const handle_start = () => {
    const to_submit = { travel_plan: id, status: "Active" };
    navigate(`/planner/view/${id}`);
    edit_plan(to_submit);
  };

  if (!plan) {
    return <p>loading...</p>;
  }

  return (
    <div className="p-5 ">
      <div className="flex gap-6">
        <div id="map-container" className="card w-9/12 h-[60vh]">
          <Landing_Page
            start={itineraryRoute.start}
            end={clickedActivity.end} // updates when activity is clicked
            className="w-full h-full grid col-span-8"
          />
        </div>
        <div className="activities w-3/12">
          <div className="flex justify-between">
            <div className="flex gap-5">
              {Array.from({ length: days }, (_, i) => (
                <h3
                  className="font-bold"
                  key={i}
                  onClick={() => click_day(i + 1)}
                >
                  Day {i + 1}
                </h3>
              ))}
            </div>
            <div>
              {status !== "join" && (
                <button
                  onClick={() => setActiveModal("activity")}
                  className="hard_btn"
                >
                  Add Activity
                </button>
              )}
            </div>
          </div>
          <div className="activities">
            {dates.start && (
              <Activities
                status={status}
                reference_id={id}
                load_state={loadActivity}
                day_selected={daySelected}
                dates={dates}
                onSendData={handleChildData}
              />
            )}
          </div>
        </div>
      </div>

      <div id="travel_plan_details_header" className="card mt-6">
        <div className="flex justify-between">
          <h1>{plan[0].name}</h1>

          <div id="buttons_container" className=" space-x-2">
            {status === "join" && (
              <button className="hard_btn">join now</button>
            )}
            {status === "start" && (
              <>
                <button
                  onClick={() => setActiveModal("plan")}
                  className="soft_btn"
                >
                  edit
                </button>
                <button className="hard_btn" onClick={handle_start}>
                  start now
                </button>
              </>
            )}
            {status === "view" && (
              <button
                onClick={() => setActiveModal("plan")}
                className="soft_btn"
              >
                edit
              </button>
            )}
            <button className="hard_btn">Collborators</button>
          </div>
        </div>

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
        <Edit_Plan data={plan} travel_plan={id} on_close={handle_close} />
      )}
    </div>
  );
}

export default Planner;
