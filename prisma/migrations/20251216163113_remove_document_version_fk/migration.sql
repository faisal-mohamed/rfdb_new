-- RemoveForeignKey
-- This migration removes the foreign key constraint on DocumentVersion.documentId
-- because documentId stores external process_id values that may not exist in the Document table
ALTER TABLE "public"."DocumentVersion" DROP CONSTRAINT IF EXISTS "DocumentVersion_documentId_fkey";


