-- Budget-only visibility; all amounts and the category's manual order remain intact.
-- Apply before deploying the client that writes this flag.
ALTER TABLE public."Categories"
  ADD COLUMN IF NOT EXISTS "IsHiddenInBudget" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public."Categories"."IsHiddenInBudget" IS
  'Hide the category only in Edit Budget, across all years. Include its amounts in totals.';

-- Existing Categories RLS policies continue to restrict updates to the owner.
