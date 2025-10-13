import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: "Map", path: "/map" },
  { label: "Spots", path: "/spots" },
  { label: "Blogs", path: "/blogs" },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/blogs") {
      return location.pathname === "/blogs" || location.pathname === "/";
    }
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 shadow-sm backdrop-blur-lg">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 text-sm text-gray-800 sm:px-6 lg:px-8"
        aria-label="Primary navigation"
      >
        <Link
          to="/"
          className="flex items-center gap-3 rounded-full border border-transparent bg-white/70 px-3 py-1 text-base font-semibold text-gray-900 transition hover:border-primary-red/30 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-red focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-red to-primary-red-dark text-white">
            TE
          </span>
          <span>TravelEase</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative px-3 py-2 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-red focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                isActive(item.path)
                  ? "text-primary-red"
                  : "text-gray-700 hover:text-primary-red"
              }`}
              aria-current={isActive(item.path) ? "page" : undefined}
            >
              {item.label}
              {isActive(item.path) && (
                <span className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-primary-red" />
              )}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/contact" className="btn-secondary">
            Plan With Us
          </Link>
          <a href="#featured-blogs" className="btn-primary">
            Explore Blogs
          </a>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-red focus-visible:ring-offset-2 focus-visible:ring-offset-white md:hidden"
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </nav>

        <div
          id="primary-navigation"
          className={`md:hidden ${isMenuOpen ? "block" : "hidden"}`}
        >
          <div className="space-y-2 bg-white px-4 pb-6 pt-4 shadow-sm shadow-primary-red/10 sm:px-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-base font-semibold transition ${
                  isActive(item.path)
                    ? "border-primary-red text-primary-red bg-white"
                    : "border-primary-red/20 text-gray-700 hover:border-primary-red hover:text-primary-red"
                }`}
              aria-current={isActive(item.path) ? "page" : undefined}
            >
              <span>{item.label}</span>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ))}

          <div className="flex flex-col gap-2 pt-2">
            <Link to="/contact" className="btn-secondary text-center">
              Plan With Us
            </Link>
            <a href="#featured-blogs" className="btn-primary text-center">
              Explore Blogs
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
