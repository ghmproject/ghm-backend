-- One report per user per meal
DELETE FROM "reports";

ALTER TABLE "reports" ADD COLUMN "userId" INTEGER NOT NULL;

ALTER TABLE "reports" ADD CONSTRAINT "reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "reports_mealId_userId_key" ON "reports"("mealId", "userId");
