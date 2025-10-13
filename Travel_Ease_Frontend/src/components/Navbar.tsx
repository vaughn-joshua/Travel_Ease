import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-red rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">📍</span>
            </div>
            <span className="text-xl font-bold">TravelEase</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex space-x-8">
            <Link
              to="/map"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive("/map")
                  ? "bg-primary-red text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              Map
            </Link>
            <Link
              to="/spots"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive("/spots")
                  ? "bg-primary-red text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              Spots
            </Link>
            <Link
              to="/blogs"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive("/blogs") || isActive("/")
                  ? "bg-primary-red text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              Blogs
            </Link>
          </div>

          {/* User Icon */}
          <div className="flex items-center">
            <button
              className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 focus:ring-offset-gray-800"
              aria-label="User menu"
            >
              <span className="text-white text-sm">👤</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


