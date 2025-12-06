import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface NavItem {
  label: string;
  path: string;
}

// Nav items for guests (not logged in)
const guestNavItems: NavItem[] = [
  { label: "Blogs", path: "/blogs" },
];

// Nav items for authenticated users - order: Travel Plans, Map, Travel Spots, Blogs
const authNavItems: NavItem[] = [
  { label: "Travel Plans", path: "/plans" },
  { label: "Map", path: "/map" },
  { label: "Travel Spots", path: "/travel_spots_page" },
  { label: "Blogs", path: "/blogs" },
];

const isEditorEnabled = () => {
  return import.meta.env.VITE_ENABLE_EDITOR === "true";
};

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading, isGoogleAuth } = useAuth();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const isActive = (path: string) => {
    if (path === "/blogs") {
      // Blogs is active for /blogs routes
      return location.pathname === "/blogs" || location.pathname.startsWith("/blogs/");
    }
    if (path === "/plans") {
      return location.pathname === "/" || location.pathname === "/plans" || location.pathname.startsWith("/planner/");
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // Build nav items based on auth state
  const navItems = user ? authNavItems : guestNavItems;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Primary navigation"
      >
        {/* Logo - always goes to home (blogs) */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 text-lg font-bold text-gray-900 transition-opacity hover:opacity-80"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-red text-sm font-bold text-white">
            TE
          </span>
          <span className="hidden sm:inline">TravelEase</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? "text-primary-red"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              aria-current={isActive(item.path) ? "page" : undefined}
            >
              {item.label}
              {isActive(item.path) && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary-red" />
              )}
            </Link>
          ))}
        </div>

        {/* Desktop Right Actions */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Guest Actions */}
          {!user && !loading && (
            <>
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-primary-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-red-dark"
              >
                Sign up
              </Link>
            </>
          )}

          {/* Loading State */}
          {loading && (
            <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
          )}

          {/* Authenticated Actions */}
          {user && !loading && (
            <div className="flex items-center gap-2">
              {/* Publish (for Google users with editor enabled) */}
              {isEditorEnabled() && isGoogleAuth && (
                <Link
                  to="/blogs/new"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  Publish
                </Link>
              )}

              {/* Profile Avatar */}
              <Link
                to="/profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-red text-sm font-semibold text-white ring-2 ring-white transition-shadow hover:ring-primary-red/30"
                title="View Profile"
              >
                {(user.firstName || user.email)?.charAt(0).toUpperCase() || "U"}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`border-t border-gray-100 bg-white md:hidden ${isMenuOpen ? "block" : "hidden"}`}
      >
        <div className="space-y-1 px-4 pb-4 pt-2">
          {/* Navigation Links */}
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                isActive(item.path)
                  ? "bg-primary-red/5 text-primary-red"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              aria-current={isActive(item.path) ? "page" : undefined}
            >
              <span>{item.label}</span>
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}

          {/* Divider */}
          <div className="my-2 border-t border-gray-100" />

          {/* Guest Actions */}
          {!user && !loading && (
            <div className="mt-2 flex gap-2">
              <Link
                to="/login"
                className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-center text-base font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="flex-1 rounded-lg bg-primary-red px-4 py-3 text-center text-base font-medium text-white transition-colors hover:bg-primary-red-dark"
              >
                Sign up
              </Link>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
            </div>
          )}

          {/* Authenticated User Section */}
          {user && !loading && (
            <div className="mt-2 space-y-2">
              {/* User Info */}
              <Link
                to="/profile"
                className="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-red text-sm font-semibold text-white">
                  {(user.firstName || user.email)?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
                <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Publish (for Google users with editor enabled) */}
              {isEditorEnabled() && isGoogleAuth && (
                <Link
                  to="/blogs/new"
                  className="block rounded-lg border border-gray-200 px-4 py-3 text-center text-base font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Publish a Blog
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
