/**
 * Database Seed Script
 * Populates the database with sample data for testing
 * Uses Prisma Client for all database operations
 */

import { prisma } from '../src/lib/prisma.js';
import type { User, Business, BusinessCategory, TravelPlan, Blog, category, status_enum } from '@prisma/client';
import type { Prisma } from '@prisma/client';

// Type definitions for seed data
interface UserSeedData {
  first_name: string;
  last_name: string;
  email: string;
  contact_no: string;
  auth_provider: string;
  profile_completed: boolean;
}

interface BusinessSeedData {
  name: string;
  house_number: string;
  street: string;
  brgy: string;
  city: string;
  latitude: number;
  longtitude: number;
  description: string;
  rating: number;
  status: boolean;
  picture: string;
}

interface BusinessCategorySeedData {
  business_index: number;
  main_category: category;
  subcategory_name: string;
}

interface BlogSeedData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: string;
  isFeatured: boolean;
  readingMinutes: number;
  author: string;
}

interface TravelPlanSeedData {
  name: string;
  start_date: Date;
  end_date: Date;
  description: string;
  visibility: boolean;
  status: status_enum;
  max_slots: number;
  location: string;
}

interface MenuItemSeedData {
  business_index: number;
  name: string;
  description: string;
  price: number;
  category: string;
}

// Sample data
const users: UserSeedData[] = [
  {
    first_name: 'Juan',
    last_name: 'Dela Cruz',
    email: 'juan.delacruz@example.com',
    contact_no: '+63 917 123 4567',
    auth_provider: 'password',
    profile_completed: true
  },
  {
    first_name: 'Maria',
    last_name: 'Santos',
    email: 'maria.santos@example.com',
    contact_no: '+63 918 234 5678',
    auth_provider: 'google',
    profile_completed: true
  },
  {
    first_name: 'Pedro',
    last_name: 'Reyes',
    email: 'pedro.reyes@example.com',
    contact_no: '+63 919 345 6789',
    auth_provider: 'password',
    profile_completed: true
  },
  {
    first_name: 'Ana',
    last_name: 'Garcia',
    email: 'ana.garcia@example.com',
    contact_no: '+63 920 456 7890',
    auth_provider: 'google',
    profile_completed: true
  },
  {
    first_name: 'Carlos',
    last_name: 'Mendoza',
    email: 'carlos.mendoza@example.com',
    contact_no: '+63 921 567 8901',
    auth_provider: 'password',
    profile_completed: true
  }
];

