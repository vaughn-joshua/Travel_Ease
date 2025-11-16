function Business_Hours() {
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return (
    <>
      <div className="days ">
        {days.map((day, index) => (
          <button className="day_btn" key={index}>
            {day}
          </button>
        ))}
      </div>
      <div>
        <input type="time" className="text_box" />
        <input type="time" className="text_box" />
      </div>
    </>
  );
}

export default Business_Hours;
