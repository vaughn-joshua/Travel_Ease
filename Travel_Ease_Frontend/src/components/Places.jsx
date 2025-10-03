import usePlacesAutoComplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

function Places({ setOffice }) {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutoComplete();

  const onclick = (place) => {
    console.log({ place });
    setValue(place, false);
    clearSuggestions();
  };

  return (
    <>
      <form>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!ready}
          placeholder="Search for places here"
        />
      </form>

      {status === "OK" &&
        data.map((place, index) => {
          return (
            <p className="search_options" key={index} onClick={onclick(place)}>
              {place.description}
            </p>
          );
        })}
    </>
  );
}

export default Places;
