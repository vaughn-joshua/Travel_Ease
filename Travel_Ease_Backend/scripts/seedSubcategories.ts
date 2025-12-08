/**
 * Subcategory Seed Script
 * Populates the Subcategory table with all main categories and their subcategories
 * Run with: npm run db:seed-subcategories
 */

import { prisma } from '../src/lib/prisma.js';
import type { category } from '@prisma/client';

const subcategoryMapping: Array<{
  main_category: category;
  subcategory_name: string;
}> = [
  // Accommodation
  { main_category: "accommodation", subcategory_name: "Hotels & Resorts" },
  { main_category: "accommodation", subcategory_name: "Hostels & Guesthouses" },
  { main_category: "accommodation", subcategory_name: "Homestays / Bed & Breakfasts" },
  { main_category: "accommodation", subcategory_name: "Vacation Rentals / Apartments" },
  
  // Food & Drinks
  { main_category: "food_drinks", subcategory_name: "Restaurants & Cafés" },
  { main_category: "food_drinks", subcategory_name: "Street Food & Night Markets" },
  { main_category: "food_drinks", subcategory_name: "Bars & Pubs" },
  { main_category: "food_drinks", subcategory_name: "Specialty / Theme Dining" },
  
  // Tours & Activities
  { main_category: "tours_activities", subcategory_name: "Island-hopping & Boat Tours" },
  { main_category: "tours_activities", subcategory_name: "City Tours & Walking Tours" },
  { main_category: "tours_activities", subcategory_name: "Nature & Adventure" },
  { main_category: "tours_activities", subcategory_name: "Cultural & Heritage Tours" },
  { main_category: "tours_activities", subcategory_name: "Theme Parks & Attractions" },
  
  // Transport & Transfers
  { main_category: "transport_transfers", subcategory_name: "Airport Transfers" },
  { main_category: "transport_transfers", subcategory_name: "Car / Van Rentals" },
  { main_category: "transport_transfers", subcategory_name: "Motorbike / Bicycle Rentals" },
  { main_category: "transport_transfers", subcategory_name: "Ferry / Boat Operators" },
  { main_category: "transport_transfers", subcategory_name: "Local Shuttle / Hop-On Hop-Off services" },
  
  // Travel Services
  { main_category: "travel_services", subcategory_name: "Travel Agencies / Package Providers" },
  { main_category: "travel_services", subcategory_name: "Visa & Documentation Assistance" },
  { main_category: "travel_services", subcategory_name: "Travel Insurance Partners" },
  { main_category: "travel_services", subcategory_name: "SIM / Pocket WiFi Providers" },
  
  // Shopping & Souvenirs
  { main_category: "shopping_souvenirs", subcategory_name: "Souvenir Shops" },
  { main_category: "shopping_souvenirs", subcategory_name: "Local Crafts & Artisans" },
  { main_category: "shopping_souvenirs", subcategory_name: "Specialty Stores" },
  
  // Wellness & Medical
  { main_category: "wellness_medical", subcategory_name: "Spas & Massage" },
  { main_category: "wellness_medical", subcategory_name: "Wellness Retreats / Yoga" },
  { main_category: "wellness_medical", subcategory_name: "Travel-friendly Clinics / Medical Services" },
  
  // Events & Experiences
  { main_category: "events_experiences", subcategory_name: "Event Venues" },
  { main_category: "events_experiences", subcategory_name: "Festivals & Cultural Events" },
  { main_category: "events_experiences", subcategory_name: "Workshops" },
  
  // Outdoor / Gear Rental
  { main_category: "outdoor_gear_rental", subcategory_name: "Outdoor / Gear Rental" },
];

async function seedSubcategories() {
  console.log('Seeding subcategories...\n');
  
  for (const subcat of subcategoryMapping) {
    await prisma.subcategory.upsert({
      where: {
        main_category_subcategory_name: {
          main_category: subcat.main_category,
          subcategory_name: subcat.subcategory_name,
        },
      },
      update: {},
      create: subcat,
    });
    console.log(`✓ ${subcat.main_category} > ${subcat.subcategory_name}`);
  }
  
  console.log('\nSubcategories seeded successfully!');
  await prisma.$disconnect();
}

seedSubcategories();

