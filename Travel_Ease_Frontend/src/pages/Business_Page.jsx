import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetch_business } from "../utils/business/fetch_business";
import Add_Product from "../component/business/Add_Product";

function Business_Page() {
  const { id } = useParams();
  const [businessData, serBusinessData] = useState(null);
  const [product, setProduct] = useState(false);

  useEffect(() => {
    const load_data = async () => {
      try {
        const data = await fetch_business(id);
        serBusinessData(data);
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
  };

  if (businessData == undefined) {
    return <p>not found bossing</p>;
  }

  return (
    <>
      <div className="w-screen h-screen flex p-4 gap-6 bg-gray-100">
        <div className="w-[70vw] flex flex-col gap-4">
          <div className="business-list card">
            <p>businesses list</p>

            <h1 className="text-xl font-bold">business details</h1>
            {businessData && (
              <>
                <div className="header">
                  <p>business raiting</p>
                  <h1>{businessData.name}</h1>
                  <p>{businessData.description}</p>

                  <button className="soft_btn">edit</button>
                </div>

                <div className="address my-4">
                  <h1>address</h1>
                  <p>{businessData.house_number}</p>
                  <p>{businessData.street}</p>
                  <p>{businessData.brgy}</p>
                  <p>{businessData.city}</p>
                </div>
              </>
            )}
          </div>
          <div className="product/service card">
            <div className="headerd flex justify-between">
              <h1>products/service container</h1>
              <button className="hard_btn" onClick={product_clicked}>
                add product
              </button>
            </div>
          </div>
        </div>
        <div className="w-[30vw]">
          <div className="card">busisiness reviews</div>
        </div>
      </div>

      {product && <Add_Product on_close={handle_close} id={id} />}
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
