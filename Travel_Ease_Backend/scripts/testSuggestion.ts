
import { getAlternativeBusinesses } from '../src/services/trafficService.js';
import { prisma } from '../src/lib/prismaHelpers.js';

async function test() {
    try {
        console.log("Fetching zones to find a valid one...");
        const zones = await prisma.zone.findMany();
        if (zones.length === 0) throw new Error("No zones found");

        const testZone = zones[0].zone_id;
        console.log(`Using Zone ID: ${testZone} for testing.`);

        // Pick a main category, e.g. food_drinks
        const category = 'food_drinks' as any; // Cast to bypass enum check if strictly typed

        console.log(`Fetching alternatives for ${category} in zone ${testZone}...`);
        const alternatives = await getAlternativeBusinesses(testZone, category, 3);

        console.log("Alternatives found:");
        console.dir(alternatives, { depth: null });

    } catch (e) {
        console.error("Test failed", e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
