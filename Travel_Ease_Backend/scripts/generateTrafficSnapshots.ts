
import { generateTrafficSnapshots } from '../src/services/trafficService.js';
import { prisma } from '../src/lib/prismaHelpers.js';

async function main() {
    console.log('Running traffic snapshot generation script...');

    try {
        const result = await generateTrafficSnapshots();
        console.log(result);
    } catch (error) {
        console.error('Error generating traffic snapshots:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
