-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'REVOKED');

-- AlterTable
ALTER TABLE "Relationship" ADD COLUMN     "status" "RelationshipStatus" NOT NULL DEFAULT 'PENDING';
