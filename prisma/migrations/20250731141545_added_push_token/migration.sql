/*
  Warnings:

  - A unique constraint covering the columns `[pushToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pushToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_pushToken_key" ON "User"("pushToken");
