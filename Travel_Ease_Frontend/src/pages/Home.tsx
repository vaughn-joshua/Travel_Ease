import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import MapPreview from "../components/blog/MapPreview";
import {
  ArrowRight,
  Map as MapIcon,
  BookOpen,
  Users,
  Calendar,
  Star,
  Building2,
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  return (
    <main className="bg-white text-gray-900 font-sans">
      {/* Hero Section */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Left Content */}
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-primary-red" />
              <span className="text-sm font-medium text-gray-600 tracking-wide">
                Welcome to TravelEase
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1]">
              Plan Your Perfect <br />
              <span className="text-primary-red">Tagaytay Adventure</span>
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              Discover local favorites, plan your itinerary, and explore the
              best restaurants, attractions, and accommodations in Tagaytay.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to={isLoggedIn ? "/plans" : "/signup"}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto min-w-[180px]"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  {isLoggedIn ? "My Travel Plans" : "Get Started Free"}
                </Button>
              </Link>
              <Link to="/blogs">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto min-w-[180px]"
                  leftIcon={<BookOpen className="w-4 h-4" />}
                >
                  Read Travel Stories
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Content - Stats/Features */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary-red/30 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <MapIcon className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                Interactive Map
              </h3>
              <p className="text-sm text-gray-600">
                Explore businesses and attractions with our live map
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary-red/30 hover:bg-gray-50 transition-colors duration-200 cursor-pointer mt-8">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                Trip Planner
              </h3>
              <p className="text-sm text-gray-600">
                Create and manage your travel itineraries
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary-red/30 hover:bg-gray-50 transition-colors duration-200 cursor-pointer -mt-8">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                Local Businesses
              </h3>
              <p className="text-sm text-gray-600">
                Find the best restaurants, hotels & activities
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary-red/30 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                Reviews & Ratings
              </h3>
              <p className="text-sm text-gray-600">
                Read honest reviews from real travelers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Map Preview Section */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6 order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white p-2">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 relative">
                  {/* The actual map component */}
                  <MapPreview />
                </div>
              </div>
              <p className="text-sm text-gray-500 max-w-md">
                Explore the latest accommodations, restaurants, and attractions
                around Tagaytay. Pins update as new businesses join TravelEase.
              </p>
            </div>

            <div className="space-y-8 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-xs font-semibold tracking-wider">
                <MapIcon className="w-4 h-4 text-primary-red" />
                <span>INTERACTIVE MAP</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                Discover Local Favorites <br /> & Hidden Gems
              </h2>

              <p className="text-lg text-gray-600 leading-relaxed">
                Explore our interactive map to find the best restaurants,
                attractions, and accommodations. Click on any pin to see
                ratings, reviews, and more details.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/map">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto min-w-[160px]"
                    leftIcon={<MapIcon className="w-4 h-4" />}
                  >
                    Open Full Map
                  </Button>
                </Link>
                <Link to="/travel_spots_page">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto min-w-[160px]">
                    Browse All Spots
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">
              Explore TravelEase
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need for the perfect Tagaytay experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Link
              to="/blogs"
              className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors duration-200 cursor-pointer"
            >
              <div className="h-56 overflow-hidden bg-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1604237233847-0cd10a179521?fm=jpg&q=80&w=800"
                  alt="Travel Stories"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                />
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary-red transition-colors duration-200">
                  Read Our Blog
                </h3>
                <p className="text-gray-600 text-base flex-1">
                  Discover curated travel stories, tips, and destination guides
                  crafted by our travel strategists.
                </p>
              </div>
            </Link>

            <Link
              to="/businesses"
              className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors duration-200 cursor-pointer"
            >
              <div className="h-56 overflow-hidden bg-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?fm=jpg&q=80&w=800"
                  alt="Local Businesses"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                />
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary-red transition-colors duration-200">
                  Browse Businesses
                </h3>
                <p className="text-gray-600 text-base flex-1">
                  Find restaurants, hotels, attractions and more in Tagaytay.
                  Read honest reviews from real travelers.
                </p>
              </div>
            </Link>

            <Link
              to={isLoggedIn ? "/plans" : "/signup"}
              className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors duration-200 cursor-pointer"
            >
              <div className="h-56 overflow-hidden bg-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?fm=jpg&q=80&w=800"
                  alt="Plan Your Trip"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                />
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary-red transition-colors duration-200">
                  {isLoggedIn ? "My Travel Plans" : "Start Planning"}
                </h3>
                <p className="text-gray-600 text-base flex-1">
                  Create personalized itineraries, collaborate with friends, and
                  make the most out of your trip.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center sm:px-6 lg:px-8 space-y-8">
          <h2 className="text-4xl font-bold sm:text-5xl">
            Ready to Explore Tagaytay?
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Join thousands of travelers who plan their perfect trips with
            TravelEase. Sign up today and start your adventure!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to={isLoggedIn ? "/plans" : "/signup"}>
              <Button
                size="lg"
                className="w-full sm:w-auto min-w-[180px]"
              >
                {isLoggedIn ? "Go to My Plans" : "Sign Up Now"}
              </Button>
            </Link>
            <Link to="/businesses">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto min-w-[180px] border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Explore Businesses
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
