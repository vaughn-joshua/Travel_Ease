import React from 'react';

function Modal_Review({ isOpen, onClose, children }) {
  // If the modal is closed, return null immediately to prevent rendering
  if (!isOpen) return null;

  return (
    // 1. Overlay: Fixed position, fills screen (inset-0), translucent black background
    //    z-50 puts it on top of everything. Uses Flex to center the content.
    <div 
      className="fixed inset-0 bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose} // 👈 Clicking the overlay closes the modala
    >
      
      {/* 2. Modal Box: The actual content container */}
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4"
        // 👈 Stop click propagation so clicking the content doesn't close the modal
        onClick={(e) => e.stopPropagation()} 
      >
        {/* 3. Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          &times; {/* HTML entity for 'x' */}
        </button>

        {/* 4. Content Slot: Renders whatever is passed between <Modal> tags */}
        {children}

      </div>
    </div>
  );
}

export default Modal_Review;