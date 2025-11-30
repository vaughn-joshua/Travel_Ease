import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface NavItem {
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: "Map", path: "/map" },
  { label: "Spots", path: "/travel_spots_page" },
  { label: "Blogs", path: "/blogs" },
];

const isEditorEnabled = () => {
  return import.meta.env.VITE_ENABLE_EDITOR === "true";
};

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading, isConfigured, signInWithGoogle, signOut } = useAuth();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

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
          {isEditorEnabled() && (
            <Link to="/blogs/new" className="btn-secondary text-sm">
              Publish
            </Link>
          )}
          <Link to="/contact" className="btn-secondary">
            Plan With Us
          </Link>
          <a href="#featured-blogs" className="btn-primary">
            Explore Blogs
          </a>

          {!user && (
            <>
              <Link to="/login" className="btn-secondary text-sm">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary text-sm">
                Sign up
              </Link>
            </>
          )}

          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-red text-sm font-medium text-white">
                {(user.firstName || user.email)?.charAt(0).toUpperCase() || "U"}
              </div>
              <button onClick={handleSignOut} className="btn-secondary text-sm">
                Sign Out
              </button>
            </div>
          ) : (
            isConfigured && (
              <button
                onClick={handleSignIn}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>
            )
          )}
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
            {isEditorEnabled() && (
              <Link to="/blogs/new" className="btn-secondary text-center">
                Publish
              </Link>
            )}
            <Link to="/contact" className="btn-secondary text-center">
              Plan With Us
            </Link>
            <a href="#featured-blogs" className="btn-primary text-center">
              Explore Blogs
            </a>

            {!user && (
              <>
                <Link to="/login" className="btn-secondary text-center">
                  Log in
                </Link>
                <Link to="/signup" className="btn-primary text-center">
                  Sign up
                </Link>
              </>
            )}

            {loading ? (
              <div className="flex justify-center py-2">
                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
              </div>
            ) : user ? (
              <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2 px-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-red text-sm font-medium text-white">
                    {(user.firstName || user.email)?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="truncate text-sm text-gray-600">
                    {user.email}
                  </span>
                </div>
                <button onClick={handleSignOut} className="btn-secondary text-center">
                  Sign Out
                </button>
              </div>
            ) : (
              isConfigured && (
                <button
                  onClick={handleSignIn}
                  className="btn-primary mt-2 flex items-center justify-center gap-2"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
