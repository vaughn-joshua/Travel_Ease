-- This is the baseline migration for existing Supabase database
-- Run manually in Supabase SQL Editor to add new columns

-- Add new columns to user table
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS "auth_id" UUID UNIQUE,
ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(6) DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(6) DEFAULT NOW();

-- Make password nullable for Supabase Auth users
ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL;

-- Add unique constraints to favorites
ALTER TABLE "business_favorite" 
ADD CONSTRAINT IF NOT EXISTS "business_favorite_user_id_business_id_key" 
UNIQUE ("user_id", "business_id");

ALTER TABLE "travel_plan_favorite" 
ADD CONSTRAINT IF NOT EXISTS "travel_plan_favorite_user_id_travel_plan_id_key" 
UNIQUE ("user_id", "travel_plan_id");

-- Create trigger function for Supabase Auth integration (optional)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user (auth_id, email, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users (only if using Supabase Auth)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

