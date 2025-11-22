import Navbar from "../component/shared/Navbar";
import Footer from "../component/shared/Footer";

function Blogs() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Maintenance Message */}
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <svg
              className="w-24 h-24 mx-auto text-[#E10600] mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Under Maintenance
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            We're currently working on something amazing! Our blogs section will be back soon with inspiring travel stories and expert tips.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="px-8 py-3 bg-[#E10600] text-white font-semibold tracking-wider uppercase rounded-lg hover:bg-[#B80500] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2"
            >
              Return Home
            </a>
            <a
              href="/map"
              className="px-8 py-3 border-2 border-[#E10600] text-[#E10600] font-semibold tracking-wider uppercase rounded-lg hover:bg-[#E10600] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2"
            >
              Explore Map
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Blogs;
