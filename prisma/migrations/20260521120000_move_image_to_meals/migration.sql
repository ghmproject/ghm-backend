-- Move image from restaurants to meals (copy existing URLs to each meal at that restaurant)
ALTER TABLE "meals" ADD COLUMN "image" TEXT;

UPDATE "meals" AS m
SET "image" = r."image"
FROM "restaurants" AS r
WHERE m."restaurantId" = r."id"
  AND r."image" IS NOT NULL;

ALTER TABLE "restaurants" DROP COLUMN "image";
