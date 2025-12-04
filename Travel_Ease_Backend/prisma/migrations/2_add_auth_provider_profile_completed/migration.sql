-- Add auth_provider and profile_completed columns to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "auth_provider" VARCHAR(50);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "profile_completed" BOOLEAN NOT NULL DEFAULT false;

-- Update existing users: set profile_completed to true for users with password (legacy email/password users)
UPDATE "user" SET "profile_completed" = true WHERE "password" IS NOT NULL;

-- Update existing users: set auth_provider to 'email' for users with password
UPDATE "user" SET "auth_provider" = 'email' WHERE "password" IS NOT NULL AND "auth_provider" IS NULL;








