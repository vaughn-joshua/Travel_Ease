import Business_box from "../../components/Travel_Spots/Business_box.jsx";
import Search_Box from "../../components/Travel_Spots/Search_Box.jsx";
import Modal_Review from "../../components/Travel_Spots/Modal_Review.jsx";
import { useState } from "react";

function Main_Travel_Spots_Page(){
// State to control the modal's visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State to hold the data of the card that was clicked
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const handleCardSelection = (businessItem) => {
    setSelectedBusiness(businessItem); // Save the data
    setIsModalOpen(true);             // Open the modal
  };
return(
    <>
    
    <Search_Box className = ""/>
    <Business_box onCardSelect={handleCardSelection} />
    <Modal_Review isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

    {selectedBusiness &&(
        <div>
            <h3 className="text-xl font-bold mb-3">Testing</h3>
            <p className="text-gray-700">Details for ID: Testing</p>
          </div>
    )}
    </>
);

}

export default Main_Travel_Spots_Page;