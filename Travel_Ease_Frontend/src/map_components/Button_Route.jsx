import React, { useState } from "react";

function Button_Route() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative h-screen bg-gray-100">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 left-4 z-50 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b text-lg font-semibold">Sidebar Menu</div>
            <form>
            <div className="p-4">
                <input type = "text" placeholder="Enter Starting Point" className="border p-2 rounded-md w-full" />
            </div>
            <div className="p-4">
                <input type = "text" placeholder = "Enter Destination" className="border p-2 rounded-md w-full" /> 
                </div>
            </form>
      </div>
 
    </div>
  );
}

export default Button_Route;