const businesses: BusinessSeedData[] = [
  {
    name: 'Bag of Beans Cafe',
    house_number: '123',
    street: 'Tagaytay-Nasugbu Highway',
    brgy: 'Maharlika West',
    city: 'Tagaytay',
    latitude: 14.1153,
    longtitude: 120.9621,
    description: 'A cozy cafe famous for its breakfast meals and scenic garden views. Perfect spot for a relaxing morning in Tagaytay.',
    rating: 4.5,
    status: true,
    picture: '{"secure_url":["https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800"]}'
  },
  {
    name: 'Bulalo Point',
    house_number: '45',
    street: 'Aguinaldo Highway',
    brgy: 'Kaybagal South',
    city: 'Tagaytay',
    latitude: 14.1089,
    longtitude: 120.9567,
    description: 'The best bulalo (beef bone marrow soup) in Tagaytay! A must-visit for Filipino comfort food lovers.',
    rating: 4.7,
    status: true,
    picture: '{"secure_url":["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"]}'
  },
  {
    name: 'Taal Vista Hotel',
    house_number: 'KM 60',
    street: 'Tagaytay-Nasugbu Highway',
    brgy: 'Silang Junction South',
    city: 'Tagaytay',
    latitude: 14.1078,
    longtitude: 120.9445,
    description: 'Luxury hotel with stunning views of Taal Volcano. Features world-class amenities and dining options.',
    rating: 4.8,
    status: true,
    picture: '{"secure_url":["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"]}'
  },
  {
    name: 'Picnic Grove',
    house_number: '',
    street: 'Tagaytay-Calamba Road',
    brgy: 'Silang Junction South',
    city: 'Tagaytay',
    latitude: 14.1234,
    longtitude: 120.9678,
    description: 'Popular outdoor recreational area with cable cars, ziplines, and horseback riding. Great for family outings!',
    rating: 4.3,
    status: true,
    picture: '{"secure_url":["https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800"]}'
  },
  {
    name: 'Puzzle Mansion',
    house_number: '12',
    street: 'Mendez Crossing West',
    brgy: 'Mendez Crossing',
    city: 'Tagaytay',
    latitude: 14.1156,
    longtitude: 120.9234,
    description: 'Home to the world\'s largest collection of jigsaw puzzles! A unique attraction for puzzle enthusiasts.',
    rating: 4.2,
    status: true,
    picture: '{"secure_url":["https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=800"]}'
  },
  {
    name: 'Starbucks Reserve Tagaytay',
    house_number: '88',
    street: 'Aguinaldo Highway',
    brgy: 'Maharlika East',
    city: 'Tagaytay',
    latitude: 14.1098,
    longtitude: 120.9512,
    description: 'Premium Starbucks experience with exclusive reserve coffees and breathtaking Taal Lake views.',
    rating: 4.6,
    status: true,
    picture: '{"secure_url":["https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800"]}'
  },
  {
    name: 'Josephine\'s Restaurant',
    house_number: '234',
    street: 'Tagaytay-Nasugbu Highway',
    brgy: 'San Jose',
    city: 'Tagaytay',
    latitude: 14.1201,
    longtitude: 120.9389,
    description: 'Fine dining restaurant serving Filipino-Spanish cuisine with panoramic views of Taal Lake.',
    rating: 4.4,
    status: true,
    picture: '{"secure_url":["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"]}'
  },
  {
    name: 'Tagaytay Highlands',
    house_number: '',
    street: 'Tagaytay Highlands',
    brgy: 'Calabuso',
    city: 'Tagaytay',
    latitude: 14.1345,
    longtitude: 120.9567,
    description: 'Exclusive mountain resort with golf courses, spa, and premium accommodations.',
    rating: 4.9,
    status: true,
    picture: '{"secure_url":["https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800"]}'
  },
  {
    name: 'Rowena\'s Pasalubong Center',
    house_number: '56',
    street: 'Aguinaldo Highway',
    brgy: 'Silang Junction North',
    city: 'Tagaytay',
    latitude: 14.1067,
    longtitude: 120.9423,
    description: 'Best place to buy Tagaytay souvenirs and delicacies like buko pie, tarts, and local crafts.',
    rating: 4.1,
    status: true,
    picture: '{"secure_url":["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800"]}'
  },
  {
    name: 'Sky Ranch Tagaytay',
    house_number: '',
    street: 'Tagaytay-Calamba Road',
    brgy: 'Kaybagal Central',
    city: 'Tagaytay',
    latitude: 14.1178,
    longtitude: 120.9534,
    description: 'Theme park featuring the iconic Sky Eye ferris wheel with amazing views of Taal Lake and volcano.',
    rating: 4.4,
    status: true,
    picture: '{"secure_url":["https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=800"]}'
  }
];

const businessCategories: BusinessCategorySeedData[] = [
  { business_index: 0, main_category: 'food_drinks', subcategory_name: 'Restaurants & Cafés' },
  { business_index: 0, main_category: 'food_drinks', subcategory_name: 'Bars & Pubs' },
  { business_index: 1, main_category: 'food_drinks', subcategory_name: 'Restaurants & Cafés' },
  { business_index: 2, main_category: 'accommodation', subcategory_name: 'Hotels & Resorts' },
  { business_index: 2, main_category: 'food_drinks', subcategory_name: 'Restaurants & Cafés' },
  { business_index: 3, main_category: 'tours_activities', subcategory_name: 'Nature & Adventure' },
  { business_index: 3, main_category: 'tours_activities', subcategory_name: 'Theme Parks & Attractions' },
  { business_index: 4, main_category: 'wellness_medical', subcategory_name: 'Spas & Massage' },
  { business_index: 5, main_category: 'food_drinks', subcategory_name: 'Bars & Pubs' },
  { business_index: 6, main_category: 'food_drinks', subcategory_name: 'Restaurants & Cafés' },
  { business_index: 7, main_category: 'accommodation', subcategory_name: 'Hotels & Resorts' },
  { business_index: 7, main_category: 'wellness_medical', subcategory_name: 'Spas & Massage' },
  { business_index: 8, main_category: 'shopping_souvenirs', subcategory_name: 'Souvenir Shops' },
  { business_index: 8, main_category: 'shopping_souvenirs', subcategory_name: 'Local Crafts & Artisans' },
  { business_index: 9, main_category: 'tours_activities', subcategory_name: 'Theme Parks & Attractions' },
  { business_index: 9, main_category: 'wellness_medical', subcategory_name: 'Wellness Retreats / Yoga' }
];

