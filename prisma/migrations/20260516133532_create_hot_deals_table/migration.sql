/*
  Warnings:

  - You are about to drop the column `hotDealDescription` on the `meals` table. All the data in the column will be lost.
  - You are about to drop the column `hotDealEndDateTime` on the `meals` table. All the data in the column will be lost.
  - You are about to drop the column `hotDealStartDateTime` on the `meals` table. All the data in the column will be lost.
  - You are about to drop the column `isHotDeal` on the `meals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "meals" DROP COLUMN "hotDealDescription",
DROP COLUMN "hotDealEndDateTime",
DROP COLUMN "hotDealStartDateTime",
DROP COLUMN "isHotDeal";

-- CreateTable
CREATE TABLE "hot_deals" (
    "id" SERIAL NOT NULL,
    "mealId" INTEGER NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hot_deals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "hot_deals" ADD CONSTRAINT "hot_deals_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
