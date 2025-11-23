import React, { useState, useEffect } from "react";
import axios from "axios";
function Business_box({onCardSelect}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetch_data = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/travel_spots`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const result = await response.json();
        console.log("Fetched data: ", result);
        const finalData = result.data || result;
        setData(Array.isArray(finalData) ? finalData : [finalData]);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data: ", error);
        setIsLoading(false);
      }
    };
    fetch_data();
  }, []);

  return (
    <>
      <div className="container">
        {isLoading && <p>Loading data from database</p>}
        {data && data.length > 0 && (
          <div>
            {/* <h2>Fetch Successfully!</h2> */}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
              {data.map((item, index) => (
                <div key={index}>
                    
                  <div className="bg-white rounded-xl shadow overflow-hidden 
                                           transition duration-300 ease-in-out 
                                           hover:shadow-2xl hover:scale-[1.03] cursor-pointer" onClick={() => onCardSelect(item)}>
                    <div className="max-w-sm bg-white rounded-xl shadow overflow-hidden">
                      <img
                        src={item.picture}
                        alt="Image"
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="text-lg font-bold">{item.name}</h3>
                        <p className="text-gray-600 mt-2">{item.description}</p>
                      </div>
                    </div>
                  </div>
                </div>

                
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Business_box;
