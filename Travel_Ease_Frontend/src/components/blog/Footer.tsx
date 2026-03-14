import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-100 text-gray-700">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Tagaytay Aesthetic Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full mb-6">
            <span className="text-lg">🌿</span>
            <span className="text-sm font-medium text-green-700">Where Cool Breeze Meets Adventure</span>
            <span className="text-lg">⛰️</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Join the TravelEase Community
          </h2>
          <p className="mt-3 text-gray-600 max-w-lg mx-auto">
            Discover the best of Tagaytay — from scenic ridge views to hidden local gems. 
            Get curated travel tips delivered to your inbox.
          </p>
        </div>

        {/* Newsletter - Centered */}
        <form
          className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto mb-16"
          onSubmit={(event) => event.preventDefault()}
        >
          <label htmlFor="footer-email" className="sr-only">
            Email address
          </label>
          <input
            id="footer-email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-primary-red focus:outline-none focus:ring-2 focus:ring-primary-red/20 transition-colors shadow-sm"
          />
          <button
            type="submit"
            className="w-full sm:w-auto whitespace-nowrap rounded-xl bg-primary-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-red-dark focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2"
          >
            Subscribe
          </button>
        </form>

        {/* Tagaytay Vibes Divider */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gray-200" />
          <div className="flex items-center gap-2 text-gray-400">
            <span>☕</span>
            <span className="text-xs font-medium uppercase tracking-wider">Tagaytay, Philippines</span>
            <span>🌅</span>
          </div>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gray-200" />
        </div>

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
        <div className="mt-12 pt-8 border-t border-gray-100">
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
