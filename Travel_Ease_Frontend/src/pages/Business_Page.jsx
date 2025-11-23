import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetch_business } from "../utils/business/fetch_business";
import Add_Product from "../component/business/Add_Product";
import Edit_Business from "../component/business/Edit_Business";

function Business_Page() {
  const { id } = useParams();
  const [businessData, setBusinessData] = useState(null);
  const [product, setProduct] = useState(false);
  const [pictures, setPictures] = useState([]);
  const [clicked, setClicked] = useState(null);
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    const load_data = async () => {
      try {
        const data = await fetch_business(id);
        const image_urls = JSON.parse(data.picture);
        setPictures(image_urls);
        console.log(data);
        data.id = id;
        setBusinessData(data);
      } catch (error) {
        console.log(error);
      }
    };

    load_data();
  }, []);

  const product_clicked = () => {
    setProduct(true);
  };

  const handle_close = () => {
    setProduct(false);
    setEdit(false);
  };

  const clicked_picture = (image) => {
    setClicked(image);
  };

  const formatTime = (time) => {
    if (!time) return null;
    const [h, m] = time.split(":");
    let hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const handle_edit = () => {
    setEdit(true);
  };

  if (businessData == undefined) {
    return <p>not found bossing</p>;
  }

  return (
    <>
      <div className="w-screen h-screen flex p-4 gap-6 bg-gray-100">
        <div className="w-[70vw] flex flex-col gap-4">
          <p>businesses list</p>

          {/* business info */}
          <div className="business-list card">
            {businessData && (
              <>
                {/* categories */}
                <div className="flex gap-2">
                  {businessData.categories.map((category, index) => (
                    <p className="category" key={index}>
                      {category.category_name}
                    </p>
                  ))}
                </div>

                {/* header */}
                <div className="header flex justify-between">
                  <div className="flex gap-4">
                    <h1 className="text-2xl font-bold">{businessData.name}</h1>
                    <p>*****</p>
                  </div>

                  <button className="soft_btn" onClick={handle_edit}>
                    edit
                  </button>
                </div>
                <p>{businessData.description}</p>

                {/* address */}
                <h1 className="text-base mt-4 font-bold">address</h1>
                <div className="address flex gap-5">
                  <p>Building Number: {businessData.house_number}</p>
                  <p>Street: {businessData.street}</p>
                  <p>Baranggay: {businessData.brgy}</p>
                  <p>City: {businessData.city}</p>
                </div>
              </>
            )}
          </div>

          {/* more business info */}
          <div className=" card">
            <div className="headerd flex justify-between">
              <h1>Business Details</h1>
              {(!pictures?.secure_url || pictures.secure_url.length === 0) && (
                <button className="hard_btn" onClick={product_clicked}>
                  Business Details
                </button>
              )}
            </div>

            <div className="flex gap-5">
              {/* hours */}
              <div>
                <p>Operating Hours</p>
                {businessData.business_hours.map((hour, index) => (
                  <p className="" key={index}>
                    {hour.day_of_week}:{" "}
                    {hour.open_time ? formatTime(hour.open_time) : "closed"}
                    {hour.close_time ? `- ${formatTime(hour.close_time)}` : ""}
                  </p>
                ))}
              </div>

              {/* prices */}
              <div>
                <p>Price Ranges</p>
                <div className=" gap-2">
                  {businessData.categories.map((category, index) => (
                    <p className="category" key={index}>
                      {category.category_name}: {category.price_range.max_price}{" "}
                      - {category.price_range.min_price}
                    </p>
                  ))}
                </div>
              </div>

              {/* menu */}
              <div>
                <p>Menu</p>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2 ">
                  {pictures.secure_url?.map((url, index) => (
                    <div key={index} className="min-w-[200px]">
                      <img
                        src={url}
                        alt={`Menu image ${index}`}
                        className="w-[10vw] h-auto rounded-lg shadow-md"
                        onClick={() => clicked_picture(url)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* reviews */}
        <div className="w-[30vw]">
          <div className="card">busisiness reviews</div>
        </div>
      </div>

      {clicked && (
        <>
          <div
            className="modal"
            onClick={() => setClicked(null)} // close when clicking outside
          >
            <div
              className="modal_body relative"
              onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
            >
              {/* Exit button */}
              <button
                className="absolute top-2 right-2 text-white bg-black/50 px-2 py-1 rounded"
                onClick={() => setClicked(null)}
              >
                ✕
              </button>

              <img
                src={clicked}
                alt="Menu image"
                className="w-[50vh] h-auto rounded-lg shadow-md"
              />
            </div>
          </div>
        </>
      )}
      {product && <Add_Product on_close={handle_close} id={id} />}
      {edit && (
        <Edit_Business on_close={handle_close} business={businessData} />
      )}
    </>
  );
}

/*
  1. register business account
        saving business loc
        saving picture
        business hours
        category
  2. register business product and service
  3. business raiting
  4. view reviews and raiting
  5. google auth
  */

/*
  to do
    1. post business registration
    2. business page layout
        see busines (if many)
        see business raiting
        see business reviews
        see business details
        see business products and service
    3. create a business product or service
  */

/*
    adding a product or service
    1. add menu image
    2. run through the categories,
    3. set price range for categories
  */

export default Business_Page;
