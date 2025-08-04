/*
  Warnings:

  - You are about to drop the column `requestedFields` on the `DataRequest` table. All the data in the column will be lost.
  - You are about to drop the column `devicePublicKey` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fcmToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DataRequest" DROP COLUMN "requestedFields";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "devicePublicKey",
ADD COLUMN     "fcmToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_fcmToken_key" ON "User"("fcmToken");
