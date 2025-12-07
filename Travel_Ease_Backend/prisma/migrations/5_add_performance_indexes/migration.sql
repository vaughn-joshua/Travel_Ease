-- Performance indexes for query optimization
-- These indexes address slow queries identified in Supabase Analyze dashboard

-- ============================================================================
-- Business Table Indexes
-- Used by: /travel_spots endpoint
-- ============================================================================

-- city: Used in ILIKE search filter
CREATE INDEX IF NOT EXISTS "idx_business_city" ON "business"("city");

-- rating: Used in ORDER BY clause
CREATE INDEX IF NOT EXISTS "idx_business_rating" ON "business"("rating" DESC NULLS LAST);

-- Composite: Common query pattern for active businesses sorted by rating
CREATE INDEX IF NOT EXISTS "idx_business_status_rating" ON "business"("status", "rating" DESC NULLS LAST);

-- Price filtering: Used in price range overlap queries
CREATE INDEX IF NOT EXISTS "idx_business_min_price" ON "business"("min_price");
CREATE INDEX IF NOT EXISTS "idx_business_max_price" ON "business"("max_price");

-- ============================================================================
-- Business Related Tables - FK Indexes for Joins
-- ============================================================================

-- BusinessCategory: FK for joining with Business
CREATE INDEX IF NOT EXISTS "idx_business_category_business_id" ON "business_category"("business_id");

-- BusinessHours: FK for joining with Business
CREATE INDEX IF NOT EXISTS "idx_business_hours_business_id" ON "business_hours"("business_id");

-- BusinessReview: FK for groupBy and joins
CREATE INDEX IF NOT EXISTS "idx_business_review_business_id" ON "business_review"("business_id");
CREATE INDEX IF NOT EXISTS "idx_business_review_user_id" ON "business_review"("user_id");
CREATE INDEX IF NOT EXISTS "idx_business_review_date" ON "business_review"("review_date" DESC NULLS LAST);

-- MenuItem: FK for joining with Business
CREATE INDEX IF NOT EXISTS "idx_menu_item_business_id" ON "menu_item"("business_id");

-- ============================================================================
-- Travel Plan Indexes
-- Used by: /public_plans, /plans endpoints
-- ============================================================================

-- visibility_timestamp: Used in ORDER BY for public plans
CREATE INDEX IF NOT EXISTS "idx_travel_plan_visibility_timestamp" ON "travel_plan"("visibility_timestamp" DESC NULLS LAST);

-- visibility_end_date: Used in WHERE clause for expiry filtering
CREATE INDEX IF NOT EXISTS "idx_travel_plan_visibility_end_date" ON "travel_plan"("visibility_end_date");

-- Composite: Optimized for public plans query (visibility + status + ordering)
CREATE INDEX IF NOT EXISTS "idx_travel_plan_public_query" ON "travel_plan"("visibility", "status", "visibility_timestamp" DESC NULLS LAST);

-- ============================================================================
-- Travel Plan Review Indexes
-- ============================================================================

-- FK indexes for joins
CREATE INDEX IF NOT EXISTS "idx_travel_plan_review_plan_id" ON "travel_plan_review"("travel_plan_id");
CREATE INDEX IF NOT EXISTS "idx_travel_plan_review_user_id" ON "travel_plan_review"("user_id");