const blogs: BlogSeedData[] = [
  {
    title: 'Top 10 Must-Visit Spots in Tagaytay',
    slug: 'top-10-must-visit-spots-tagaytay',
    excerpt: 'Discover the best attractions, restaurants, and hidden gems in the cool city of Tagaytay.',
    content: `<h2>Welcome to Tagaytay!</h2>
<p>Tagaytay City, known as the "Second Summer Capital of the Philippines," offers breathtaking views of Taal Volcano and Lake. Here are the top 10 spots you shouldn't miss:</p>

<h3>1. Taal Volcano Viewpoints</h3>
<p>The iconic view of the world's smallest active volcano inside a lake is a must-see. Several restaurants and cafes offer stunning vantage points.</p>

<h3>2. Picnic Grove</h3>
<p>A family-friendly destination with cable cars, ziplines, and horseback riding activities.</p>

<h3>3. Sky Ranch</h3>
<p>Home to the famous Sky Eye ferris wheel, offering panoramic views of the surrounding landscape.</p>

<h3>4. People's Park in the Sky</h3>
<p>An unfinished mansion that offers some of the best views in Tagaytay.</p>

<h3>5. Bag of Beans</h3>
<p>Perfect for breakfast lovers, this cafe chain offers hearty meals in a garden setting.</p>

<p>Continue exploring to discover more hidden gems in this beautiful city!</p>`,
    coverImageUrl: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1200',
    category: 'Destinations',
    isFeatured: true,
    readingMinutes: 8,
    author: 'Maria Santos'
  },
  {
    title: 'The Ultimate Tagaytay Food Trip Guide',
    slug: 'ultimate-tagaytay-food-trip-guide',
    excerpt: 'From bulalo to buko pie, here\'s your complete guide to eating your way through Tagaytay.',
    content: `<h2>A Foodie's Paradise</h2>
<p>Tagaytay isn't just about the views-it's a food lover's dream destination. Here's what you need to try:</p>

<h3>Bulalo</h3>
<p>No trip to Tagaytay is complete without trying bulalo, a hearty beef bone marrow soup. The cold weather makes it even more satisfying!</p>

<h3>Buko Pie</h3>
<p>Rowena's and Colette's are the most famous buko pie shops. Get them fresh and warm!</p>

<h3>Breakfast at Bag of Beans</h3>
<p>Their famous breakfast meals are worth the wait. Try the longsilog or tapsilog!</p>

<h3>Coffee with a View</h3>
<p>Starbucks Reserve Tagaytay offers premium coffee with stunning lake views.</p>

<p>Pro tip: Come hungry and leave with pasalubong for the family!</p>`,
    coverImageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200',
    category: 'Tips',
    isFeatured: true,
    readingMinutes: 6,
    author: 'Juan Dela Cruz'
  },
  {
    title: 'Weekend Getaway: 2-Day Tagaytay Itinerary',
    slug: 'weekend-getaway-2-day-tagaytay-itinerary',
    excerpt: 'Plan the perfect weekend escape to Tagaytay with this detailed 2-day itinerary.',
    content: `<h2>Day 1: Arrival and Exploration</h2>
<h3>Morning</h3>
<p>Leave Manila early to avoid traffic. Stop by Bag of Beans for a hearty breakfast.</p>

<h3>Afternoon</h3>
<p>Check into your hotel and rest. Visit Picnic Grove for some outdoor activities.</p>

<h3>Evening</h3>
<p>Dinner at Josephine's Restaurant with views of the sunset over Taal Lake.</p>

<h2>Day 2: Adventure and Shopping</h2>
<h3>Morning</h3>
<p>Start with coffee at Starbucks Reserve, then head to Sky Ranch for some fun rides.</p>

<h3>Afternoon</h3>
<p>Lunch at Bulalo Point-the best bulalo in town! Shop for pasalubong at Rowena's.</p>

<h3>Evening</h3>
<p>Head back to Manila with happy memories and delicious treats!</p>`,
    coverImageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200',
    category: 'Itineraries',
    isFeatured: false,
    readingMinutes: 10,
    author: 'Ana Garcia'
  },
  {
    title: 'Best Hotels and Resorts in Tagaytay',
    slug: 'best-hotels-resorts-tagaytay',
    excerpt: 'From luxury resorts to budget-friendly stays, find the perfect accommodation for your Tagaytay trip.',
    content: `<h2>Where to Stay in Tagaytay</h2>
<p>Tagaytay offers accommodations for every budget. Here are our top picks:</p>

<h3>Luxury: Taal Vista Hotel</h3>
<p>The most iconic hotel in Tagaytay with unparalleled views and world-class service.</p>

<h3>Mid-Range: Tagaytay Highlands</h3>
<p>Perfect for golf enthusiasts and those seeking a mountain resort experience.</p>

<h3>Budget-Friendly: Various Airbnbs</h3>
<p>Many affordable options with great views are available on Airbnb.</p>

<h3>Booking Tips</h3>
<ul>
<li>Book in advance during peak season (December-February)</li>
<li>Weekday rates are usually cheaper</li>
<li>Look for packages that include breakfast</li>
</ul>`,
    coverImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200',
    category: 'Tips',
    isFeatured: false,
    readingMinutes: 5,
    author: 'Pedro Reyes'
  },
  {
    title: 'Family-Friendly Activities in Tagaytay',
    slug: 'family-friendly-activities-tagaytay',
    excerpt: 'Keep the kids entertained with these fun activities perfect for the whole family.',
    content: `<h2>Fun for the Whole Family</h2>
<p>Tagaytay is a great destination for families. Here's how to keep everyone happy:</p>

<h3>Sky Ranch</h3>
<p>The theme park has rides for all ages, from gentle kiddie rides to thrilling attractions.</p>

<h3>Puzzle Mansion</h3>
<p>Kids and adults alike will be amazed by the world's largest puzzle collection.</p>

<h3>Picnic Grove</h3>
<p>Cable cars, ziplines, and pony rides make this a hit with children.</p>

<h3>Paradizoo</h3>
<p>A farm-themed park where kids can interact with animals and enjoy nature.</p>

<p>Pro tip: Bring jackets-Tagaytay can get chilly, especially in the morning and evening!</p>`,
    coverImageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1200',
    category: 'Destinations',
    isFeatured: true,
    readingMinutes: 7,
    author: 'Maria Santos'
  }
];

