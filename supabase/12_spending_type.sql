-- =============================================================================
-- Step 12: Add SpendingType (Want/Need) to Expenses categories
-- =============================================================================

-- Add column: NULL means "not applicable" (Income/Savings/Debt), 'need' is default for Expenses
ALTER TABLE "Categories"
  ADD COLUMN IF NOT EXISTS "SpendingType" TEXT CHECK ("SpendingType" IN ('need', 'want'));

-- Set all existing Expenses categories to 'need' as a safe default
UPDATE "Categories"
SET "SpendingType" = 'need'
WHERE "Type" = 'Expenses' AND "SpendingType" IS NULL;
