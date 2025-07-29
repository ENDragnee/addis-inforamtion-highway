/*
  Warnings:

  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `faydaSub` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `picture` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[externalId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `externalId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DataRequestStatus" AS ENUM ('INITIATED', 'AWAITING_CONSENT', 'APPROVED', 'DENIED', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InstitutionUserRole" AS ENUM ('ADMIN', 'MEMBER');

-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "User_faydaSub_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
DROP COLUMN "faydaSub",
DROP COLUMN "name",
DROP COLUMN "picture",
ADD COLUMN     "externalId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roleId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecretHash" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "apiEndpoint" TEXT NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "role" "InstitutionUserRole" NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "InstitutionUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requesterRoleId" TEXT NOT NULL,
    "providerRoleId" TEXT NOT NULL,
    "dataSchemaId" TEXT NOT NULL,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSchema" (
    "id" TEXT NOT NULL,
    "schemaId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSchema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requesterId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "dataOwnerId" TEXT NOT NULL,
    "dataSchemaId" TEXT NOT NULL,
    "status" "DataRequestStatus" NOT NULL DEFAULT 'INITIATED',
    "consentTokenJti" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "failureReason" TEXT,

    CONSTRAINT "DataRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institution_name_key" ON "Institution"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_clientId_key" ON "Institution"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionUser_email_key" ON "InstitutionUser"("email");

-- CreateIndex
CREATE INDEX "InstitutionUser_institutionId_idx" ON "InstitutionUser"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_requesterRoleId_providerRoleId_dataSchemaId_key" ON "Relationship"("requesterRoleId", "providerRoleId", "dataSchemaId");

-- CreateIndex
CREATE UNIQUE INDEX "DataSchema_schemaId_key" ON "DataSchema"("schemaId");

-- CreateIndex
CREATE UNIQUE INDEX "DataRequest_consentTokenJti_key" ON "DataRequest"("consentTokenJti");

-- CreateIndex
CREATE UNIQUE INDEX "User_externalId_key" ON "User"("externalId");

-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionUser" ADD CONSTRAINT "InstitutionUser_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_requesterRoleId_fkey" FOREIGN KEY ("requesterRoleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_providerRoleId_fkey" FOREIGN KEY ("providerRoleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_dataSchemaId_fkey" FOREIGN KEY ("dataSchemaId") REFERENCES "DataSchema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRequest" ADD CONSTRAINT "DataRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRequest" ADD CONSTRAINT "DataRequest_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRequest" ADD CONSTRAINT "DataRequest_dataOwnerId_fkey" FOREIGN KEY ("dataOwnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRequest" ADD CONSTRAINT "DataRequest_dataSchemaId_fkey" FOREIGN KEY ("dataSchemaId") REFERENCES "DataSchema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