const travelPlans: TravelPlanSeedData[] = [
  {
    name: 'Tagaytay Food Adventure',
    start_date: new Date('2025-01-15'),
    end_date: new Date('2025-01-17'),
    description: 'A 3-day food trip exploring the best restaurants and cafes in Tagaytay.',
    visibility: true,
    status: 'Active' as status_enum,
    max_slots: 8,
    location: 'Tagaytay City'
  },
  {
    name: 'Weekend Relaxation',
    start_date: new Date('2025-02-01'),
    end_date: new Date('2025-02-02'),
    description: 'A peaceful weekend getaway focused on relaxation and scenic views.',
    visibility: true,
    status: 'Active' as status_enum,
    max_slots: 4,
    location: 'Tagaytay City'
  },
  {
    name: 'Family Fun Day',
    start_date: new Date('2025-02-14'),
    end_date: new Date('2025-02-14'),
    description: 'One-day trip with activities for the whole family.',
    visibility: true,
    status: 'Draft' as status_enum,
    max_slots: 10,
    location: 'Tagaytay City'
  },
  {
    name: 'Photography Tour',
    start_date: new Date('2025-03-01'),
    end_date: new Date('2025-03-02'),
    description: 'Capture the beauty of Tagaytay with fellow photography enthusiasts.',
    visibility: false,
    status: 'Draft' as status_enum,
    max_slots: 6,
    location: 'Tagaytay City'
  }
];

