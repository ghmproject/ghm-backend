/*
  Warnings:

  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "password",
ADD COLUMN     "magicToken" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
ALTER COLUMN "name" DROP NOT NULL;
