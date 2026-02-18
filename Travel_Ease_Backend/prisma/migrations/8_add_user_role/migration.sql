-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('SUPER_ADMIN', 'LGU_ADMIN', 'BUSINESS_OWNER', 'TRAVEL_AGENCY', 'USER');

-- AlterTable
ALTER TABLE "user" ADD COLUMN "role" "user_role";

-- Add default value for existing records
UPDATE "user" SET "role" = 'USER' WHERE "role" IS NULL;

-- Make the column NOT NULL after populating
ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL;
