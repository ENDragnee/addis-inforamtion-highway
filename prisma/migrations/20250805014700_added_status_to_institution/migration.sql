-- CreateEnum
CREATE TYPE "InstitutionStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "status" "InstitutionStatus" NOT NULL DEFAULT 'ACTIVE';
