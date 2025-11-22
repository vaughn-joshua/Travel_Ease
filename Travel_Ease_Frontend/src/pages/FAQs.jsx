import { useState } from "react";
import Navbar from "../component/shared/Navbar";
import Footer from "../component/shared/Footer";

function AccordionItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full py-4 sm:py-6 px-3 sm:px-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-inset min-h-[44px]"
        aria-expanded={isOpen}
      >
        <span className="text-base sm:text-lg font-semibold text-gray-900 pr-4 sm:pr-8 flex-1">{question}</span>
        <svg
          className={`w-5 h-5 sm:w-6 sm:h-6 text-[#E10600] flex-shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="px-3 sm:px-4 pb-4 sm:pb-6">
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

function FAQs() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqCategories = [
    {
      category: "Planning",
      faqs: [
        {
          question: "How far in advance should I book my trip?",
          answer: "We recommend booking at least 2-3 months in advance for international trips to secure the best rates and availability. For peak travel seasons or popular destinations, booking 4-6 months ahead is ideal. However, we can also help with last-minute travel arrangements.",
        },
        {
          question: "Can you help with custom itineraries?",
          answer: "Absolutely! Our travel strategists specialize in creating personalized itineraries tailored to your interests, budget, and travel style. We'll work with you to design a unique journey that matches your preferences perfectly.",
        },
        {
          question: "What destinations do you cover?",
          answer: "We cover destinations worldwide, from popular tourist spots to hidden gems. Our network includes over 100 countries across all continents. If you have a specific destination in mind, we can help you plan your trip there.",
        },
      ],
    },
    {
      category: "Booking",
      faqs: [
        {
          question: "How do I make a booking?",
          answer: "You can start by clicking 'Plan With Us' in the navigation, or contact us directly through our contact form. Our team will reach out within 24 hours to discuss your travel needs and begin planning your journey.",
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards, bank transfers, and PayPal. Payment plans are available for larger trips. A deposit is typically required to secure your booking, with the balance due before departure.",
        },
        {
          question: "Can I modify or cancel my booking?",
          answer: "Yes, modifications and cancellations are possible depending on the terms of your booking. Cancellation policies vary by destination and service provider. We'll clearly communicate all terms before you confirm your booking, and we're here to help navigate any changes you need.",
        },
      ],
    },
    {
      category: "Support",
      faqs: [
        {
          question: "Do you provide 24/7 support during my trip?",
          answer: "Yes! We offer on-call travel support during your trip. Our team is available to assist with any issues, changes, or questions that arise while you're traveling. You'll receive a dedicated contact number before your departure.",
        },
        {
          question: "What if something goes wrong during my trip?",
          answer: "Our support team is available to help resolve any issues that may arise. We work with trusted local partners and can assist with everything from accommodation changes to emergency situations. We also recommend travel insurance for additional protection.",
        },
        {
          question: "How do I contact customer service?",
          answer: "You can reach us via email at hello@travelease.com, phone at +1 (234) 567-000, or through our contact form. Our team typically responds within 24 hours, and we offer priority support for active travelers.",
        },
      ],
    },
    {
      category: "Services",
      faqs: [
        {
          question: "What services are included in your travel planning?",
          answer: "Our services include itinerary planning, accommodation booking, activity recommendations, restaurant reservations, transportation arrangements, and ongoing travel support. We can also arrange special experiences, group travel, and corporate trips.",
        },
        {
          question: "Do you offer group travel planning?",
          answer: "Yes, we specialize in group travel planning for families, friends, and corporate groups. We can coordinate accommodations, activities, and logistics for groups of any size, ensuring everyone has an amazing experience.",
        },
        {
          question: "Can you help with visa applications?",
          answer: "While we don't process visas directly, we provide guidance on visa requirements for your destinations and can recommend trusted visa processing services. We'll ensure you have all the information needed for your visa application.",
        },
      ],
    },
  ];

  const toggleFAQ = (categoryIndex, faqIndex) => {
    const newIndex = categoryIndex * 10 + faqIndex;
    setOpenIndex(openIndex === newIndex ? null : newIndex);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[500px] sm:h-[600px] lg:h-[700px] overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80)",
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
                FAQs
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
                Frequently Asked Questions
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-700 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
                Find answers to common questions about our services, booking process, and travel planning. Can't find what you're looking for? Contact us directly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#E10600] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-lg hover:bg-[#B80500] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2 min-h-[44px]">
                  CONTACT US
                </button>
                <button className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-[#E10600] text-[#E10600] text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-lg hover:bg-[#E10600] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2 min-h-[44px]">
                  START PLANNING
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Trio */}
        <div className="absolute bottom-4 sm:bottom-8 left-0 right-0 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: "QUESTIONS ANSWERED", value: "500+ FAQs" },
              { label: "RESPONSE TIME", value: "< 24 Hours" },
              { label: "SATISFACTION RATE", value: "98% Happy" },
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

      {/* FAQ Sections */}
      <section className="py-12 sm:py-16 lg:py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">
                {category.category}
              </h2>
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                {category.faqs.map((faq, faqIndex) => (
                  <AccordionItem
                    key={faqIndex}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openIndex === categoryIndex * 10 + faqIndex}
                    onToggle={() => toggleFAQ(categoryIndex, faqIndex)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Band */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Still Have Questions?
          </h2>
          <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg px-2">
            Our travel experts are here to help. Reach out and we'll get back to you within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <a
              href="mailto:hello@travelease.com"
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#E10600] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-lg hover:bg-[#B80500] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2 inline-block text-center min-h-[44px] flex items-center justify-center"
            >
              Email Us
            </a>
            <a
              href="tel:+1234567000"
              className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-[#E10600] text-[#E10600] text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-lg hover:bg-[#E10600] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2 inline-block text-center min-h-[44px] flex items-center justify-center"
            >
              Call Us
            </a>
          </div>
        </div>
      </section>

      {/* Subscribe Section */}
      <section className="bg-[#E10600] py-12 sm:py-16 lg:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
            Stay Updated with Travel Tips
          </h2>
          <p className="text-white/90 mb-6 sm:mb-8 text-base sm:text-lg px-2">
            Subscribe to receive helpful travel planning tips, destination guides, and answers to common questions.
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

export default FAQs;

