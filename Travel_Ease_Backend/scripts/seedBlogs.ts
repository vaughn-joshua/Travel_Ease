/**
 * Seed script for Blog data
 * Run with: npx tsx scripts/seedBlogs.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleBlogs = [
  {
    title: "Top 10 Hidden Gems in Tagaytay",
    slug: "top-10-hidden-gems-tagaytay",
    excerpt: "Discover the lesser-known spots in Tagaytay that locals love but tourists often miss.",
    content: `<p>Tagaytay is known for its cool climate and stunning views of Taal Volcano, but there's so much more to explore beyond the usual tourist spots.</p>
    <h2>1. Puzzle Mansion</h2>
    <p>Home to the world's largest collection of jigsaw puzzles, this quirky museum is a must-visit for puzzle enthusiasts.</p>
    <h2>2. Sky Ranch</h2>
    <p>While not exactly hidden, the views from the Sky Eye Ferris wheel at sunset are absolutely breathtaking.</p>
    <h2>3. Picnic Grove</h2>
    <p>A perfect spot for family outings with ziplines, horseback riding, and stunning viewpoints.</p>`,
    coverImageUrl: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=75",
    category: "Destinations",
    isFeatured: true,
    readingMinutes: 8,
    author: "TravelEase Team",
  },
  {
    title: "Ultimate Packing Guide for Philippine Adventures",
    slug: "ultimate-packing-guide-philippines",
    excerpt: "Everything you need to pack for your Philippine adventure, from beach essentials to hiking gear.",
    content: `<p>Planning a trip to the Philippines? Here's your comprehensive packing guide to ensure you're prepared for any adventure.</p>
    <h2>Beach Essentials</h2>
    <ul>
      <li>Reef-safe sunscreen</li>
      <li>Rash guard for snorkeling</li>
      <li>Waterproof phone pouch</li>
    </ul>
    <h2>Hiking Gear</h2>
    <ul>
      <li>Lightweight hiking shoes</li>
      <li>Quick-dry clothing</li>
      <li>Portable water filter</li>
    </ul>`,
    coverImageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=75",
    category: "Travel Tips",
    isFeatured: true,
    readingMinutes: 6,
    author: "Sarah Chen",
  },
  {
    title: "A Foodie's Guide to Tagaytay Cuisine",
    slug: "foodie-guide-tagaytay-cuisine",
    excerpt: "From bulalo to tawilis, explore the unique culinary delights that make Tagaytay a food lover's paradise.",
    content: `<p>Tagaytay isn't just about the views – it's a culinary destination that offers unique dishes you won't find anywhere else.</p>
    <h2>Must-Try Dishes</h2>
    <h3>Bulalo</h3>
    <p>The famous beef bone marrow soup is the ultimate comfort food, especially in Tagaytay's cool weather.</p>
    <h3>Tawilis</h3>
    <p>This freshwater sardine is endemic to Taal Lake and is best enjoyed fried to crispy perfection.</p>
    <h3>Kapeng Barako</h3>
    <p>Strong, aromatic coffee grown in the nearby Batangas province – perfect for coffee lovers.</p>`,
    coverImageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=75",
    category: "Destinations",
    isFeatured: false,
    readingMinutes: 5,
    author: "Marco Reyes",
  },
  {
    title: "How to Plan Your First Group Trip",
    slug: "plan-first-group-trip",
    excerpt: "Tips and strategies for organizing a successful group adventure without the stress.",
    content: `<p>Planning a trip with friends or family can be challenging, but with the right approach, it can be incredibly rewarding.</p>
    <h2>Step 1: Set a Budget Early</h2>
    <p>Discuss budget expectations upfront to avoid awkward conversations later.</p>
    <h2>Step 2: Use Collaborative Tools</h2>
    <p>TravelEase makes it easy to plan together with shared itineraries and real-time updates.</p>
    <h2>Step 3: Assign Responsibilities</h2>
    <p>Divide tasks like booking accommodations, researching activities, and managing the budget.</p>`,
    coverImageUrl: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=800&q=75",
    category: "Client Education",
    isFeatured: true,
    readingMinutes: 7,
    author: "TravelEase Team",
  },
  {
    title: "Best Time to Visit Tagaytay: A Seasonal Guide",
    slug: "best-time-visit-tagaytay-seasonal-guide",
    excerpt: "Plan your Tagaytay trip around the weather and local events for the best experience.",
    content: `<p>Tagaytay is a year-round destination, but each season offers a different experience.</p>
    <h2>Cool Season (December - February)</h2>
    <p>The most popular time to visit with temperatures dropping to 15°C at night.</p>
    <h2>Summer (March - May)</h2>
    <p>Still cooler than Manila but expect more crowds during Holy Week.</p>
    <h2>Rainy Season (June - November)</h2>
    <p>Fewer tourists and lush green landscapes, but pack rain gear!</p>`,
    coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=75",
    category: "Travel Tips",
    isFeatured: false,
    readingMinutes: 4,
    author: "Ana Santos",
  },
  {
    title: "Getting the Most Out of TravelEase",
    slug: "getting-most-out-travelease",
    excerpt: "Learn how to use TravelEase features to plan, collaborate, and execute your perfect trip.",
    content: `<p>TravelEase is designed to make travel planning effortless. Here's how to maximize your experience.</p>
    <h2>Create Collaborative Plans</h2>
    <p>Invite friends and family to contribute to your travel plan in real-time.</p>
    <h2>Discover Local Spots</h2>
    <p>Use our curated business directory to find restaurants, activities, and accommodations.</p>
    <h2>Interactive Maps</h2>
    <p>Visualize your itinerary on our interactive map and optimize your route.</p>`,
    coverImageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=75",
    category: "Client Education",
    isFeatured: false,
    readingMinutes: 5,
    author: "TravelEase Team",
  },
];

async function main() {
  console.log("Seeding blogs...");

  for (const blog of sampleBlogs) {
    const existing = await prisma.blog.findUnique({
      where: { slug: blog.slug },
    });

    if (existing) {
      console.log(`Blog "${blog.title}" already exists, skipping...`);
      continue;
    }

    await prisma.blog.create({
      data: blog,
    });
    console.log(`Created blog: ${blog.title}`);
  }

  console.log("Blog seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

