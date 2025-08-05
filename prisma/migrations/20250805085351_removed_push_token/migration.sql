/*
  Warnings:

  - You are about to drop the column `pushToken` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_pushToken_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "pushToken";
