-- Align DB with simplified community post (idempotent where possible)

ALTER TABLE "community_posts" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'Finds';

ALTER TABLE "community_posts" DROP COLUMN IF EXISTS "isHotDeal";
ALTER TABLE "community_posts" DROP COLUMN IF EXISTS "restaurantName";
ALTER TABLE "community_posts" DROP COLUMN IF EXISTS "mealName";
ALTER TABLE "community_posts" DROP COLUMN IF EXISTS "suburb";
ALTER TABLE "community_posts" DROP COLUMN IF EXISTS "price";
