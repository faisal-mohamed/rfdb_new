-- CreateEnum
CREATE TYPE "public"."VendorQualificationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."VendorQualification" (
    "id" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "incorporationDate" TIMESTAMP(3) NOT NULL,
    "postalAddress" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "registeredOfficeLocation" TEXT NOT NULL,
    "bankersInfo" TEXT NOT NULL,
    "insurersInfo" TEXT NOT NULL,
    "businessDescription" TEXT NOT NULL,
    "companyAuditors" TEXT NOT NULL,
    "mainBusinessActivity" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "authorizedSignatories" TEXT[],
    "contactPersonName" TEXT NOT NULL,
    "contactPersonEmail" TEXT NOT NULL,
    "contactPersonPhone" TEXT NOT NULL,
    "totalEmployees" INTEGER NOT NULL,
    "managementTeam" INTEGER NOT NULL,
    "technicalTeam" INTEGER NOT NULL,
    "nonTechnicalTeam" INTEGER NOT NULL,
    "status" "public"."VendorQualificationStatus" NOT NULL DEFAULT 'DRAFT',
    "documentId" TEXT,
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VendorDirector" (
    "id" TEXT NOT NULL,
    "vendorQualificationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "contact" TEXT,

    CONSTRAINT "VendorDirector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VendorReference" (
    "id" TEXT NOT NULL,
    "vendorQualificationId" TEXT NOT NULL,
    "serialNumber" INTEGER NOT NULL,
    "bankName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "contactDetails" TEXT NOT NULL,
    "referenceLetterPath" TEXT,

    CONSTRAINT "VendorReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VendorPersonnel" (
    "id" TEXT NOT NULL,
    "vendorQualificationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "cvFilePath" TEXT,
    "cvContent" TEXT,

    CONSTRAINT "VendorPersonnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VendorDocument" (
    "id" TEXT NOT NULL,
    "vendorQualificationId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileContent" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorQualification_organizationName_idx" ON "public"."VendorQualification"("organizationName");

-- CreateIndex
CREATE INDEX "VendorQualification_status_idx" ON "public"."VendorQualification"("status");

-- CreateIndex
CREATE INDEX "VendorQualification_submittedBy_idx" ON "public"."VendorQualification"("submittedBy");

-- CreateIndex
CREATE INDEX "VendorQualification_documentId_idx" ON "public"."VendorQualification"("documentId");

-- CreateIndex
CREATE INDEX "VendorDirector_vendorQualificationId_idx" ON "public"."VendorDirector"("vendorQualificationId");

-- CreateIndex
CREATE INDEX "VendorReference_vendorQualificationId_idx" ON "public"."VendorReference"("vendorQualificationId");

-- CreateIndex
CREATE INDEX "VendorPersonnel_vendorQualificationId_idx" ON "public"."VendorPersonnel"("vendorQualificationId");

-- CreateIndex
CREATE INDEX "VendorDocument_vendorQualificationId_idx" ON "public"."VendorDocument"("vendorQualificationId");

-- CreateIndex
CREATE INDEX "VendorDocument_documentType_idx" ON "public"."VendorDocument"("documentType");

-- AddForeignKey
ALTER TABLE "public"."VendorQualification" ADD CONSTRAINT "VendorQualification_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorDirector" ADD CONSTRAINT "VendorDirector_vendorQualificationId_fkey" FOREIGN KEY ("vendorQualificationId") REFERENCES "public"."VendorQualification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorReference" ADD CONSTRAINT "VendorReference_vendorQualificationId_fkey" FOREIGN KEY ("vendorQualificationId") REFERENCES "public"."VendorQualification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorPersonnel" ADD CONSTRAINT "VendorPersonnel_vendorQualificationId_fkey" FOREIGN KEY ("vendorQualificationId") REFERENCES "public"."VendorQualification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorDocument" ADD CONSTRAINT "VendorDocument_vendorQualificationId_fkey" FOREIGN KEY ("vendorQualificationId") REFERENCES "public"."VendorQualification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

