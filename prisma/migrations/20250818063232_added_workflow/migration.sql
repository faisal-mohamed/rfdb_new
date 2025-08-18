-- CreateEnum
CREATE TYPE "public"."WorkflowStatus" AS ENUM ('UPLOADED', 'PROCESSING_V1', 'V1_READY', 'V1_EDITING', 'V1_COMPLETED', 'PROCESSING_V2', 'V2_READY', 'V2_EDITING', 'V2_COMPLETED', 'APPROVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."VersionType" AS ENUM ('VERSION_1', 'VERSION_2');

-- CreateEnum
CREATE TYPE "public"."VersionStatus" AS ENUM ('GENERATED', 'EDITING', 'COMPLETED', 'APPROVED');

-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "workflowStatus" "public"."WorkflowStatus" NOT NULL DEFAULT 'UPLOADED';

-- CreateTable
CREATE TABLE "public"."DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionType" "public"."VersionType" NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "public"."VersionStatus" NOT NULL DEFAULT 'GENERATED',
    "jsonContent" JSONB NOT NULL,
    "externalApiRequestId" TEXT,
    "externalApiResponse" JSONB,
    "editedBy" TEXT,
    "editedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "generatedDocumentPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_idx" ON "public"."DocumentVersion"("documentId");

-- CreateIndex
CREATE INDEX "DocumentVersion_versionType_idx" ON "public"."DocumentVersion"("versionType");

-- CreateIndex
CREATE INDEX "DocumentVersion_status_idx" ON "public"."DocumentVersion"("status");

-- CreateIndex
CREATE INDEX "DocumentVersion_createdAt_idx" ON "public"."DocumentVersion"("createdAt");

-- CreateIndex
CREATE INDEX "Document_workflowStatus_idx" ON "public"."Document"("workflowStatus");

-- AddForeignKey
ALTER TABLE "public"."DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentVersion" ADD CONSTRAINT "DocumentVersion_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentVersion" ADD CONSTRAINT "DocumentVersion_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentVersion" ADD CONSTRAINT "DocumentVersion_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
