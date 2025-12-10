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
    <main className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Welcome Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-red/20 bg-primary-red/5 px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-primary-red animate-pulse" />
                <span className="text-sm font-medium text-primary-red tracking-wide">
                  Welcome to TravelEase
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Plan Your Perfect <br />
                <span className="text-primary-red">Tagaytay Adventure</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
                Discover local favorites, plan your itinerary, and explore the
                best restaurants, attractions, and accommodations in Tagaytay.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-primary-red/10 rounded-xl flex items-center justify-center mb-4">
                  <MapIcon className="w-6 h-6 text-primary-red" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">
                  Interactive Map
                </h3>
                <p className="text-sm text-gray-600">
                  Explore businesses and attractions with our live map
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">
                  Trip Planner
                </h3>
                <p className="text-sm text-gray-600">
                  Create and manage your travel itineraries
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">
                  Local Businesses
                </h3>
                <p className="text-sm text-gray-600">
                  Find the best restaurants, hotels & activities
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">
                  Reviews & Ratings
                </h3>
                <p className="text-sm text-gray-600">
                  Read honest reviews from real travelers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Preview Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <MapPreview />
              <p className="text-xs text-gray-500">
                Explore the latest accommodations, restaurants, and attractions
                around Tagaytay. Pins update as new businesses join TravelEase.
              </p>
            </div>

            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <MapIcon className="w-3.5 h-3.5" />
                <span>Interactive Map</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                Discover Local Favorites & <br /> Hidden Gems
              </h2>

              <p className="text-lg text-gray-600 leading-relaxed">
                Explore our interactive map to find the best restaurants,
                attractions, and accommodations. Click on any pin to see
                ratings, reviews, and more details.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link to="/map">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto"
                    leftIcon={<MapIcon className="w-4 h-4" />}
                  >
                    Open Full Map
                  </Button>
                </Link>
                <Link to="/travel_spots_page">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Browse All Spots
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Explore TravelEase
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need for the perfect Tagaytay experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Blogs Card */}
            <Link
              to="/blogs"
              className="group bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1604237233847-0cd10a179521?fm=jpg&q=60&w=800"
                  alt="Travel Stories"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-primary-red" />
                  <span className="text-sm font-medium text-primary-red">
                    Travel Stories
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-red transition-colors">
                  Read Our Blog
                </h3>
                <p className="text-gray-600">
                  Discover curated travel stories, tips, and destination guides
                </p>
              </div>
            </Link>

            {/* Businesses Card */}
            <Link
              to="/businesses"
              className="group bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?fm=jpg&q=60&w=800"
                  alt="Local Businesses"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    Directory
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-red transition-colors">
                  Browse Businesses
                </h3>
                <p className="text-gray-600">
                  Find restaurants, hotels, attractions and more in Tagaytay
                </p>
              </div>
            </Link>

            {/* Travel Plans Card */}
            <Link
              to={isLoggedIn ? "/plans" : "/signup"}
              className="group bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?fm=jpg&q=60&w=800"
                  alt="Plan Your Trip"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">
                    Planner
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-red transition-colors">
                  {isLoggedIn ? "My Travel Plans" : "Start Planning"}
                </h3>
                <p className="text-gray-600">
                  Create personalized itineraries and collaborate with friends
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-cta-soft text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-white/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl mb-6">
            Ready to Explore Tagaytay?
          </h2>
          <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
            Join thousands of travelers who plan their perfect trips with
            TravelEase. Sign up today and start your adventure!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={isLoggedIn ? "/plans" : "/signup"}>
              <Button
                variant="secondary"
                size="lg"
                className="!rounded-md bg-white text-primary-red hover:bg-gray-100 border-none shadow-lg"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                {isLoggedIn ? "Go to My Plans" : "Sign Up Free"}
              </Button>
            </Link>
            <Link to="/businesses">
              <Button
                variant="outline"
                size="lg"
                className="!rounded-md border-white text-white hover:bg-white hover:text-primary-red"
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
