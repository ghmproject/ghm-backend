/*
  Warnings:

  - You are about to drop the column `latitude` on the `meals` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `meals` table. All the data in the column will be lost.
  - Added the required column `latitude` to the `restaurants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `restaurants` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "meals" DROP COLUMN "latitude",
DROP COLUMN "longitude";

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL;
