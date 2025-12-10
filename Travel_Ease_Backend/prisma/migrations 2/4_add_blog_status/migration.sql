-- Add blog_status enum and status field to Blog table
-- Blog State Machine:
--   Draft: created but not published
--   Published: visible to public (default for existing rows)
--   Archived: soft-deleted, not visible (terminal state)

-- Create the enum type
CREATE TYPE "blog_status" AS ENUM ('Draft', 'Published', 'Archived');

-- Add status column with default 'Published' (existing blogs are published)
ALTER TABLE "Blog" ADD COLUMN "status" "blog_status" NOT NULL DEFAULT 'Published';

-- Create index for filtering by status
CREATE INDEX "idx_blog_status" ON "Blog"("status");

