-- =============================================================================
-- Step 7: Optional links between net worth liabilities and budget debt categories
-- Lets payoff timeline features use a liability balance together with a planned
-- monthly debt payment, without forcing existing users to backfill links.
-- =============================================================================

ALTER TABLE "NetWorthItems"
  ADD COLUMN IF NOT EXISTS "LinkedBudgetCategoryId" text NULL
  REFERENCES "Categories"("Id") ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION validate_net_worth_linked_budget_category()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW."LinkedBudgetCategoryId" IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW."Type" <> 'Liability' THEN
    RAISE EXCEPTION 'Only liabilities can link to budget debt categories';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "Categories" c
    WHERE c."Id" = NEW."LinkedBudgetCategoryId"
      AND c."UserId" = NEW."UserId"
      AND c."Type" = 'Debt'
  ) THEN
    RAISE EXCEPTION 'Linked budget category must be a debt category owned by the current user';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS networthitems_validate_linked_budget_category ON "NetWorthItems";

CREATE TRIGGER networthitems_validate_linked_budget_category
  BEFORE INSERT OR UPDATE ON "NetWorthItems"
  FOR EACH ROW EXECUTE FUNCTION validate_net_worth_linked_budget_category();
