-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "emailAddress" TEXT,
ADD COLUMN     "mobileNumber" TEXT,
ADD COLUMN     "validUntil" TIMESTAMP(3);