const menuItems: MenuItemSeedData[] = [
  // Bag of Beans Cafe
  { business_index: 0, name: 'Longsilog', description: 'Longganisa with garlic rice and egg', price: 295, category: 'Breakfast' },
  { business_index: 0, name: 'Tapsilog', description: 'Beef tapa with garlic rice and egg', price: 325, category: 'Breakfast' },
  { business_index: 0, name: 'Pancakes', description: 'Fluffy pancakes with butter and syrup', price: 195, category: 'Breakfast' },
  { business_index: 0, name: 'Kapeng Barako', description: 'Strong local coffee', price: 95, category: 'Drinks' },
  
  // Bulalo Point
  { business_index: 1, name: 'Special Bulalo', description: 'Beef bone marrow soup with vegetables', price: 550, category: 'Main' },
  { business_index: 1, name: 'Crispy Pata', description: 'Deep fried pork leg', price: 650, category: 'Main' },
  { business_index: 1, name: 'Sinigang na Baboy', description: 'Pork in sour tamarind soup', price: 350, category: 'Main' },
  
  // Josephine's Restaurant
  { business_index: 6, name: 'Paella Valenciana', description: 'Spanish rice with seafood and meat', price: 850, category: 'Main' },
  { business_index: 6, name: 'Kare-Kare', description: 'Oxtail stew with peanut sauce', price: 550, category: 'Main' },
  { business_index: 6, name: 'Lechon Kawali', description: 'Crispy fried pork belly', price: 450, category: 'Main' },
  { business_index: 6, name: 'Halo-Halo', description: 'Filipino shaved ice dessert', price: 195, category: 'Dessert' }
];

