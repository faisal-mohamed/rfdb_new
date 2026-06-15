-- First, update any NULL values with default values (if any exist)
UPDATE "public"."Document" 
SET 
  "contactName" = COALESCE("contactName", 'N/A'),
  "designation" = COALESCE("designation", 'N/A'),
  "emailAddress" = COALESCE("emailAddress", 'noreply@example.com'),
  "mobileNumber" = COALESCE("mobileNumber", '0000000000'),
  "validUntil" = COALESCE("validUntil", CURRENT_TIMESTAMP + INTERVAL '1 year')
WHERE 
  "contactName" IS NULL 
  OR "designation" IS NULL 
  OR "emailAddress" IS NULL 
  OR "mobileNumber" IS NULL 
  OR "validUntil" IS NULL;

-- Now make the columns NOT NULL
ALTER TABLE "public"."Document" 
  ALTER COLUMN "contactName" SET NOT NULL,
  ALTER COLUMN "designation" SET NOT NULL,
  ALTER COLUMN "emailAddress" SET NOT NULL,
  ALTER COLUMN "mobileNumber" SET NOT NULL,
  ALTER COLUMN "validUntil" SET NOT NULL;














