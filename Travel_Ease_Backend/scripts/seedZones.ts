
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const zones = [
    {
        zone_name: 'Zone 1 – Western Ridge',
        centroid_lat: 14.0950,
        centroid_lng: 120.9050,
        boundary_coordinates: [
            { lat: 14.1100, lng: 120.8800 },
            { lat: 14.1300, lng: 120.8800 },
            { lat: 14.1300, lng: 120.9100 },
            { lat: 14.1100, lng: 120.9100 }
        ]
    },
    {
        zone_name: 'Zone 2 – Southwest Central',
        centroid_lat: 14.0950,
        centroid_lng: 120.9200,
        boundary_coordinates: [
            { lat: 14.1100, lng: 120.9100 },
            { lat: 14.1300, lng: 120.9100 },
            { lat: 14.1300, lng: 120.9400 },
            { lat: 14.1100, lng: 120.9400 }
        ]
    },
    {
        zone_name: 'Zone 3 – Northwest Central',
        centroid_lat: 14.1150,
        centroid_lng: 120.9250,
        boundary_coordinates: [
            { lat: 14.1300, lng: 120.9100 },
            { lat: 14.1500, lng: 120.9100 },
            { lat: 14.1500, lng: 120.9400 },
            { lat: 14.1300, lng: 120.9400 }
        ]
    },
    {
        zone_name: 'Zone 4 – Southeast Central',
        centroid_lat: 14.0950,
        centroid_lng: 120.9500,
        boundary_coordinates: [
            { lat: 14.1100, lng: 120.9400 },
            { lat: 14.1300, lng: 120.9400 },
            { lat: 14.1300, lng: 120.9700 },
            { lat: 14.1100, lng: 120.9700 }
        ]
    },
    {
        zone_name: 'Zone 5 – Northeast Central',
        centroid_lat: 14.1350,
        centroid_lng: 120.9550,
        boundary_coordinates: [
            { lat: 14.1300, lng: 120.9400 },
            { lat: 14.1500, lng: 120.9400 },
            { lat: 14.1500, lng: 120.9700 },
            { lat: 14.1300, lng: 120.9700 }
        ]
    },
    {
        zone_name: 'Zone 6 – Eastern Edge',
        centroid_lat: 14.1200,
        centroid_lng: 120.9850,
        boundary_coordinates: [
            { lat: 14.1100, lng: 120.9700 },
            { lat: 14.1500, lng: 120.9700 },
            { lat: 14.1500, lng: 121.0100 },
            { lat: 14.1100, lng: 121.0100 }
        ]
    }
];

async function main() {
    console.log('Seeding zones...');

    // Clear existing zones to ensure clean state or update them
    // Since we want exactly 6 fixed zones, we can upsert or delete all and recreate.
    // Given "Zones are fixed and manually defined" and "exactly 6 rows", we'll truncate or delete and recreate.
    // Using deleteMany for simplicity in dev.

    // NOTE: If we had foreign keys without cascade, we might need to be careful.
    // Here we have activities pointing to zones. If we delete zones, activities might lose their zone_id (SetNull).
    // Ideally, we should check if they exist and update, or just upsert by ID if IDs were fixed. 
    // Since zone_id is autoincrement, we can't force it easily without raw SQL.
    // So we will try to find and update, or create if not exists, matching by name?
    // Let's rely on name uniqueness conceptually, though schema doesn't enforce it.

    for (const zone of zones) {
        const existing = await prisma.zone.findFirst({
            where: { zone_name: zone.zone_name }
        });

        if (existing) {
            console.log(`Updating ${zone.zone_name}...`);
            await prisma.zone.update({
                where: { zone_id: existing.zone_id },
                data: {
                    centroid_lat: zone.centroid_lat,
                    centroid_lng: zone.centroid_lng,
                    boundary_coordinates: zone.boundary_coordinates,
                }
            });
        } else {
            console.log(`Creating ${zone.zone_name}...`);
            await prisma.zone.create({
                data: zone
            });
        }
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