async function seed(): Promise<void> {
  try {
    console.log('Starting database seed...\n');
    
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection established.\n');

    // Wrap all operations in a transaction
    await prisma.$transaction(async (tx) => {
      // Create Users
      console.log('Creating users...');
      const createdUsers: User[] = [];
      for (const user of users) {
        const created = await tx.user.create({ data: user });
        createdUsers.push(created);
      }
      console.log(`   Created ${createdUsers.length} users.\n`);

      // Create Businesses (assign to users)
      console.log('Creating businesses...');
      const createdBusinesses: Business[] = [];
      for (let i = 0; i < businesses.length; i++) {
        const b = businesses[i];
        const created = await tx.business.create({
          data: {
            ...b,
            user_id: createdUsers[i % createdUsers.length].user_id
          }
        });
        createdBusinesses.push(created);
      }
      console.log(`   Created ${createdBusinesses.length} businesses.\n`);

      // Ensure subcategories exist first
      console.log('Ensuring subcategories exist...');
      const uniqueSubcategories = [...new Set(businessCategories.map(c => 
        JSON.stringify({ main_category: c.main_category, subcategory_name: c.subcategory_name })
      ))].map(s => JSON.parse(s) as { main_category: category; subcategory_name: string });
      
      for (const subcat of uniqueSubcategories) {
        await tx.subcategory.upsert({
          where: {
            main_category_subcategory_name: {
              main_category: subcat.main_category,
              subcategory_name: subcat.subcategory_name,
            },
          },
          update: {},
          create: subcat,
        });
      }
      console.log(`   Ensured ${uniqueSubcategories.length} subcategories exist.\n`);

      // Create Business Categories
      console.log('Creating business categories...');
      const createdCategories: BusinessCategory[] = [];
      for (const c of businessCategories) {
        // Look up the subcategory_id
        const subcategory = await tx.subcategory.findUnique({
          where: {
            main_category_subcategory_name: {
              main_category: c.main_category,
              subcategory_name: c.subcategory_name,
            },
          },
        });
        
        if (!subcategory) {
          console.warn(`   Subcategory not found: ${c.main_category} > ${c.subcategory_name}`);
          continue;
        }

        const created = await tx.business_category.create({
          data: {
            business_id: createdBusinesses[c.business_index].business_id,
            subcategory_id: subcategory.subcategory_id
          }
        });
        createdCategories.push(created);
      }
      console.log(`   Created ${createdCategories.length} categories.\n`);

      // Create Business Hours
      console.log('Creating business hours...');
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      let hoursCount = 0;
      for (const business of createdBusinesses) {
        for (const day of days) {
          await tx.business_hours.create({
            data: {
              business_id: business.business_id,
              day_of_week: day,
              open_time: day === 'sunday' ? null : new Date('1970-01-01T09:00:00Z'),
              close_time: day === 'sunday' ? null : new Date('1970-01-01T21:00:00Z')
            }
          });
          hoursCount++;
        }
      }
      console.log(`   Created ${hoursCount} business hours entries.\n`);

      // Create Price Ranges (one per unique subcategory)
      console.log('Creating price ranges...');
      const createdPriceRanges: Array<{ id: number }> = [];
      const seenSubcategoryIds = new Set<number>();
      for (const cat of createdCategories) {
        // Skip if we already created a price range for this subcategory
        if (!cat.subcategory_id || seenSubcategoryIds.has(cat.subcategory_id)) {
          continue;
        }
        seenSubcategoryIds.add(cat.subcategory_id);
        
        const created = await tx.price_range.create({
          data: {
            subcategory_id: cat.subcategory_id,
            min_price: Math.floor(Math.random() * 100) + 50,
            max_price: Math.floor(Math.random() * 500) + 200
          }
        });
        createdPriceRanges.push(created);
      }
      console.log(`   Created ${createdPriceRanges.length} price ranges.\n`);

      // Create Menu Items
      console.log('Creating menu items...');
      const createdMenuItems: Array<{ menu_item_id: number }> = [];
      for (const m of menuItems) {
        const created = await tx.menu_item.create({
          data: {
            business_id: createdBusinesses[m.business_index].business_id,
            name: m.name,
            description: m.description,
            price: m.price,
            category: m.category
          }
        });
        createdMenuItems.push(created);
      }
      console.log(`   Created ${createdMenuItems.length} menu items.\n`);

      // Create Blogs
      console.log('Creating blogs...');
      const createdBlogs: Blog[] = [];
      for (let i = 0; i < blogs.length; i++) {
        const b = blogs[i];
        const created = await tx.blog.create({
          data: {
            ...b,
            user_id: createdUsers[i % createdUsers.length].user_id
          }
        });
        createdBlogs.push(created);
      }
      console.log(`   Created ${createdBlogs.length} blogs.\n`);

      // Create Travel Plans
      console.log('Creating travel plans...');
      const createdPlans: TravelPlan[] = [];
      for (let i = 0; i < travelPlans.length; i++) {
        const p = travelPlans[i];
        const created = await tx.travel_plan.create({
          data: {
            name: p.name,
            start_date: p.start_date,
            end_date: p.end_date,
            description: p.description,
            visibility: p.visibility,
            status: p.status,
            max_slots: p.max_slots,
            location: p.location,
            user: {
              connect: { user_id: createdUsers[i % createdUsers.length].user_id }
            }
          }
        });
        createdPlans.push(created);
      }
      console.log(`   Created ${createdPlans.length} travel plans.\n`);

      // Create Participants
      console.log('Creating participants...');
      let participantCount = 0;
      for (let i = 0; i < createdPlans.length; i++) {
        // Add owner as Admin
        await tx.participant.create({
          data: {
            travel_plan_id: createdPlans[i].travel_plan_id,
            user_id: createdPlans[i].user_id,
            role: 'Admin',
            status: true
          }
        });
        participantCount++;
        // Add 1-2 other participants
        const otherUsers = createdUsers.filter(u => u.user_id !== createdPlans[i].user_id);
        for (let j = 0; j < Math.min(2, otherUsers.length); j++) {
          await tx.participant.create({
            data: {
              travel_plan_id: createdPlans[i].travel_plan_id,
              user_id: otherUsers[j].user_id,
              role: j === 0 ? 'Editor' : 'Viewer',
              status: true
            }
          });
          participantCount++;
        }
      }
      console.log(`   Created ${participantCount} participants.\n`);

      // Create Activities
      console.log('Creating activities...');
      let activityCount = 0;
      for (const plan of createdPlans) {
        const numActivities = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < numActivities; i++) {
          const randomBusiness = createdBusinesses[Math.floor(Math.random() * createdBusinesses.length)];
          await tx.activity.create({
            data: {
              travel_plan_id: plan.travel_plan_id,
              business_id: randomBusiness.business_id,
              user_id: plan.user_id,
              notes: `Visit ${randomBusiness.name}`,
              target_date: plan.start_date,
              location: randomBusiness.city,
              city: randomBusiness.city
            }
          });
          activityCount++;
        }
      }
      console.log(`   Created ${activityCount} activities.\n`);

      // Create Business Favorites
      console.log('Creating business favorites...');
      let bizFavCount = 0;
      for (const user of createdUsers) {
        const numFavorites = Math.floor(Math.random() * 2) + 2;
        const shuffled = [...createdBusinesses].sort(() => 0.5 - Math.random());
        for (let i = 0; i < numFavorites; i++) {
          await tx.business_favorite.create({
            data: {
              user_id: user.user_id,
              business_id: shuffled[i].business_id
            }
          });
          bizFavCount++;
        }
      }
      console.log(`   Created ${bizFavCount} business favorites.\n`);

      // Create Travel Plan Favorites
      console.log('Creating travel plan favorites...');
      let planFavCount = 0;
      for (const user of createdUsers) {
        const randomPlan = createdPlans[Math.floor(Math.random() * createdPlans.length)];
        if (randomPlan.user_id !== user.user_id) {
          await tx.travel_plan_favorite.create({
            data: {
              user_id: user.user_id,
              travel_plan_id: randomPlan.travel_plan_id
            }
          });
          planFavCount++;
        }
      }
      console.log(`   Created ${planFavCount} travel plan favorites.\n`);

      // Create Business Reviews
      console.log('Creating business reviews...');
      const reviewContents = [
        'Amazing experience! Highly recommended.',
        'Great food and service. Will definitely come back.',
        'Beautiful views and friendly staff.',
        'Good value for money. Nice ambiance.',
        'A must-visit when in Tagaytay!'
      ];
      let bizReviewCount = 0;
      for (let i = 0; i < createdUsers.length; i++) {
        const randomBusiness = createdBusinesses[i % createdBusinesses.length];
        await tx.business_review.create({
          data: {
            user_id: createdUsers[i].user_id,
            business_id: randomBusiness.business_id,
            rating: Math.floor(Math.random() * 2) + 4,
            content: reviewContents[i % reviewContents.length]
          }
        });
        bizReviewCount++;
      }
      console.log(`   Created ${bizReviewCount} business reviews.\n`);

      // Create Travel Plan Reviews
      console.log('Creating travel plan reviews...');
      let planReviewCount = 0;
      for (let i = 0; i < Math.min(3, createdUsers.length); i++) {
        const randomPlan = createdPlans[i % createdPlans.length];
        if (randomPlan.user_id !== createdUsers[i].user_id) {
          await tx.travel_plan_review.create({
            data: {
              user_id: createdUsers[i].user_id,
              travel_plan_id: randomPlan.travel_plan_id,
              rating: Math.floor(Math.random() * 2) + 4,
              content: 'Great itinerary! Very well planned.'
            }
          });
          planReviewCount++;
        }
      }
      console.log(`   Created ${planReviewCount} travel plan reviews.\n`);

      console.log('Database seeding completed successfully!\n');
      console.log('Summary:');
      console.log('-'.repeat(40));
      console.log(`  Users:              ${createdUsers.length}`);
      console.log(`  Businesses:         ${createdBusinesses.length}`);
      console.log(`  Categories:         ${createdCategories.length}`);
      console.log(`  Business Hours:     ${hoursCount}`);
      console.log(`  Price Ranges:       ${createdPriceRanges.length}`);
      console.log(`  Menu Items:         ${createdMenuItems.length}`);
      console.log(`  Blogs:              ${createdBlogs.length}`);
      console.log(`  Travel Plans:       ${createdPlans.length}`);
      console.log(`  Participants:       ${participantCount}`);
      console.log(`  Activities:         ${activityCount}`);
      console.log(`  Business Favorites: ${bizFavCount}`);
      console.log(`  Plan Favorites:     ${planFavCount}`);
      console.log(`  Business Reviews:   ${bizReviewCount}`);
      console.log('-'.repeat(40));
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();

