-- Add has_email_identity flag to user table
-- This tracks whether a user can log in with email+password
-- For registered users (auth_provider='password'): always true
-- For Google OAuth users: false until they set a password, then true

-- Add the column with default false
ALTER TABLE "user" ADD COLUMN "has_email_identity" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: Set has_email_identity=true for all users with auth_provider='password'
-- These are users who registered with email/password
UPDATE "user" SET "has_email_identity" = true WHERE "auth_provider" = 'password';

-- Also set true for any user with a non-null password field (legacy/fallback)
UPDATE "user" SET "has_email_identity" = true WHERE "password" IS NOT NULL AND "has_email_identity" = false;

