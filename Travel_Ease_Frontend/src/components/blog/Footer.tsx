import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-100 text-gray-700">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Centered Brand & Links */}
        <div className="text-center space-y-6">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-red text-sm font-bold text-white shadow-lg shadow-primary-red/20 group-hover:shadow-primary-red/30 transition-shadow">
              TE
            </span>
            <span className="text-xl font-bold text-gray-900">
              TravelEase
            </span>
          </Link>

          {/* Tagline */}
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Your gateway to Tagaytay's breathtaking views, cool climate, and unforgettable experiences.
          </p>

          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm">
            <Link className="text-gray-600 hover:text-primary-red transition-colors" to="/blogs">
              Blog Stories
            </Link>
            <Link className="text-gray-600 hover:text-primary-red transition-colors" to="/travel_spots_page">
              Featured Spots
            </Link>
            <Link className="text-gray-600 hover:text-primary-red transition-colors" to="/map">
              Interactive Map
            </Link>
            <Link className="text-gray-600 hover:text-primary-red transition-colors" to="/plans">
              Plan a Trip
            </Link>
          </nav>
        </div>

        {/* Aesthetic Footer Bottom */}
        <div className="mt-10 pt-8 border-t border-gray-100">
          <div className="flex flex-col items-center gap-4">
            {/* Tagaytay Features */}
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span>🌡️</span> Cool 23°C Climate
              </span>
              <span className="flex items-center gap-1.5">
                <span>🏔️</span> Taal Volcano Views
              </span>
              <span className="flex items-center gap-1.5">
                <span>🍃</span> Fresh Mountain Air
              </span>
              <span className="flex items-center gap-1.5">
                <span>☕</span> Café Culture
              </span>
            </div>
            
            {/* Copyright */}
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} TravelEase. Crafted with 💚 in Tagaytay.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
