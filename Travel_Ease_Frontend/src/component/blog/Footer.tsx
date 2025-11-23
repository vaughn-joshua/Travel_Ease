import React from "react";
import { Link } from "react-router-dom";

const socialLinks = [
  {
    name: "Instagram",
    href: "https://instagram.com",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="4" ry="4" />
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
        <circle cx="17.5" cy="6.5" r="0.75" />
      </svg>
    ),
  },
  {
    name: "Pinterest",
    href: "https://pinterest.com",
    icon: (
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12.04 2C7.06 2 4 5.55 4 9.38c0 1.79.96 4 2.49 4.7.23.11.36.06.42-.16.04-.17.25-1.01.34-1.4a.38.38 0 00-.09-.34c-.51-.62-.83-1.43-.83-2.58 0-3.31 2.48-6.27 6.47-6.27 3.54 0 5.49 2.16 5.49 5.05 0 3.8-1.66 7-4.13 7-1.36 0-2.37-1.13-2.05-2.52.39-1.66 1.13-3.44 1.13-4.63 0-1.07-.57-1.97-1.75-1.97-1.39 0-2.5 1.44-2.5 3.37 0 1.23.42 2.06.42 2.06s-1.43 6.09-1.68 7.15c-.5 2.11-.08 4.69-.04 4.95.02.13.19.17.27.07.11-.15 1.54-2.44 2.02-4.51.14-.59.79-2.94.79-2.94.41.8 1.61 1.5 2.89 1.5 3.81 0 6.37-3.4 6.37-7.98C20 5.11 16.8 2 12.04 2z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
    icon: (
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M20.447 20.452H16.9v-4.99c0-1.19-.024-2.719-1.657-2.719-1.66 0-1.914 1.296-1.914 2.631v5.078H9.782V9.75h3.4v1.465h.049c.474-.9 1.632-1.848 3.357-1.848 3.59 0 4.255 2.364 4.255 5.438v5.647zM5.337 8.284a1.968 1.968 0 110-3.936 1.968 1.968 0 010 3.936zM7.119 20.452H3.554V9.75h3.565v10.702z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://youtube.com",
    icon: (
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M21.8 8.001a2.508 2.508 0 00-1.76-1.773C18.456 6 12 6 12 6s-6.456 0-8.04.228A2.508 2.508 0 002.2 8.001 26.29 26.29 0 002 11.998a26.29 26.29 0 00.2 3.997 2.508 2.508 0 001.76 1.773C5.544 18 12 18 12 18s6.456 0 8.04-.228a2.508 2.508 0 001.76-1.773 26.29 26.29 0 00.2-3.997 26.29 26.29 0 00-.2-3.997zM10 14.5v-5l4.5 2.5L10 14.5z" />
      </svg>
    ),
  },
];

const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-gray-700">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-primary-red px-6 py-8 text-white shadow-lg shadow-primary-red/15 sm:px-10 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Join the TravelEase Community
            </h2>
            <p className="mt-3 text-white/90">
              Be the first to receive destination spotlights, travel planning
              checklists, and insider perks crafted by our travel strategists.
            </p>
          </div>
          <form
            className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:mt-0 lg:w-auto"
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
              className="w-full rounded-lg border border-transparent bg-white px-4 py-3 text-base text-gray-900 placeholder-primary-red/60 focus:border-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-red sm:max-w-xs"
            />
            <button
              type="submit"
              className="w-full rounded-lg border border-white bg-white px-5 py-3 text-sm font-semibold uppercase tracking-wide text-primary-red transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-red sm:w-auto"
            >
              Subscribe
            </button>
          </form>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-red text-white font-semibold">
                TE
              </span>
              <span className="text-lg font-semibold text-primary-red">
                TravelEase
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              We craft seamless journeys for curious explorers. From curated
              itineraries to on-call travel support, TravelEase elevates every
              trip with local insight and human-first planning.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-red">
              Explore
            </h3>
            <ul className="mt-5 space-y-3 text-sm font-medium">
              <li>
                <Link className="transition hover:text-primary-red" to="/blogs">
                  Blog Stories
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-primary-red" to="/spots">
                  Featured Spots
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-primary-red" to="/map">
                  Interactive Map
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-primary-red" to="/contact">
                  Plan a Trip
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-red">
              Resources
            </h3>
            <ul className="mt-5 space-y-3 text-sm font-medium">
              <li>
                <Link className="transition hover:text-primary-red" to="/about">
                  About TravelEase
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-primary-red" to="/faqs">
                  FAQs
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-primary-red" to="/privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-primary-red" to="/terms">
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-red">
              Follow TravelEase
            </h3>
            <p className="mt-5 text-sm text-gray-600">
              Get behind-the-scenes looks at our scouting trips and meet our
              local partners.
            </p>
            <div className="mt-4 flex gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-red/40 text-primary-red transition hover:border-primary-red hover:bg-primary-red hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-red focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.name}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-primary-red/15 pt-6 text-sm text-gray-500 sm:flex sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} TravelEase. All rights reserved.</p>
          <div className="mt-3 flex gap-6 sm:mt-0">
            <a className="hover:text-primary-red" href="mailto:hello@travelease.com">
              hello@travelease.com
            </a>
            <a className="hover:text-primary-red" href="tel:+1234567890">
              +1 (234) 567-890
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
