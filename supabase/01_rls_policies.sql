-- =============================================================================
-- Step 1: Enable Row Level Security on all user-scoped tables
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
--
-- IMPORTANT: All column names are PascalCase (created by EF Core with double
-- quotes). auth.uid() returns uuid; "UserId" columns are text — always cast.
-- =============================================================================

-- ─── Accounts ────────────────────────────────────────────────────────────────
ALTER TABLE "Accounts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_select" ON "Accounts"
  FOR SELECT USING ("UserId" = auth.uid()::text);

CREATE POLICY "accounts_insert" ON "Accounts"
  FOR INSERT WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "accounts_update" ON "Accounts"
  FOR UPDATE USING ("UserId" = auth.uid()::text)
  WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "accounts_delete" ON "Accounts"
  FOR DELETE USING ("UserId" = auth.uid()::text);

-- ─── Categories ──────────────────────────────────────────────────────────────
ALTER TABLE "Categories" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select" ON "Categories"
  FOR SELECT USING ("UserId" = auth.uid()::text);

CREATE POLICY "categories_insert" ON "Categories"
  FOR INSERT WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "categories_update" ON "Categories"
  FOR UPDATE USING ("UserId" = auth.uid()::text)
  WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "categories_delete" ON "Categories"
  FOR DELETE USING ("UserId" = auth.uid()::text);

-- ─── Transactions ─────────────────────────────────────────────────────────────
ALTER TABLE "Transactions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select" ON "Transactions"
  FOR SELECT USING ("UserId" = auth.uid()::text);

CREATE POLICY "transactions_insert" ON "Transactions"
  FOR INSERT WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "transactions_update" ON "Transactions"
  FOR UPDATE USING ("UserId" = auth.uid()::text)
  WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "transactions_delete" ON "Transactions"
  FOR DELETE USING ("UserId" = auth.uid()::text);

-- ─── BudgetPlans ──────────────────────────────────────────────────────────────
ALTER TABLE "BudgetPlans" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_plans_select" ON "BudgetPlans"
  FOR SELECT USING ("UserId" = auth.uid()::text);

CREATE POLICY "budget_plans_insert" ON "BudgetPlans"
  FOR INSERT WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "budget_plans_update" ON "BudgetPlans"
  FOR UPDATE USING ("UserId" = auth.uid()::text)
  WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "budget_plans_delete" ON "BudgetPlans"
  FOR DELETE USING ("UserId" = auth.uid()::text);

-- ─── Settings ─────────────────────────────────────────────────────────────────
ALTER TABLE "Settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_select" ON "Settings"
  FOR SELECT USING ("UserId" = auth.uid()::text);

CREATE POLICY "settings_insert" ON "Settings"
  FOR INSERT WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "settings_update" ON "Settings"
  FOR UPDATE USING ("UserId" = auth.uid()::text)
  WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "settings_delete" ON "Settings"
  FOR DELETE USING ("UserId" = auth.uid()::text);
