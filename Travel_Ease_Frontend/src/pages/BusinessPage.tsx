import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useBusinessDetail } from "../features/businesses/queries";
import AddProduct from "../components/business/AddProduct";
import EditBusiness from "../components/business/EditBusiness";
import type { Business } from "../types/business";

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

export default function BusinessPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<boolean>(false);
  const [clicked, setClicked] = useState<string | null>(null);
  const [edit, setEdit] = useState<boolean>(false);

  // Use TanStack Query hook for data fetching
  const { data: rawData, isLoading, isError, error } = useBusinessDetail(id);

  // Transform API response to extended business format
  const businessData = useMemo<ExtendedBusiness | null>(() => {
    if (!rawData || !id) return null;
    return {
      ...rawData,
      id: parseInt(id),
      house_number: (rawData as any).house_number,
      street: (rawData as any).street,
      brgy: (rawData as any).brgy,
      city:
        (rawData as any).city ||
        rawData.location?.address?.split(",").pop()?.trim(),
      picture: (rawData as any).picture,
      business_hours: (rawData as any).business_hours,
    } as ExtendedBusiness;
  }, [rawData, id]);

  // Parse pictures from business data
  const pictures = useMemo<PictureData>(() => {
    if (!businessData?.picture) return {};
    try {
      return JSON.parse(businessData.picture) as PictureData;
    } catch {
      return {};
    }
  }, [businessData?.picture]);

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

  // Loading state
  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load business</p>
          <p className="text-gray-500 text-sm">
            {error?.message || "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!businessData) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Business not found</p>
      </div>
    );
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
          <div
            className="modal_body relative"
            onClick={(e) => e.stopPropagation()}
          >
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
      {product && id && <AddProduct on_close={handle_close} id={id} />}
      {edit && businessData && (
        <EditBusiness on_close={handle_close} business={businessData as any} />
      )}
    </>
  );
}
