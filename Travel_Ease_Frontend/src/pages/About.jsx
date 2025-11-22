import Navbar from "../component/shared/Navbar";
import Footer from "../component/shared/Footer";

function About() {
  const teamMembers = [
    {
      name: "Sarah Chen",
      role: "Founder & CEO",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
      bio: "Travel enthusiast with 15+ years of experience curating unforgettable journeys.",
    },
    {
      name: "Mike Rodriguez",
      role: "Head of Operations",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
      bio: "Expert in logistics and ensuring seamless travel experiences.",
    },
    {
      name: "Lisa Park",
      role: "Travel Strategist",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
      bio: "Specializes in creating personalized itineraries for unique adventures.",
    },
  ];

  const values = [
    {
      icon: "🌍",
      title: "Global Perspective",
      description: "We believe in connecting travelers with authentic local experiences that respect and celebrate diverse cultures.",
    },
    {
      icon: "✨",
      title: "Personalized Service",
      description: "Every journey is unique. We craft tailored experiences that match your travel style and preferences.",
    },
    {
      icon: "🤝",
      title: "Local Partnerships",
      description: "We work directly with local experts and businesses to ensure authentic and sustainable travel experiences.",
    },
    {
      icon: "💡",
      title: "Innovation",
      description: "We continuously evolve our services and tools to make travel planning easier and more enjoyable.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[500px] sm:h-[600px] lg:h-[700px] overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1920&q=80)",
          }}
        >
          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60"></div>

          {/* Blurred Light Blobs */}
          <div className="absolute top-10 left-10 sm:top-20 sm:left-20 w-48 h-48 sm:w-96 sm:h-96 bg-white/10 blur-blob"></div>
          <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-48 h-48 sm:w-96 sm:h-96 bg-[#E10600]/20 blur-blob"></div>
        </div>

        {/* Glass Card Content */}
        <div className="relative h-full flex items-center justify-center px-4 py-8 sm:py-4">
          <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 max-w-4xl w-full shadow-2xl">
            <div className="text-center">
              <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-[#E10600] text-white text-xs font-bold tracking-widest uppercase rounded-full mb-3 sm:mb-4">
                ABOUT TRAVELEASE
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
                Crafting Seamless Journeys for Curious Explorers
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-700 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
                We're a team of travel enthusiasts dedicated to making your adventures unforgettable through curated itineraries, expert support, and local insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#E10600] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-lg hover:bg-[#B80500] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2 min-h-[44px]">
                  OUR STORY
                </button>
                <button className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-[#E10600] text-[#E10600] text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-lg hover:bg-[#E10600] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2 min-h-[44px]">
                  MEET THE TEAM
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Trio */}
        <div className="absolute bottom-4 sm:bottom-8 left-0 right-0 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: "YEARS OF EXPERIENCE", value: "10+ Years" },
              { label: "HAPPY TRAVELERS", value: "50k+ Clients" },
              { label: "DESTINATIONS COVERED", value: "100+ Countries" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-white/90 backdrop-blur-md rounded-xl p-4 sm:p-6 text-center"
              >
                <div className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-2">
                  {stat.label}
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-12 sm:py-16 lg:py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-[#E10600] text-white text-xs font-bold tracking-widest uppercase rounded-full mb-3 sm:mb-4">
                OUR STORY
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                Born from a Passion for Travel
              </h2>
              <div className="space-y-3 sm:space-y-4 text-gray-600 text-sm sm:text-base leading-relaxed">
                <p>
                  TravelEase was founded in 2015 with a simple mission: to make travel planning effortless and journeys unforgettable. What started as a small team of travel enthusiasts has grown into a trusted partner for thousands of explorers worldwide.
                </p>
                <p>
                  We believe that every trip should be more than just a vacation—it should be a transformative experience. That's why we combine local expertise, personalized service, and innovative tools to create journeys that match your unique travel style.
                </p>
                <p>
                  Our team of travel strategists works directly with local partners in destinations around the world, ensuring authentic experiences while supporting sustainable tourism practices.
                </p>
              </div>
            </div>
            <div className="relative order-first lg:order-last">
              <img
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80"
                alt="Travel team"
                className="rounded-2xl sm:rounded-3xl shadow-xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 sm:py-16 lg:py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-[#E10600] text-white text-xs font-bold tracking-widest uppercase rounded-full mb-3 sm:mb-4">
              OUR VALUES
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              What Drives Us
            </h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-2">
              These core values guide everything we do and shape how we serve our travelers.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {values.map((value, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{value.icon}</div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{value.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 sm:py-16 lg:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-[#E10600] text-white text-xs font-bold tracking-widest uppercase rounded-full mb-3 sm:mb-4">
              MEET THE TEAM
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              The People Behind TravelEase
            </h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-2">
              Our passionate team of travel experts is dedicated to making your journeys extraordinary.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {teamMembers.map((member, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-[#E10600] font-semibold text-sm mb-3 uppercase tracking-wide">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg px-2">
            Let our team of travel experts help you plan your next unforgettable adventure.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#E10600] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-lg hover:bg-[#B80500] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2 min-h-[44px]">
              Plan With Us
            </button>
            <button className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-[#E10600] text-[#E10600] text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-lg hover:bg-[#E10600] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2 min-h-[44px]">
              Explore Blogs
            </button>
          </div>
        </div>
      </section>

      {/* Subscribe Section */}
      <section className="bg-[#E10600] py-12 sm:py-16 lg:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
            Stay Connected with TravelEase
          </h2>
          <p className="text-white/90 mb-6 sm:mb-8 text-base sm:text-lg px-2">
            Join our community to receive travel tips, destination spotlights, and exclusive offers from our team.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 border-2 border-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#E10600] shadow-sm text-sm sm:text-base min-h-[44px]"
              aria-label="Email address"
            />
            <button className="px-5 sm:px-6 py-3 bg-white text-[#E10600] font-semibold tracking-wider uppercase rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#E10600] shadow-sm text-sm sm:text-base min-h-[44px] whitespace-nowrap">
              SUBSCRIBE
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default About;

