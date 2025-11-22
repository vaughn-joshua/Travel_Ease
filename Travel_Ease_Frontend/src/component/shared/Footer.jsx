function Footer() {
  return (
    <footer className="bg-white">
      {/* Subscription Band */}
      <div className="bg-[#E10600] py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3">
            Join the TravelEase Community
          </h3>
          <p className="text-white/90 mb-5 sm:mb-6 text-sm lg:text-base px-2">
            Be the first to receive destination spotlights, travel planning checklists, and insider perks crafted by our travel strategists.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="you@example.com"
              className="flex-1 px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 border-2 border-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#E10600] shadow-sm text-sm sm:text-base min-h-[44px]"
              aria-label="Email address"
            />
            <button
              className="px-5 sm:px-6 py-3 bg-white text-[#E10600] font-semibold tracking-wider uppercase rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#E10600] shadow-sm text-sm sm:text-base min-h-[44px] whitespace-nowrap"
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#E10600] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">TE</span>
              </div>
              <span className="text-xl font-bold text-gray-900">TravelEase</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              We craft seamless journeys for curious explorers. From curated itineraries to on-call travel support, TravelEase elevates every trip with local insight and human-first planning.
            </p>
          </div>

          {/* Explore Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 uppercase tracking-wide text-sm">
              Explore
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="/blogs" className="text-gray-600 hover:text-[#E10600] text-sm transition-colors">
                  Blog Stories
                </a>
              </li>
              <li>
                <a href="/spots" className="text-gray-600 hover:text-[#E10600] text-sm transition-colors">
                  Featured Spots
                </a>
              </li>
              <li>
                <a href="/map" className="text-gray-600 hover:text-[#E10600] text-sm transition-colors">
                  Interactive Map
                </a>
              </li>
              <li>
                <a href="/" className="text-gray-600 hover:text-[#E10600] text-sm transition-colors">
                  Plan a Trip
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 uppercase tracking-wide text-sm">
              Resources
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="/about" className="text-gray-600 hover:text-[#E10600] text-sm transition-colors">
                  About TravelEase
                </a>
              </li>
              <li>
                <a href="/faqs" className="text-gray-600 hover:text-[#E10600] text-sm transition-colors">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#E10600] text-sm transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-[#E10600] text-sm transition-colors">
                  Terms & Conditions
                </a>
              </li>
            </ul>
          </div>

          {/* Social Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 uppercase tracking-wide text-sm">
              Follow TravelEase
            </h4>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              Get behind the scenes looks at our scouting trips and meet our local partners.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 bg-[#E10600] rounded-full flex items-center justify-center hover:bg-[#B80500] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-[#E10600] rounded-full flex items-center justify-center hover:bg-[#B80500] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2"
                aria-label="Pinterest"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-[#E10600] rounded-full flex items-center justify-center hover:bg-[#B80500] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-[#E10600] rounded-full flex items-center justify-center hover:bg-[#B80500] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p>© 2025 TravelEase. All rights reserved.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="mailto:hello@travelease.com" className="hover:text-[#E10600] transition-colors">
                hello@travelease.com
              </a>
              <a href="tel:+1234567000" className="hover:text-[#E10600] transition-colors">
                +1 (234) 567-000
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

