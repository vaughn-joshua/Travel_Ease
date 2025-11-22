import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: "/map", label: "Map" },
    { path: "/spots", label: "Spots" },
    { path: "/blogs", label: "Blogs" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-[#E10600] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-base sm:text-lg lg:text-xl">TE</span>
            </div>
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">TravelEase</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium tracking-wide transition-colors min-h-[44px] flex items-center ${
                  isActive(link.path)
                    ? "text-[#E10600] border-b-2 border-[#E10600] pb-1"
                    : "text-gray-700 hover:text-[#E10600]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <Link
              to="/"
              className="px-4 lg:px-5 py-2 bg-[#E10600] text-white text-xs lg:text-sm font-semibold tracking-wider uppercase rounded-lg hover:bg-[#B80500] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2 min-h-[44px] flex items-center"
            >
              Plan With Us
            </Link>
            <Link
              to="/blogs"
              className="px-4 lg:px-5 py-2 border-2 border-[#E10600] text-[#E10600] text-xs lg:text-sm font-semibold tracking-wider uppercase rounded-lg hover:bg-[#E10600] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2 min-h-[44px] flex items-center"
            >
              Explore Blogs
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E10600] min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 mt-2 pt-4">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] flex items-center ${
                    isActive(link.path)
                      ? "bg-[#E10600] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-3 pt-2 border-t border-gray-200">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 bg-[#E10600] text-white text-center font-semibold tracking-wider uppercase rounded-lg hover:bg-[#B80500] transition-colors min-h-[44px] flex items-center justify-center"
                >
                  Plan With Us
                </Link>
                <Link
                  to="/blogs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 border-2 border-[#E10600] text-[#E10600] text-center font-semibold tracking-wider uppercase rounded-lg hover:bg-[#E10600] hover:text-white transition-colors min-h-[44px] flex items-center justify-center"
                >
                  Explore Blogs
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

