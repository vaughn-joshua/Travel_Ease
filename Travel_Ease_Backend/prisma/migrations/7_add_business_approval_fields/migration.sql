-- CreateEnum BusinessStatus
CREATE TYPE "BusinessStatus" AS ENUM ('LGU_REGISTERED', 'PENDING', 'APPROVED', 'REJECTED');

-- Add new columns to business table
ALTER TABLE "business" ADD COLUMN "claimed_by_user_id" INTEGER;
ALTER TABLE "business" ADD COLUMN "claimed_at" TIMESTAMP(3);
ALTER TABLE "business" ADD COLUMN "approved_by_user_id" INTEGER;
ALTER TABLE "business" ADD COLUMN "approved_at" TIMESTAMP(3);
ALTER TABLE "business" ADD COLUMN "rejection_reason" TEXT;

-- Convert existing status boolean to BusinessStatus enum
-- All existing businesses (status=true) become APPROVED (they were active)
-- Businesses with status=false become LGU_REGISTERED (preloaded but inactive)
ALTER TABLE "business" ADD COLUMN "status_new" "BusinessStatus";
UPDATE "business" SET "status_new" = CASE 
  WHEN "status" = true THEN 'APPROVED'::"BusinessStatus"
  ELSE 'LGU_REGISTERED'::"BusinessStatus"
END;

-- Drop old status column and rename new one
ALTER TABLE "business" DROP COLUMN "status";
ALTER TABLE "business" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "business" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"BusinessStatus";
ALTER TABLE "business" ALTER COLUMN "status" SET NOT NULL;

-- Add foreign keys for claim and approval relationships
ALTER TABLE "business" ADD CONSTRAINT "business_claimed_by_user_id_fkey" 
  FOREIGN KEY ("claimed_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "business" ADD CONSTRAINT "business_approved_by_user_id_fkey" 
  FOREIGN KEY ("approved_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Drop old index conflicting with new schema (if exists)
DROP INDEX IF EXISTS "idx_business_status_rating";

-- Add new indexes
CREATE INDEX "idx_business_claimed_by_user_id" ON "business"("claimed_by_user_id");
CREATE INDEX "idx_business_approved_by_user_id" ON "business"("approved_by_user_id");

-- Ensure business names are case-insensitive searchable with a separate index
CREATE INDEX "idx_business_name_lower_city" ON "business"(LOWER("name"), "city");
