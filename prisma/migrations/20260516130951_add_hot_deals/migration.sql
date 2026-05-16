-- AlterTable
ALTER TABLE "meals" ADD COLUMN     "hotDealDescription" TEXT,
ADD COLUMN     "hotDealEndDateTime" TIMESTAMP(3),
ADD COLUMN     "hotDealStartDateTime" TIMESTAMP(3),
ADD COLUMN     "isHotDeal" BOOLEAN NOT NULL DEFAULT false;
