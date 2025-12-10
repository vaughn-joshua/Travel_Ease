import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Menu,
  X,
  Map as MapIcon,
  BookOpen,
  Compass,
  Calendar,
  LogIn,
  UserPlus,
  Briefcase,
  Home,
} from "lucide-react";
import Button from "../ui/Button";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

// Nav items for guests (not logged in) – Home, Blogs, and Travel Spots
const guestNavItems: NavItem[] = [
  { label: "Home", path: "/", icon: <Home className="h-4 w-4" /> },
  { label: "Blogs", path: "/blogs", icon: <BookOpen className="h-4 w-4" /> },
  { label: "Travel Spots", path: "/travel_spots_page", icon: <Compass className="h-4 w-4" /> },
];

// Nav items for authenticated users – order: Travel Plans, Map, Travel Spots, Blogs
const authNavItems: NavItem[] = [
  { label: "Travel Plans", path: "/plans", icon: <Calendar className="h-4 w-4" /> },
  { label: "Map", path: "/map", icon: <MapIcon className="h-4 w-4" /> },
  { label: "Travel Spots", path: "/travel_spots_page", icon: <Compass className="h-4 w-4" /> },
  { label: "Blogs", path: "/blogs", icon: <BookOpen className="h-4 w-4" /> },
];

const isEditorEnabled = () => {
  return import.meta.env.VITE_ENABLE_EDITOR === "true";
};

// ---------------------------------------------------------------------------
// Logo component – inline SVG for crisp rendering, fixed dimensions (no CLS)
// ---------------------------------------------------------------------------
function Logo() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Background rounded square */}
      <rect width="36" height="36" rx="10" fill="currentColor" className="text-primary-red" />
      {/* "TE" text */}
      <text
        x="50%"
        y="54%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        TE
      </text>
    </svg>
  );
}

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading } = useAuth();

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
    // Home route – exact match only for guests
    if (path === "/") {
      return location.pathname === "/";
    }
    // Blogs – exact /blogs or any /blogs/* subpath
    if (path === "/blogs") {
      return location.pathname === "/blogs" || location.pathname.startsWith("/blogs/");
    }
    // Plans – includes / for authenticated users, /plans, and /planner/*
    if (path === "/plans") {
      return (
        location.pathname === "/" ||
        location.pathname === "/plans" ||
        location.pathname.startsWith("/planner/")
      );
    }
    // Default: exact match or starts with path/
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const navItems = user ? authNavItems : guestNavItems;

  return (
    <header className="sticky top-0 z-[1001] border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Primary navigation"
      >
        {/* Logo – fixed size, links to home */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 text-lg font-bold text-gray-900 transition-opacity hover:opacity-80"
          aria-label="TravelEase home"
        >
          <Logo />
          <span className="hidden font-semibold tracking-tight sm:inline">TravelEase</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-red/5 text-primary-red"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={active ? "text-primary-red" : "text-gray-400 group-hover:text-gray-600"}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop Right Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Guest Actions */}
          {!user && !loading && (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" leftIcon={<LogIn className="h-4 w-4" />}>
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm" leftIcon={<UserPlus className="h-4 w-4" />}>
                  Sign up
                </Button>
              </Link>
            </>
          )}

          {/* Loading State */}
          {loading && <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />}

          {/* Authenticated Actions */}
          {user && !loading && (
            <div className="flex items-center gap-3">
              {/* Publish (for authenticated users with editor enabled) */}
              {isEditorEnabled() && user && (
                <Link to="/blogs/new">
                  <Button variant="outline" size="sm" leftIcon={<Briefcase className="h-4 w-4" />}>
                    Publish
                  </Button>
                </Link>
              )}

              {/* Profile Avatar */}
              <Link
                to="/profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-red text-sm font-semibold text-white shadow-sm ring-2 ring-white transition-shadow hover:ring-primary-red/30"
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
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`border-t border-gray-100 bg-white md:hidden ${isMenuOpen ? "block" : "hidden"}`}
      >
        <div className="space-y-1 px-4 pb-4 pt-2">
          {/* Navigation Links */}
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                  active ? "bg-primary-red/5 text-primary-red" : "text-gray-700 hover:bg-gray-50"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className={active ? "text-primary-red" : "text-gray-400"}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-2 border-t border-gray-100" />

          {/* Guest Actions */}
          {!user && !loading && (
            <div className="mt-4 flex flex-col gap-3">
              <Link to="/login" className="w-full">
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  leftIcon={<LogIn className="h-4 w-4" />}
                >
                  Log in
                </Button>
              </Link>
              <Link to="/signup" className="w-full">
                <Button
                  variant="primary"
                  className="w-full justify-center"
                  leftIcon={<UserPlus className="h-4 w-4" />}
                >
                  Sign up
                </Button>
              </Link>
            </div>
          )}

          {/* Authenticated User Section */}
          {user && !loading && (
            <div className="mt-2 space-y-2">
              <Link
                to="/profile"
                className="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-red text-sm font-semibold text-white shadow-sm">
                  {(user.firstName || user.email)?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
              </Link>

              {isEditorEnabled() && user && (
                <Link to="/blogs/new" className="mt-2 block">
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    leftIcon={<Briefcase className="h-4 w-4" />}
                  >
                    Publish a Blog
                  </Button>
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
