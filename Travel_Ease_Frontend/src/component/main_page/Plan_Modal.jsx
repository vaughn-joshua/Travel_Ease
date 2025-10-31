import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Plan_Modal({ results }) {
  const navigate = useNavigate();

  useEffect(() => {
    console.log(results);
  }, []);

  const handle_click = (key) => {
    navigate(`/planner/join/${key}`);
  };

  return (
    <div className="modal">
      {results.map((res) => (
        <div
          key={res.travel_plan_id}
          className="plans"
          onClick={() => handle_click(res.travel_plan_id)}
        >
          <h1>{res.name}</h1>
          <p>{res.location}</p>
          <p>{res.start_date}</p>
          <p>{res.end_date}</p>
          <p>{res.max_slots}</p>
        </div>
      ))}
    </div>
  );
}

export default Plan_Modal;
