-- =============================================================================
-- Step 2: Auto-stamp UserId on INSERT
-- Replaces EF Core's DbContext.StampUserId() / SaveChanges override.
-- The trigger fires BEFORE INSERT so RLS WITH CHECK passes after it runs.
-- =============================================================================

CREATE OR REPLACE FUNCTION set_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW."UserId" := auth.uid()::text;
  RETURN NEW;
END;
$$;

CREATE TRIGGER accounts_set_user_id
  BEFORE INSERT ON "Accounts"
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER categories_set_user_id
  BEFORE INSERT ON "Categories"
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER transactions_set_user_id
  BEFORE INSERT ON "Transactions"
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER budget_plans_set_user_id
  BEFORE INSERT ON "BudgetPlans"
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER settings_set_user_id
  BEFORE INSERT ON "Settings"
  FOR EACH ROW EXECUTE FUNCTION set_user_id();
