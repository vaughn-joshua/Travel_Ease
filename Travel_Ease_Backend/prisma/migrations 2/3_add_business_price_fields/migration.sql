-- Add min_price and max_price columns to business table
ALTER TABLE "business" ADD COLUMN IF NOT EXISTS "min_price" INTEGER;
ALTER TABLE "business" ADD COLUMN IF NOT EXISTS "max_price" INTEGER;

-- Backfill min_price and max_price from price_range via business_category -> subcategory
-- This aggregates MIN(min_price) and MAX(max_price) across all price_ranges
-- for each business's subcategories
UPDATE "business" b
SET 
  min_price = agg.min_price,
  max_price = agg.max_price
FROM (
  SELECT 
    bc.business_id,
    MIN(pr.min_price) AS min_price,
    MAX(pr.max_price) AS max_price
  FROM "business_category" bc
  JOIN "subcategory" sc ON sc.subcategory_id = bc.subcategory_id
  JOIN "price_range" pr ON pr.subcategory_id = sc.subcategory_id
  WHERE bc.business_id IS NOT NULL
  GROUP BY bc.business_id
) agg
WHERE b.business_id = agg.business_id;

-- Note: price_range table is intentionally left intact for rollback safety.
-- It will be dropped in a future migration after verification.
