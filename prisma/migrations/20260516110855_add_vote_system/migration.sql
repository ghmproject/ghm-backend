-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('UP', 'DOWN');

-- CreateTable
CREATE TABLE "votes" (
    "id" SERIAL NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "voteType" "VoteType" NOT NULL,
    "deviceId" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
