import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetch_business } from "../utils/business/fetch_business";
import Add_Product from "../component/business/Add_Product";
import Edit_Business from "../component/business/Edit_Business";
import type { Business, BusinessCategory } from "../types/business";

interface BusinessHour {
  day_of_week: string;
  open_time: string | null;
  close_time: string | null;
}

interface ExtendedBusiness extends Business {
  house_number?: string;
  street?: string;
  brgy?: string;
  city?: string;
  picture?: string;
  business_hours?: BusinessHour[];
}

interface PictureData {
  secure_url?: string[];
}

export default function Business_Page(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const [businessData, setBusinessData] = useState<ExtendedBusiness | null>(null);
  const [product, setProduct] = useState<boolean>(false);
  const [pictures, setPictures] = useState<PictureData>({});
  const [clicked, setClicked] = useState<string | null>(null);
  const [edit, setEdit] = useState<boolean>(false);

  useEffect(() => {
    const load_data = async (): Promise<void> => {
      try {
        if (!id) return;
        const data = await fetch_business(id);
        if (data) {
          const extendedData = data as unknown as ExtendedBusiness;
          if (extendedData.picture) {
            const image_urls = JSON.parse(extendedData.picture) as PictureData;
            setPictures(image_urls);
          }
          console.log(data);
          setBusinessData({ ...extendedData, id: parseInt(id) });
        }
      } catch (error) {
        console.log(error);
      }
    };

    load_data();
  }, [id]);

  const product_clicked = (): void => {
    setProduct(true);
  };

  const handle_close = (): void => {
    setProduct(false);
    setEdit(false);
  };

  const clicked_picture = (image: string): void => {
    setClicked(image);
  };

  const formatTime = (time: string | null): string | null => {
    if (!time) return null;
    const [h, m] = time.split(":");
    let hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const handle_edit = (): void => {
    setEdit(true);
  };

  if (!businessData) {
    return <p>not found bossing</p>;
  }

  return (
    <>
      <div className="w-screen h-screen flex p-4 gap-6 bg-gray-100">
        <div className="w-[70vw] flex flex-col gap-4">
          <p>businesses list</p>

          <div className="business-list card">
            <>
              <div className="flex gap-2">
                {businessData.categories?.map((category, index) => (
                  <p className="category" key={index}>
                    {category.name}
                  </p>
                ))}
              </div>

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

              <h1 className="text-base mt-4 font-bold">address</h1>
              <div className="address flex gap-5">
                <p>Building Number: {businessData.house_number}</p>
                <p>Street: {businessData.street}</p>
                <p>Baranggay: {businessData.brgy}</p>
                <p>City: {businessData.city}</p>
              </div>
            </>
          </div>

          <div className="card">
            <div className="headerd flex justify-between">
              <h1>Business Details</h1>
              {(!pictures?.secure_url || pictures.secure_url.length === 0) && (
                <button className="hard_btn" onClick={product_clicked}>
                  Business Details
                </button>
              )}
            </div>

            <div className="flex gap-5">
              <div>
                <p>Operating Hours</p>
                {businessData.business_hours?.map((hour, index) => (
                  <p key={index}>
                    {hour.day_of_week}:{" "}
                    {hour.open_time ? formatTime(hour.open_time) : "closed"}
                    {hour.close_time ? `- ${formatTime(hour.close_time)}` : ""}
                  </p>
                ))}
              </div>

              <div>
                <p>Price Ranges</p>
                <div className="gap-2">
                  {businessData.categories?.map((category, index) => (
                    <p className="category" key={index}>
                      {category.name}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <p>Menu</p>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2">
                  {pictures.secure_url?.map((url, index) => (
                    <div key={index} className="min-w-[200px]">
                      <img
                        src={url}
                        alt={`Menu image ${index}`}
                        className="w-[10vw] h-auto rounded-lg shadow-md cursor-pointer"
                        onClick={() => clicked_picture(url)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[30vw]">
          <div className="card">business reviews</div>
        </div>
      </div>

      {clicked && (
        <div className="modal" onClick={() => setClicked(null)}>
          <div className="modal_body relative" onClick={(e) => e.stopPropagation()}>
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
      )}
      {product && id && <Add_Product on_close={handle_close} id={id} />}
      {edit && (
        <Edit_Business on_close={handle_close} business={businessData} />
      )}
    </>
  );
}

