import { PrismaClient, category } from '@prisma/client';

const prisma = new PrismaClient();

// Keyword mapping to main_category and subcategory_name
const categoryMapping: Record<string, { main: category, sub: string }> = {
    'hotel': { main: 'accommodation', sub: 'Hotels & Resorts' },
    'resort': { main: 'accommodation', sub: 'Hotels & Resorts' },
    'inn': { main: 'accommodation', sub: 'Hotels & Resorts' },
    'villa': { main: 'accommodation', sub: 'Hotels & Resorts' },
    'mansion': { main: 'accommodation', sub: 'Hotels & Resorts' },
    'restaurant': { main: 'food_drinks', sub: 'Restaurants & Cafés' },
    'cafe': { main: 'food_drinks', sub: 'Restaurants & Cafés' },
    'café': { main: 'food_drinks', sub: 'Restaurants & Cafés' },
    'coffee': { main: 'food_drinks', sub: 'Restaurants & Cafés' },
    'bulalo': { main: 'food_drinks', sub: 'Restaurants & Cafés' },
    'diner': { main: 'food_drinks', sub: 'Restaurants & Cafés' },
    'eatery': { main: 'food_drinks', sub: 'Restaurants & Cafés' },
    'farm': { main: 'tours_activities', sub: 'Nature & Adventure' },
    'park': { main: 'tours_activities', sub: 'Theme Parks & Attractions' },
    'ranch': { main: 'tours_activities', sub: 'Theme Parks & Attractions' },
    'museum': { main: 'tours_activities', sub: 'Theme Parks & Attractions' },
    'adventure': { main: 'tours_activities', sub: 'Nature & Adventure' },
    'atv': { main: 'outdoor_gear_rental', sub: 'Outdoor / Gear Rental' },
    'yacht': { main: 'tours_activities', sub: 'Nature & Adventure' },
    'pharmacy': { main: 'wellness_medical', sub: 'Travel-friendly Clinics / Medical Services' },
    'drug': { main: 'wellness_medical', sub: 'Travel-friendly Clinics / Medical Services' },
    'spa': { main: 'wellness_medical', sub: 'Spas & Massage' },
    'events': { main: 'events_experiences', sub: 'Event Venues' },
    'event': { main: 'events_experiences', sub: 'Event Venues' },
    'rental': { main: 'transport_transfers', sub: 'Motorbike / Bicycle Rentals' },
    'bike': { main: 'transport_transfers', sub: 'Motorbike / Bicycle Rentals' },
    'travel': { main: 'travel_services', sub: 'Travel Agencies / Package Providers' },
    'souvenir': { main: 'shopping_souvenirs', sub: 'Souvenir Shops' },
    'pasalubong': { main: 'shopping_souvenirs', sub: 'Souvenir Shops' },
    'convenience': { main: 'shopping_souvenirs', sub: 'Specialty Stores' },
    'store': { main: 'shopping_souvenirs', sub: 'Specialty Stores' },
    'market': { main: 'shopping_souvenirs', sub: 'Specialty Stores' }
};

const defaultCategory = { main: 'tours_activities' as category, sub: 'Nature & Adventure' };

async function seedCategories() {
    try {
        console.log('Starting category seeding for existing businesses...');

        // Fetch all businesses
        const businesses = await prisma.business.findMany({
            include: {
                business_category: true
            }
        });

        // Filter businesses with NO categories
        const unassignedBusinesses = businesses.filter(b => b.business_category.length === 0);
        console.log(`Found ${unassignedBusinesses.length} out of ${businesses.length} businesses without categories.`);

        if (unassignedBusinesses.length === 0) {
            console.log('All businesses already have categories assigned. Exiting.');
            return;
        }

        let assignedCount = 0;

        for (const biz of unassignedBusinesses) {
            const nameLower = biz.name.toLowerCase();
            const descLower = biz.description?.toLowerCase() || '';
            const searchString = `${nameLower} ${descLower}`;

            let matchedCategory = null;

            // Simple keyword search
            for (const [keyword, catInfo] of Object.entries(categoryMapping)) {
                if (searchString.includes(keyword)) {
                    matchedCategory = catInfo;
                    break;
                }
            }

            // Fallback to default if no keyword match
            if (!matchedCategory) {
                console.log(`No keyword match for "${biz.name}". Using default category.`);
                matchedCategory = defaultCategory;
            }

            // Find or create the subcategory precisely
            const subcategory = await prisma.subcategory.findFirst({
                where: {
                    main_category: matchedCategory.main,
                    subcategory_name: matchedCategory.sub
                }
            });

            if (!subcategory) {
                console.error(`ERROR: Subcategory not found in DB: ${matchedCategory.main} -> ${matchedCategory.sub}. Skipping ${biz.name}`);
                continue;
            }

            // Create the mapping record
            await prisma.business_category.create({
                data: {
                    business_id: biz.business_id,
                    subcategory_id: subcategory.subcategory_id
                }
            });

            console.log(`[Assigned] ${biz.name} -> ${matchedCategory.main}: ${matchedCategory.sub}`);
            assignedCount++;
        }

        console.log(`\nSuccessfully assigned categories to ${assignedCount} businesses.`);

    } catch (e) {
        console.error('Error during category seeding:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seedCategories();
