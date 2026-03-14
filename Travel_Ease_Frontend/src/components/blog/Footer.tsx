import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center bg-gray-900 rounded-lg w-10 h-10 shrink-0">
                <span className="text-white font-bold text-lg leading-none">TE</span>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">TravelEase</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mt-2 max-w-xs">
              We craft seamless journeys for curious explorers. From curated
              itineraries to on-call travel support, TravelEase elevates every
              trip with local insight and human-first planning.
            </p>
          </div>

          {/* Explore Column */}
          <div className="flex flex-col gap-4">
            <h4 className="text-gray-900 font-semibold tracking-wide">Explore</h4>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <Link to="/blogs" className="text-gray-500 hover:text-primary-red transition-colors">
                  Blog Stories
                </Link>
              </li>
              <li>
                <Link to="/travel_spots_page" className="text-gray-500 hover:text-primary-red transition-colors">
                  Featured Spots
                </Link>
              </li>
              <li>
                <Link to="/map" className="text-gray-500 hover:text-primary-red transition-colors">
                  Interactive Map
                </Link>
              </li>
              <li>
                <Link to="/plans" className="text-gray-500 hover:text-primary-red transition-colors">
                  Plan a Trip
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="flex flex-col gap-4">
            <h4 className="text-gray-900 font-semibold tracking-wide">Resources</h4>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <Link to="/about" className="text-gray-500 hover:text-primary-red transition-colors">
                  About TravelEase
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-500 hover:text-primary-red transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-500 hover:text-primary-red transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-500 hover:text-primary-red transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="flex flex-col gap-4">
            <h4 className="text-gray-900 font-semibold tracking-wide">Contact</h4>
            <ul className="flex flex-col gap-3 text-sm text-gray-500">
              <li>
                <a href="mailto:hello@travelease.com" className="hover:text-primary-red transition-colors">
                  hello@travelease.com
                </a>
              </li>
              <li>
                <p>+1 (234) 567-890</p>
              </li>
              <li className="pt-2">
                <p>123 Travel Street</p>
                <p>San Francisco, CA 94103</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Border & Copyright */}
        <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} TravelEase. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
