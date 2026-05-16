/*
  Warnings:

  - You are about to drop the column `restaurantId` on the `votes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mealId,deviceId]` on the table `votes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mealId` to the `votes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_restaurantId_fkey";

-- AlterTable
ALTER TABLE "votes" DROP COLUMN "restaurantId",
ADD COLUMN     "mealId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "votes_mealId_deviceId_key" ON "votes"("mealId", "deviceId");

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
