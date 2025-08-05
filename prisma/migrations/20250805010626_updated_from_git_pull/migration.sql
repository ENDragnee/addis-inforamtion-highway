/*
  Warnings:

  - You are about to drop the column `clientSecretHash` on the `Institution` table. All the data in the column will be lost.
  - You are about to drop the `InstitutionUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `relationshipId` to the `DataRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SignatureType" AS ENUM ('REQUESTER', 'PLATFORM', 'PROVIDER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DataRequestStatus" ADD VALUE 'VERIFIED';
ALTER TYPE "DataRequestStatus" ADD VALUE 'DELIVERED';

-- DropForeignKey
ALTER TABLE "InstitutionUser" DROP CONSTRAINT "InstitutionUser_institutionId_fkey";

-- AlterTable
ALTER TABLE "DataRequest" ADD COLUMN     "dataHash" TEXT,
ADD COLUMN     "relationshipId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Institution" DROP COLUMN "clientSecretHash";

-- DropTable
DROP TABLE "InstitutionUser";

-- DropEnum
DROP TYPE "InstitutionUserRole";

-- CreateTable
CREATE TABLE "DataRequestSignature" (
    "id" TEXT NOT NULL,
    "dataRequestId" TEXT NOT NULL,
    "type" "SignatureType" NOT NULL,
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataRequestSignature_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DataRequest" ADD CONSTRAINT "DataRequest_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRequestSignature" ADD CONSTRAINT "DataRequestSignature_dataRequestId_fkey" FOREIGN KEY ("dataRequestId") REFERENCES "DataRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
