import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  description?: string;
}

const navItems: NavItem[] = [
  {
    label: "Home",
    path: "/",
    description: "Back to dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Travel Spots",
    path: "/travel_spots_page",
    description: "Discover places",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Blogs",
    path: "/blogs",
    description: "Travel stories",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    label: "Businesses",
    path: "/businesses",
    description: "Local services",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export default function MapNavMenu(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menu on ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div ref={menuRef} className="absolute top-4 left-4 z-[9999]">
      {/* Main circular button - refined glass effect */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative w-12 h-12 rounded-2xl
          backdrop-blur-xl
          shadow-lg
          border
          flex items-center justify-center
          transition-colors duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 focus:ring-offset-transparent
          ${isOpen 
            ? "bg-primary-red text-white border-primary-red shadow-primary-red/30 scale-105" 
            : "bg-white/90 text-gray-700 border-white/60 shadow-black/15 hover:bg-white shadow-sm hover:shadow-md "
          }
        `}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <span className={`
          transition-colors duration-200
          ${isOpen ? "rotate-180 opacity-0 scale-0" : "rotate-0 opacity-100 scale-100"}
          absolute
        `}>
          <span className="text-lg font-bold bg-gradient-to-br from-primary-red to-primary-red-dark bg-clip-text text-transparent">
            TE
          </span>
        </span>
        <span className={`
          transition-colors duration-200
          ${isOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-180 opacity-0 scale-0"}
          absolute
        `}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      </button>

      {/* Dropdown menu with refined glass morphism */}
      <div
        className={`
          absolute top-14 left-0
          bg-white/95 backdrop-blur-2xl
          rounded-2xl
          shadow-2xl shadow-black/20
          border border-white/60
          overflow-hidden
          transition-colors duration-200 ease-out origin-top-left
          ${isOpen 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          }
        `}
        style={{ minWidth: "220px" }}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-primary-red/5 to-transparent border-b border-gray-100/80">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</p>
        </div>

        {/* Navigation items */}
        <nav className="p-2">
          {navItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className="
                group flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-gray-700
                hover:bg-primary-red/10 hover:text-primary-red
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-primary-red/30 focus:bg-primary-red/5
              "
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="
                w-9 h-9 rounded-xl
                bg-gray-100 group-hover:bg-primary-red/10
                flex items-center justify-center
                transition-colors duration-200
              ">
                <span className="text-gray-500 group-hover:text-primary-red transition-colors">
                  {item.icon}
                </span>
              </div>
              <div className="flex-1">
                <span className="font-medium text-sm block">{item.label}</span>
                {item.description && (
                  <span className="text-xs text-gray-400 group-hover:text-primary-red/60">{item.description}</span>
                )}
              </div>
              <svg 
                className="w-4 h-4 text-gray-300 group-hover:text-primary-red group-hover:translate-x-0.5 transition-colors opacity-0 group-hover:opacity-100" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4" />

        {/* User section */}
        <div className="p-2">
          {user ? (
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="
                group flex items-center gap-3 px-3 py-2.5 rounded-xl
                hover:bg-gray-100
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-primary-red/30
              "
            >
              <div className="
                w-9 h-9 rounded-xl
                bg-gradient-to-br from-primary-red to-primary-red-dark
                text-white
                flex items-center justify-center
                text-sm font-semibold
                shadow-sm shadow-primary-red/30
              ">
                {(user.firstName || user.email)?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900 block truncate">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-xs text-gray-400 truncate block">
                  {user.email}
                </span>
              </div>
            </Link>
          ) : (
            <div className="space-y-1">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="
                  flex items-center gap-3 px-3 py-2.5 rounded-xl
                  text-gray-700
                  hover:bg-gray-100
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary-red/30
                "
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="font-medium text-sm">Log in</span>
              </Link>
              <Link
                to="/signup"
                onClick={() => setIsOpen(false)}
                className="
                  flex items-center gap-3 px-3 py-2.5 rounded-xl
                  bg-primary-red text-white
                  hover:bg-primary-red-dark
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2
                "
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <span className="font-medium text-sm">Sign up</span>
              </Link>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1.5">
            Press
            <kbd className="px-1.5 py-0.5 bg-white rounded shadow-sm text-gray-500 font-mono text-[10px] border border-gray-200">ESC</kbd>
            to close
          </p>
        </div>
      </div>
    </div>
  );
}
