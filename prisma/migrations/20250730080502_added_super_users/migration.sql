/*
  Warnings:

  - A unique constraint covering the columns `[verifaydaSub]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SuperUserRole" AS ENUM ('SUPER_ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "devicePublicKey" TEXT,
ADD COLUMN     "verifaydaSub" TEXT;

-- CreateTable
CREATE TABLE "SuperUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "role" "SuperUserRole" NOT NULL DEFAULT 'SUPER_ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuperUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuperUser_email_key" ON "SuperUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_verifaydaSub_key" ON "User"("verifaydaSub");
