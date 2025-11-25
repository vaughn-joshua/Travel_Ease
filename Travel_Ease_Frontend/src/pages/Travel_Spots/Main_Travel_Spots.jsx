import Business_box from "../../components/Travel_Spots/Business_box.jsx";
import Search_Box from "../../components/Travel_Spots/Search_Box.jsx";
import Modal_Review from "../../components/Travel_Spots/Modal_Review.jsx";
import { useState, useEffect } from "react";
import { endpoints } from "../../config/api.js";

function Main_Travel_Spots_Page(){
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(()=> {
    if(selectedBusiness){
      const fetchReviews = async () => {
        setIsLoadingReviews(true);
        try {
          const response = await fetch(endpoints.business.reviews(selectedBusiness.business_id));
          const result = await response.json();
          console.log("API Response:", result);
          setReviews(result.data || []);
        } catch (error) {
          console.error("Error fetching reviews: ", error);
        } finally {
          setIsLoadingReviews(false);
        }
      }
      fetchReviews();
    } else {
      setReviews([]);
    }
  }, [selectedBusiness]);
  const handleCardSelection = (businessItem) => {
    setSelectedBusiness(businessItem); // Save the data
    setIsModalOpen(true);             // Open the modal
  };
return(
    <>
    
    <Search_Box className = ""/>
    <Business_box onCardSelect={handleCardSelection} />
    <Modal_Review isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>

 {selectedBusiness && (
          <div>
            {/* Static Data (from the card) */}
            <h3 className="text-2xl font-bold mb-1">{selectedBusiness.name}</h3>
            <p className="text-gray-600 italic mb-4">{selectedBusiness.description}</p>

            <hr className="my-4" />

            {/* Dynamic Data (Fetched from DB) */}
            <h4 className="text-lg font-semibold mb-2">Reviews</h4>
            
            {isLoadingReviews ? (
                <p className="text-gray-500">Loading reviews...</p>
            ) : (
                <div className="max-h-60 overflow-y-auto">
                    {reviews.length > 0 ? (
                        reviews.map((review, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg mb-2 border">
                                <div className="flex justify-between">
                                    <span className="font-bold text-sm">User {review.user_id}</span>
                                    <span className="text-yellow-500">★ {review.rating}</span>
                                </div>
                                <p className="text-sm mt-1">{review.content}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400">No reviews yet.</p>
                    )}
                </div>
            )}
          </div>
        )}
    </Modal_Review>
    </>
);

}

export default Main_Travel_Spots_Page;