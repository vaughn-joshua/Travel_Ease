import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { businessLogger } from '../src/lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

interface LguBusiness {
  name: string;
  house_number: string | null;
  street: string | null;
  brgy: string | null;
  city: string;
  latitude: number;
  longtitude: number;
  description: string;
  rating: number;
  min_price: number;
  max_price: number;
  picture: string;
}

const LGU_ADMIN_ID = parseInt(process.env.LGU_ADMIN_ID || '7210', 10);

async function findMatchingBusiness(
  name: string,
  city: string,
  street: string | null,
  tx = prisma
): Promise<any | null> {
  return tx.business.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      city: city,
      ...(street ? { street: street } : {})
    },
    select: {
      business_id: true,
      name: true,
      city: true,
      user_id: true,
      status: true
    }
  });
}

async function seedLguBusinesses() {
  try {
    businessLogger.info('Starting LGU business seed...');

    // Read JSON file
    const dataPath = path.join(__dirname, '../data/lgu_businesses.json');
    businessLogger.info(`Loading from: ${dataPath}`);
    
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const businesses: LguBusiness[] = JSON.parse(rawData);

    businessLogger.info(`Loaded ${businesses.length} businesses from JSON`);

    let createdCount = 0;
    let skippedCount = 0;
    const errors: any[] = [];

    // Process each business
    for (const biz of businesses) {
      try {
        // Check if business already exists
        const existing = await findMatchingBusiness(biz.name, biz.city, biz.street);

        if (existing) {
          businessLogger.debug(`Skipping duplicate: ${biz.name} in ${biz.city}`);
          skippedCount++;
          continue;
        }

        // Create new business with LGU ownership
        const created = await prisma.business.create({
          data: {
            name: biz.name,
            house_number: biz.house_number || null,
            street: biz.street || null,
            brgy: biz.brgy || null,
            city: biz.city,
            latitude: biz.latitude,
            longtitude: biz.longtitude,
            description: biz.description,
            rating: parseFloat(biz.rating.toString()),
            min_price: biz.min_price,
            max_price: biz.max_price,
            picture: biz.picture,
            user_id: LGU_ADMIN_ID,
            status: 'LGU_REGISTERED',
            claimed_by_user_id: null,
            claimed_at: null,
            approved_by_user_id: null,
            approved_at: null,
            rejection_reason: null,
            google_authenticator: null
          }
        });

        businessLogger.debug(`Created: ${created.name} (ID: ${created.business_id})`);
        createdCount++;
      } catch (error: any) {
        businessLogger.error(`Error seeding ${biz.name}:`, error.message);
        errors.push({
          business: biz.name,
          error: error.message
        });
      }
    }

    businessLogger.info(
      `✅ Seed complete: ${createdCount} created, ${skippedCount} skipped, ${errors.length} errors`
    );

    if (errors.length > 0) {
      businessLogger.warn('Errors during seeding:', errors);
    }

    process.exit(0);
  } catch (error: any) {
    console.error('Fatal error during seed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error path:', error.path);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedLguBusinesses();
