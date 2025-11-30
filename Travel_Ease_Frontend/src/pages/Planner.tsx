import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetch_plan_id } from "../utils/travel_plan/fetch_plan_id";
import { fetch_businesses } from "../utils/travel_plan/fetch_businesses";
import Activities from "../component/main_page/Activities";
import Edit_Plan from "../component/main_page/Edit_Plan";
import Create_Activity from "../component/main_page/Create_Activity";
import React from "react";
import Landing_Page from "./Landing_Page";
import type { TravelPlan, TravelPlanDates } from "../types/travelPlan";
import type { Business } from "../types/business";

const itineraryRoute = {
  start: [14.1154, 120.9618] as [number, number],
};

type ModalType = "" | "activity" | "plan";

interface ClickedActivity {
  start: [number, number] | null;
  end: [number, number] | null;
}

export default function Planner(): React.ReactElement {
  const { id, status } = useParams<{ id: string; status: string }>();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<TravelPlan[] | undefined>();
  const [days, setDays] = useState<number>(0);
  const [businesses, setBusinesses] = useState<Business[] | undefined>();
  const [loadActivity, setLoadActivity] = useState<boolean>(false);
  const [daySelected, setDaySelected] = useState<number>(1);
  const [activeModal, setActiveModal] = useState<ModalType>("");

  const [dates, setDates] = useState<TravelPlanDates>({
    start: "",
    end: "",
  });

  const [clickedActivity, setClickActivity] = useState<ClickedActivity>({
    start: null,
    end: null,
  });

  const handle_close = (): void => {
    window.location.reload();
    console.log("closing na");
    setActiveModal("");
  };

  const handleChildData = (lat: number, long: number): void => {
    console.log({ lat, long });
    setClickActivity({ start: null, end: [lat, long] });
  };

  useEffect(() => {
    const load_data = async (): Promise<void> => {
      try {
        if (!id) return;
        const business_data = await fetch_businesses();
        const plan_data = await fetch_plan_id(id);

        if (plan_data) {
          setPlan([plan_data]);
        }
        setBusinesses(business_data);
      } catch (e) {
        console.log({ e });
      }
    };

    load_data();
  }, [id, activeModal]);

  useEffect(() => {
    if (plan && plan.length > 0) {
      const start = new Date(plan[0].start_date);
      const end = new Date(plan[0].end_date);

      const diff = end.getTime() - start.getTime();
      const dayCount = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;

      setDays(dayCount);
      setDates({ start: start.toISOString(), end: end.toISOString() });
    }
  }, [plan]);

  const click_day = (i: number): void => {
    setLoadActivity((prev) => !prev);
    setDaySelected(i);
  };

  const handle_start = (): void => {
    if (!id) return;
    // Navigate and update status (status would need backend support)
    navigate(`/planner/view/${id}`);
  };

  if (!plan) {
    return <p>loading...</p>;
  }

  return (
    <div className="p-5">
      <div className="flex gap-6">
        <div id="map-container" className="card w-9/12 h-[60vh]">
          <Landing_Page
            start={itineraryRoute.start}
            end={clickedActivity.end}
            className="w-full h-full grid col-span-8"
          />
        </div>
        <div className="activities w-3/12">
          <div className="flex justify-between">
            <div className="flex gap-5">
              {Array.from({ length: days }, (_, i) => (
                <h3
                  className="font-bold cursor-pointer"
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
            {dates.start && id && (
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
          <h1>{plan[0].title}</h1>

          <div id="buttons_container" className="space-x-2">
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
            <button className="hard_btn">Collaborators</button>
          </div>
        </div>

        <p>{plan[0].description}</p>
        <p>{plan[0].location}</p>
        <p>{plan[0].start_date}</p>
        <p>{plan[0].end_date}</p>
        <p>{plan[0].slots}</p>
      </div>

      {activeModal === "activity" && id && (
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
      {activeModal === "plan" && id && (
        <Edit_Plan data={plan} travel_plan={id} on_close={handle_close} />
      )}
    </div>
  );
}

