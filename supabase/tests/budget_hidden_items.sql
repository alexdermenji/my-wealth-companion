-- Run with psql -v ON_ERROR_STOP=1 -f this-file in an EMPTY, DISPOSABLE database.
-- Minimal pre-migration schema plus the actual RLS and migration scripts.
-- Never run this fixture against the application database.
BEGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE TABLE "Categories" (
  "Id" text PRIMARY KEY, "UserId" text NOT NULL, "Name" text NOT NULL,
  "Type" text NOT NULL, "Group" text NOT NULL, "Order" int NOT NULL
);
CREATE TABLE "Accounts" ("UserId" text);
CREATE TABLE "Transactions" ("UserId" text);
CREATE TABLE "Settings" ("UserId" text);
CREATE TABLE "BudgetPlans" ("UserId" text, "CategoryId" text, "Year" int, "Amount" real);
INSERT INTO "Categories" VALUES
  ('mine', '11111111-1111-1111-1111-111111111111', 'Rent', 'Expenses', 'Bills', 0),
  ('theirs', '22222222-2222-2222-2222-222222222222', 'Food', 'Expenses', 'Bills', 1);
INSERT INTO "BudgetPlans" VALUES
  ('11111111-1111-1111-1111-111111111111', 'mine', 2026, 1200),
  ('11111111-1111-1111-1111-111111111111', 'mine', 2027, 1300);
\ir ../01_rls_policies.sql
\ir ../13_budget_hidden_items.sql
-- Applying again must be safe.
\ir ../13_budget_hidden_items.sql
GRANT USAGE ON SCHEMA public, auth TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "Categories" TO authenticated;
GRANT SELECT ON "BudgetPlans" TO authenticated;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "Categories" WHERE "IsHiddenInBudget" IS DISTINCT FROM false) THEN
    RAISE EXCEPTION 'Existing categories must be visible';
  END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
INSERT INTO "Categories" ("Id", "UserId", "Name", "Type", "Group", "Order")
VALUES ('new', auth.uid()::text, 'New', 'Expenses', 'Bills', 2);
UPDATE "Categories" SET "IsHiddenInBudget" = true WHERE "Id" = 'mine';
UPDATE "Categories" SET "IsHiddenInBudget" = true WHERE "Id" = 'mine';
DO $$ DECLARE changed int; BEGIN
  IF NOT (SELECT "IsHiddenInBudget" FROM "Categories" WHERE "Id" = 'mine') THEN
    RAISE EXCEPTION 'Hide must persist';
  END IF;
  IF (SELECT "IsHiddenInBudget" FROM "Categories" WHERE "Id" = 'new') THEN
    RAISE EXCEPTION 'New categories must be visible';
  END IF;
  IF (SELECT SUM("Amount") FROM "BudgetPlans") <> 2500 THEN
    RAISE EXCEPTION 'Hide must not alter amounts for any year';
  END IF;
  UPDATE "Categories" SET "IsHiddenInBudget" = true WHERE "Id" = 'theirs';
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 0 THEN RAISE EXCEPTION 'Cannot update another owner'; END IF;
  UPDATE "Categories" SET "Name" = 'New rent name' WHERE "Id" = 'mine';
  IF NOT (SELECT "IsHiddenInBudget" FROM "Categories" WHERE "Id" = 'mine') THEN
    RAISE EXCEPTION 'Editing name must preserve visibility';
  END IF;
  BEGIN
    UPDATE "Categories" SET "IsHiddenInBudget" = NULL WHERE "Id" = 'mine';
    RAISE EXCEPTION 'NULL must be rejected';
  EXCEPTION WHEN not_null_violation THEN NULL;
  END;
END $$;
-- Simulate a fresh authenticated client reading the same stored data.
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
DO $$ BEGIN
  IF NOT (SELECT "IsHiddenInBudget" FROM "Categories" WHERE "Id" = 'mine') THEN
    RAISE EXCEPTION 'A fresh client must see the saved visibility';
  END IF;
END $$;
UPDATE "Categories" SET "IsHiddenInBudget" = false WHERE "Id" = 'mine';
RESET ROLE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "Categories" WHERE "IsHiddenInBudget") THEN
    RAISE EXCEPTION 'Restore failed or another owner was changed';
  END IF;
  IF (SELECT "Order" FROM "Categories" WHERE "Id" = 'mine') <> 0 THEN
    RAISE EXCEPTION 'Visibility must not change manual order';
  END IF;
END $$;
ROLLBACK;
\echo 'Budget hidden items: migration, persistence, owner isolation and unchanged amounts PASS'
