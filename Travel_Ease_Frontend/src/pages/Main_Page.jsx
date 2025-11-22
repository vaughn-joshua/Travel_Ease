import { useState } from "react";
import Create_Plan from "../component/main_page/Create_Plan.jsx";
import Upcoming_Plans from "../component/main_page/Upcoming_Plans.jsx";
import Ongoing_Plans from "../component/main_page/Ongoing_Plans.jsx";
import Previous_Plans from "../component/main_page/Previous_Plans.jsx";
import Public_Plans from "../component/main_page/Public_Plans.jsx";
import Quick_Join from "../component/main_page/Quick_Join";
import Plan_Modal from "../component/main_page/Plan_Modal.jsx";
import Navbar from "../component/shared/Navbar";
import Footer from "../component/shared/Footer";

function Main_Page() {
  const [activeModal, setActiveModal] = useState("");
  const [results, setResults] = useState([]);

  const handle_close = () => {
    window.location.reload();
    console.log("closing na");
    setActiveModal("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* LEFT SIDE */}
          <div className="flex-1 lg:flex-[3]">
            <div id="ongoing_plans">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  Ongoing Plans
                </h3>
                <button
                  onClick={() => setActiveModal("create")}
                  className="px-4 sm:px-5 py-2.5 bg-[#E10600] text-white text-xs sm:text-sm font-semibold tracking-wide uppercase rounded-lg hover:bg-[#B80500] transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Create Plan</span>
                  <span className="sm:hidden">Create</span>
                </button>
              </div>
              <Ongoing_Plans />
            </div>

            <div className="mt-6">
              <Upcoming_Plans />
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex-1 lg:flex-1">
            <div className="">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  Suggested Plans
                </h3>
                <button
                  onClick={() => setActiveModal("join")}
                  className="px-4 sm:px-5 py-2.5 bg-[#E10600] text-white text-xs sm:text-sm font-semibold tracking-wide uppercase rounded-lg hover:bg-[#B80500] transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="hidden sm:inline">Quick Join</span>
                  <span className="sm:hidden">Join</span>
                </button>
              </div>
              <Public_Plans />
            </div>

            <div className="mt-6">
              <Previous_Plans />
            </div>
          </div>
        </div>

        {activeModal === "join" && (
          <Quick_Join
            on_close={(result) => {
              setActiveModal("quick");
              if (result.length > 0) {
                setResults(result);
              } else {
                setActiveModal("");
              }
            }}
          />
        )}
        {activeModal === "create" && <Create_Plan on_close={handle_close} />}
        {activeModal === "quick" && (
          <Plan_Modal results={results} on_close={() => setActiveModal("")} />
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Main_Page;
