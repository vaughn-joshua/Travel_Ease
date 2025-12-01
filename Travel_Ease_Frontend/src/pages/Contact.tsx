export default function Contact() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      <p className="text-gray-600 mb-8">
        Have questions or feedback? We'd love to hear from you.
      </p>
      <div className="max-w-md">
        <div className="mb-4">
          <h2 className="font-semibold text-lg mb-2">Email</h2>
          <p className="text-gray-600">support@travelease.com</p>
        </div>
        <div className="mb-4">
          <h2 className="font-semibold text-lg mb-2">Location</h2>
          <p className="text-gray-600">Tagaytay City, Philippines</p>
        </div>
      </div>
    </div>
  );
}

