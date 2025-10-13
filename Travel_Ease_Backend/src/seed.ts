import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const blogData = [
  {
    title: "10 Hidden Gems in Southeast Asia You Must Visit",
    slug: "hidden-gems-southeast-asia",
    excerpt:
      "Discover breathtaking destinations off the beaten path in Southeast Asia that will leave you speechless.",
    content:
      "<p>When most people think of Southeast Asia, they picture the bustling streets of Bangkok, the temples of Angkor Wat, or the beaches of Bali. But this incredible region has so much more to offer...</p><p>From pristine islands with crystal-clear waters to ancient cities untouched by mass tourism, Southeast Asia is a treasure trove of hidden gems waiting to be discovered.</p>",
    coverImageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    category: "Destinations",
    isFeatured: true,
    readingMinutes: 8,
    author: "Sarah Chen",
    publishedAt: new Date("2024-01-15"),
  },
  {
    title: "The Ultimate Packing Guide for Long-Term Travel",
    slug: "ultimate-packing-guide-long-term-travel",
    excerpt:
      "Learn how to pack efficiently for months of travel with this comprehensive guide that covers everything from clothing to electronics.",
    content:
      "<p>Packing for long-term travel can be overwhelming, but with the right strategy, you can fit everything you need into a single backpack...</p><p>This guide covers the essentials, what to leave behind, and how to stay organized on the road.</p>",
    coverImageUrl:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop",
    category: "Tips",
    isFeatured: true,
    readingMinutes: 12,
    author: "Mike Rodriguez",
    publishedAt: new Date("2024-01-12"),
  },
  {
    title: "Budget Travel: How to See the World for Less",
    slug: "budget-travel-see-world-less",
    excerpt:
      "Discover proven strategies for traveling the world on a tight budget without sacrificing experiences or comfort.",
    content:
      "<p>Traveling doesn't have to break the bank. With careful planning and smart choices, you can explore the world on any budget...</p><p>From finding cheap flights to choosing budget accommodations, this guide has you covered.</p>",
    coverImageUrl:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop",
    category: "Tips",
    isFeatured: false,
    readingMinutes: 10,
    author: "Emma Thompson",
    publishedAt: new Date("2024-01-10"),
  },
  {
    title: "Solo Travel Safety: Essential Tips for Women",
    slug: "solo-travel-safety-tips-women",
    excerpt:
      "Comprehensive safety guide for women traveling alone, covering everything from accommodation to emergency contacts.",
    content:
      "<p>Solo travel can be incredibly rewarding, but safety should always be your top priority...</p><p>This guide provides practical tips and resources to help you stay safe while exploring the world on your own.</p>",
    coverImageUrl:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop",
    category: "Client Education",
    isFeatured: true,
    readingMinutes: 15,
    author: "Lisa Park",
    publishedAt: new Date("2024-01-08"),
  },
  {
    title: "Digital Nomad Destinations: Best Cities for Remote Work",
    slug: "digital-nomad-destinations-best-cities",
    excerpt:
      "Explore the top cities around the world that offer the perfect blend of work-friendly infrastructure and amazing experiences.",
    content:
      "<p>The digital nomad lifestyle has exploded in popularity, and for good reason...</p><p>These cities offer reliable internet, coworking spaces, and vibrant communities of remote workers.</p>",
    coverImageUrl:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=600&fit=crop",
    category: "Destinations",
    isFeatured: false,
    readingMinutes: 9,
    author: "David Kim",
    publishedAt: new Date("2024-01-05"),
  },
  {
    title: "Travel Insurance: What You Need to Know",
    slug: "travel-insurance-what-you-need-know",
    excerpt:
      "A complete guide to travel insurance, covering what to look for, what's covered, and how to choose the right policy.",
    content:
      "<p>Travel insurance might seem like an unnecessary expense, but it can save you thousands of dollars...</p><p>This guide breaks down everything you need to know about travel insurance policies and coverage.</p>",
    coverImageUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop",
    category: "Client Education",
    isFeatured: false,
    readingMinutes: 11,
    author: "Jennifer Walsh",
    publishedAt: new Date("2024-01-03"),
  },
  {
    title: "Sustainable Travel: How to Be a Responsible Tourist",
    slug: "sustainable-travel-responsible-tourist",
    excerpt:
      "Learn how to travel sustainably and minimize your environmental impact while exploring the world.",
    content:
      "<p>Sustainable travel is more important than ever as we work to protect our planet...</p><p>This guide shows you how to make eco-friendly choices while still having amazing travel experiences.</p>",
    coverImageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    category: "Tips",
    isFeatured: false,
    readingMinutes: 7,
    author: "Alex Green",
    publishedAt: new Date("2024-01-01"),
  },
  {
    title: "European Rail Pass: Everything You Need to Know",
    slug: "european-rail-pass-everything-need-know",
    excerpt:
      "Complete guide to European rail passes, including types, costs, and how to get the most value from your pass.",
    content:
      "<p>Traveling by train in Europe is one of the most scenic and convenient ways to explore the continent...</p><p>This guide covers all the different rail pass options and how to use them effectively.</p>",
    coverImageUrl:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop",
    category: "Client Education",
    isFeatured: false,
    readingMinutes: 13,
    author: "Maria Santos",
    publishedAt: new Date("2023-12-28"),
  },
  {
    title: "Adventure Travel: Top Destinations for Thrill Seekers",
    slug: "adventure-travel-top-destinations-thrill-seekers",
    excerpt:
      "Discover the world's most exciting adventure travel destinations for adrenaline junkies and outdoor enthusiasts.",
    content:
      "<p>If you're looking for heart-pounding adventures and unforgettable experiences, these destinations are for you...</p><p>From mountain climbing to white-water rafting, these places offer the ultimate adrenaline rush.</p>",
    coverImageUrl:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop",
    category: "Destinations",
    isFeatured: false,
    readingMinutes: 14,
    author: "Tom Wilson",
    publishedAt: new Date("2023-12-25"),
  },
  {
    title: "Travel Photography: Capturing Your Adventures",
    slug: "travel-photography-capturing-adventures",
    excerpt:
      "Master the art of travel photography with these essential tips for capturing stunning images of your journeys.",
    content:
      "<p>Great travel photography is about more than just having the right equipment...</p><p>This guide covers composition, lighting, and storytelling techniques to help you capture amazing travel memories.</p>",
    coverImageUrl:
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop",
    category: "Tips",
    isFeatured: false,
    readingMinutes: 16,
    author: "Sophie Martin",
    publishedAt: new Date("2023-12-22"),
  },
  {
    title: "Cultural Etiquette: How to Respect Local Customs",
    slug: "cultural-etiquette-respect-local-customs",
    excerpt:
      "Learn how to navigate cultural differences and show respect for local customs while traveling abroad.",
    content:
      "<p>Understanding and respecting local customs is essential for meaningful travel experiences...</p><p>This guide covers common cultural differences and how to avoid unintentional offenses.</p>",
    coverImageUrl:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop",
    category: "Client Education",
    isFeatured: false,
    readingMinutes: 12,
    author: "Ahmed Hassan",
    publishedAt: new Date("2023-12-20"),
  },
  {
    title: "Travel Apps: Essential Tools for Modern Travelers",
    slug: "travel-apps-essential-tools-modern-travelers",
    excerpt:
      "Discover the must-have apps that will make your travels easier, more organized, and more enjoyable.",
    content:
      "<p>Technology has revolutionized the way we travel, and the right apps can make all the difference...</p><p>This guide covers the essential apps for booking, navigation, translation, and more.</p>",
    coverImageUrl:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop",
    category: "Tips",
    isFeatured: false,
    readingMinutes: 8,
    author: "Rachel Johnson",
    publishedAt: new Date("2023-12-18"),
  },
];

async function main() {
  console.log("Starting seed...");

  // Clear existing data
  await prisma.blog.deleteMany();
  console.log("Cleared existing blog data");

  // Create new blog posts
  for (const blog of blogData) {
    await prisma.blog.create({
      data: blog,
    });
  }

  console.log(`Created ${blogData.length} blog posts`);
  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
