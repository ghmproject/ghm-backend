-- AlterTable
ALTER TABLE "meals" ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false;
