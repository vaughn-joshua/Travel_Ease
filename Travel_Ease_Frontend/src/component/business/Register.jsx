import { useForm } from "react-hook-form";
import { upload_image } from "../../utils/business/upload_image";
import Register_Map from "./Register_Map";
import { useEffect, useState } from "react";

const category = [
  "popular",
  "food & drinks",
  "accomodation",
  "souvenir shop",
  "nature",
  "night life",
  "leisure",
  "actvities",
  "local offers",
];

function Register({ on_close }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const [counter, setCounter] = useState(0);
  const [pin, setPins] = useState([]);

  const handlePinMove = (lat, lng) => {
    console.log(lat, lng);
    setPins([{ lat, lon: lng }]); // update pin position
  };

  const on_submit = async (data) => {
    if (counter == 2) {
      // file name, file, folder
      const formData = new FormData();
      formData.append("image", data.picture[0]);
      formData.append("name", data.name);
      formData.append("folder", "Travel_Ease/Business");

      const upload = await upload_image(formData);

      data.secure_url = upload;
      data.lat = pin[0].lat;
      data.lng = pin[0].lon;
      console.log({ data });
    } else if (counter == 1) {
      setCounter((prev) => prev + 1);
      try {
        const street = data.street;
        const brgy = data.brgy;
        console.log({ street, brgy });

        const response = await fetch("http://localhost:3000/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            street,
            brgy,
          }),
        });

        const result = await response.json();

        const cleanPins = result.map((loc) => ({
          lat: Number(loc.lat),
          lon: Number(loc.lon),
        }));

        console.log({ cleanPins });

        setPins(cleanPins);
      } catch (error) {
        console.log(error);
      }
    } else {
      setCounter((prev) => prev + 1);
    }
    console.log(data);
  };

  const handle_change = async (e) => {
    const value = e.target.value;

    if (value.length >= 3) {
      try {
        const response = await fetch("http://localhost:3000/api/suggestions", {
          method: "GET",
        });

        const data = await response.json();
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handle_close = () => {
    on_close();
  };

  const handle_back = () => {
    setCounter((prev) => prev - 1);
  };

  return (
    <div className="modal ">
      <div className="modal_body w-[70vw] h-[60vh]">
        <div className="flex gap-6 h-full">
          <div className="w-[70%] ">
            <Register_Map pins={pin} onPinMove={handlePinMove} />
          </div>
          <form onSubmit={handleSubmit(on_submit)} className="w-[30%]">
            <h1 className="text-xl font-bold mb-4">you are at register</h1>

            {counter == 0 && (
              <>
                <label className="label">
                  Name:
                  <input
                    {...register("name", {
                      required: "name is required",
                    })}
                    className="text_box"
                  />
                </label>
                {errors.name && <p>{errors.name.message}</p>}
                <label className="label">
                  Category:
                  <div className="flex flex-wrap gap-2">
                    {category.map((cat, index) => (
                      <div key={index}>
                        <input
                          type="checkbox"
                          value={cat}
                          {...register("category", {
                            required: "category is required",
                          })}
                        />
                        <span>{cat}</span>
                      </div>
                    ))}
                  </div>
                </label>
                {errors.category && <p>{errors.category.message}</p>}
                <label className="label">
                  Description:
                  <input
                    {...register("description", {
                      required: "description is required",
                    })}
                    className="text_box"
                  />
                </label>
                {errors.description && <p>{errors.description.message}</p>}
              </>
            )}

            {counter === 1 && (
              <>
                <label className="label">
                  House Number:
                  <input
                    {...register("house_no", {
                      required: "House Number is required",
                    })}
                    className="text_box"
                  />
                </label>
                {errors.house_no && <p>{errors.house_no.message}</p>}

                <label className="label">
                  Street:
                  <input
                    {...register("street", {
                      required: "Street is required",
                    })}
                    className="text_box"
                    onChange={handle_change}
                  />
                </label>
                {errors.street && <p>{errors.street.message}</p>}

                <label className="label">
                  Baranggay:
                  <input
                    {...register("brgy", {
                      required: "Barangay is required",
                    })}
                    className="text_box"
                    onChange={handle_change}
                  />
                </label>
                {errors.brgy && <p>{errors.brgy.message}</p>}

                <label className="label">
                  City:
                  <input
                    {...register("city", {
                      required: "City is required",
                    })}
                    className="text_box"
                  />
                </label>
                {errors.city && <p>{errors.city.message}</p>}
              </>
            )}

            {counter === 2 && (
              <>
                <label className="label">
                  Business Hours:
                  <input
                    {...register("business_hours", {
                      required: "business hours is required",
                    })}
                    className="text_box"
                  />
                </label>
                {errors.business_hours && (
                  <p>{errors.business_hours.message}</p>
                )}
                <label className="label">
                  Picture:
                  <input
                    {...register("picture", {
                      required: "picture is required",
                    })}
                    className="text_box"
                    type="file"
                  />
                </label>
                {errors.picture && <p>{errors.picture.message}</p>}
              </>
            )}

            <div className="w-full flex justify-between mt-4">
              <button className="soft_btn" onClick={handle_close}>
                close
              </button>

              {counter > 0 && (
                <button className="soft_btn" onClick={handle_back}>
                  back
                </button>
              )}
              <input
                type="submit"
                value={counter == 2 ? "submit" : "next"}
                className="hard_btn"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
