-- AddForeignKey (idempotent - only add if it doesn't exist)
-- This migration is a duplicate of 20251216105230, so we make it conditional
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'DocumentVersion_documentId_fkey'
        AND conrelid = 'public."DocumentVersion"'::regclass
    ) THEN
        ALTER TABLE "public"."DocumentVersion" 
        ADD CONSTRAINT "DocumentVersion_documentId_fkey" 
        FOREIGN KEY ("documentId") 
        REFERENCES "public"."Document"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
