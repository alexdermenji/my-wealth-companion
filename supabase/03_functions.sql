-- =============================================================================
-- Step 3: PostgreSQL functions for complex/atomic operations
-- All use SECURITY DEFINER so they run with elevated privileges but still
-- scope all queries to the calling user via auth.uid().
-- =============================================================================

-- ─── Transfer: create (atomic pair) ──────────────────────────────────────────
-- Replaces TransactionService.CreateTransferAsync
-- Returns the outflow row so the frontend has a Transaction to work with.
CREATE OR REPLACE FUNCTION create_transfer(
  p_date            date,
  p_amount          real,
  p_details         text,
  p_from_account_id text,
  p_to_account_id   text
)
RETURNS SETOF "Transactions"
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pair_id text := gen_random_uuid()::text;
  v_uid     text := auth.uid()::text;
  v_abs_amt real := abs(p_amount);
  v_outflow "Transactions"%ROWTYPE;
BEGIN
  -- Verify the user owns both accounts
  IF NOT EXISTS (SELECT 1 FROM "Accounts" WHERE "Id" = p_from_account_id AND "UserId" = v_uid) THEN
    RAISE EXCEPTION 'Account not found: %', p_from_account_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Accounts" WHERE "Id" = p_to_account_id AND "UserId" = v_uid) THEN
    RAISE EXCEPTION 'Account not found: %', p_to_account_id;
  END IF;

  INSERT INTO "Transactions" ("Id", "Date", "Amount", "Details", "AccountId", "BudgetType", "TransferPairId", "UserId")
  VALUES (gen_random_uuid()::text, p_date, -v_abs_amt, p_details, p_from_account_id, 'Transfer', v_pair_id, v_uid)
  RETURNING * INTO v_outflow;

  INSERT INTO "Transactions" ("Id", "Date", "Amount", "Details", "AccountId", "BudgetType", "TransferPairId", "UserId")
  VALUES (gen_random_uuid()::text, p_date, v_abs_amt, p_details, p_to_account_id, 'Transfer', v_pair_id, v_uid);

  RETURN NEXT v_outflow;
END;
$$;

-- ─── Transfer: delete (paired delete) ────────────────────────────────────────
-- Replaces the paired-delete logic in TransactionService.DeleteAsync.
-- Used for ALL transaction deletes (falls through to single delete if no pair).
CREATE OR REPLACE FUNCTION delete_transaction(p_transaction_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pair_id text;
  v_uid     text := auth.uid()::text;
BEGIN
  SELECT "TransferPairId" INTO v_pair_id
  FROM "Transactions"
  WHERE "Id" = p_transaction_id AND "UserId" = v_uid;

  IF v_pair_id IS NOT NULL THEN
    -- Delete both legs of the transfer atomically
    DELETE FROM "Transactions"
    WHERE "TransferPairId" = v_pair_id AND "UserId" = v_uid;
  ELSE
    -- No pair, delete only this transaction
    DELETE FROM "Transactions"
    WHERE "Id" = p_transaction_id AND "UserId" = v_uid;
  END IF;
END;
$$;

-- ─── Dashboard: summary ───────────────────────────────────────────────────────
-- Replaces DashboardService.GetSummaryAsync
-- Returns jsonb matching the DashboardSummary TypeScript type exactly.
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_year int, p_month int)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid    text := auth.uid()::text;
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'year',  p_year,
    'month', p_month,
    'breakdown', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'type',         bt,
          'totalTracked', COALESCE(type_agg.total_tracked, 0)::real,
          'totalBudget',  COALESCE(type_agg.total_budget, 0)::real,
          'items',        COALESCE(type_agg.items, '[]'::jsonb)
        )
      )
      FROM UNNEST(ARRAY['Income', 'Expenses', 'Savings', 'Debt']) AS bt
      LEFT JOIN LATERAL (
        WITH cats AS (
          SELECT
            c."Id",
            c."Name",
            c."Group",
            c."Order",
            COALESCE((
              SELECT SUM(ABS(t."Amount"))
              FROM "Transactions" t
              WHERE t."UserId" = v_uid
                AND t."BudgetPositionId" = c."Id"
                AND EXTRACT(YEAR  FROM t."Date")::int = p_year
                AND EXTRACT(MONTH FROM t."Date")::int = p_month
            ), 0) AS tracked,
            COALESCE((
              SELECT bp."Amount"
              FROM "BudgetPlans" bp
              WHERE bp."UserId" = v_uid
                AND bp."CategoryId" = c."Id"
                AND bp."Year"  = p_year
                AND bp."Month" = p_month
            ), 0) AS budget
          FROM "Categories" c
          WHERE c."UserId" = v_uid AND c."Type" = bt
          ORDER BY c."Order"
        )
        SELECT
          SUM(tracked)::real AS total_tracked,
          SUM(budget)::real  AS total_budget,
          COALESCE(jsonb_agg(
            jsonb_build_object(
              'categoryId',   "Id",
              'categoryName', "Name",
              'group',        "Group",
              'tracked',      tracked::real,
              'budget',       budget::real,
              'percentage',   CASE WHEN budget > 0
                                   THEN (tracked / budget * 100)::int
                                   ELSE 0
                              END
            )
            ORDER BY "Order"
          ), '[]'::jsonb) AS items
        FROM cats
      ) type_agg ON true
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ─── Dashboard: monthly comparison ───────────────────────────────────────────
-- Replaces DashboardService.GetMonthlyComparisonAsync
-- Returns jsonb matching the MonthlyComparison TypeScript type.
CREATE OR REPLACE FUNCTION get_monthly_comparison(p_year int)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       text := auth.uid()::text;
  v_months    text[] := ARRAY['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
BEGIN
  RETURN jsonb_build_object(
    'year', p_year,
    'months', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'month',     m.month_num,
          'monthName', v_months[m.month_num],
          'income',    COALESCE(m.income, 0)::real,
          'expenses',  COALESCE(m.expenses, 0)::real
        )
        ORDER BY m.month_num
      )
      FROM (
        SELECT
          gs.m AS month_num,
          SUM(CASE WHEN t."BudgetType" = 'Income'
                   THEN ABS(t."Amount") END) AS income,
          SUM(CASE WHEN t."BudgetType" = 'Expenses'
                   THEN ABS(t."Amount") END) AS expenses
        FROM generate_series(1, 12) gs(m)
        LEFT JOIN "Transactions" t
          ON t."UserId" = v_uid
         AND EXTRACT(YEAR  FROM t."Date")::int = p_year
         AND EXTRACT(MONTH FROM t."Date")::int = gs.m
        GROUP BY gs.m
      ) m
    )
  );
END;
$$;

-- ─── Category: reorder ────────────────────────────────────────────────────────
-- Replaces CategoryService.ReorderAsync
-- Renumbers all siblings in the same Type group, inserting target at p_new_order.
CREATE OR REPLACE FUNCTION reorder_category(p_category_id text, p_new_order int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid     text := auth.uid()::text;
  v_type    text;
  v_count   int;
  v_clamped int;
BEGIN
  SELECT "Type" INTO v_type
  FROM "Categories"
  WHERE "Id" = p_category_id AND "UserId" = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category not found: %', p_category_id;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM "Categories"
  WHERE "Type" = v_type AND "UserId" = v_uid AND "Id" <> p_category_id;

  v_clamped := GREATEST(0, LEAST(p_new_order, v_count));

  -- Rebuild order: siblings get consecutive positions around the target
  WITH
  siblings AS (
    SELECT "Id", ROW_NUMBER() OVER (ORDER BY "Order") - 1 AS rn
    FROM "Categories"
    WHERE "Type" = v_type AND "UserId" = v_uid AND "Id" <> p_category_id
  ),
  new_positions AS (
    SELECT "Id",
      CASE WHEN rn < v_clamped THEN rn ELSE rn + 1 END AS new_order
    FROM siblings
    UNION ALL
    SELECT p_category_id, v_clamped
  )
  UPDATE "Categories" c
  SET "Order" = np.new_order
  FROM new_positions np
  WHERE c."Id" = np."Id" AND c."UserId" = v_uid;
END;
$$;

-- ─── Budget plan: upsert ──────────────────────────────────────────────────────
-- Replaces BudgetPlanService.SetAmountAsync
-- Returns full year data for the category as { categoryId, year, months: { "1": 500, ... } }
CREATE OR REPLACE FUNCTION set_budget_amount(
  p_category_id text,
  p_year        int,
  p_month       int,
  p_amount      real
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid text := auth.uid()::text;
BEGIN
  INSERT INTO "BudgetPlans" ("CategoryId", "Year", "Month", "Amount", "UserId")
  VALUES (p_category_id, p_year, p_month, p_amount, v_uid)
  ON CONFLICT ("CategoryId", "Year", "Month", "UserId")
  DO UPDATE SET "Amount" = EXCLUDED."Amount";

  RETURN (
    SELECT jsonb_build_object(
      'categoryId', p_category_id,
      'year',       p_year,
      'months',     jsonb_object_agg("Month"::text, "Amount"::real)
    )
    FROM "BudgetPlans"
    WHERE "CategoryId" = p_category_id
      AND "Year"       = p_year
      AND "UserId"     = v_uid
  );
END;
$$;

-- ─── Category: usage count ────────────────────────────────────────────────────
-- Replaces GET /categories/{id}/usage
CREATE OR REPLACE FUNCTION get_category_usage(p_category_id text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'transactionCount', (
      SELECT COUNT(*) FROM "Transactions"
      WHERE "BudgetPositionId" = p_category_id
        AND "UserId" = auth.uid()::text
    ),
    'budgetPlanCount', (
      SELECT COUNT(*) FROM "BudgetPlans"
      WHERE "CategoryId" = p_category_id
        AND "UserId" = auth.uid()::text
    )
  );
$$;

-- ─── Category: force delete (atomic) ─────────────────────────────────────────
-- Replaces DELETE /categories/{id}?force=true
-- Nullifies FK references then deletes the category, all in one transaction.
CREATE OR REPLACE FUNCTION force_delete_category(p_category_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid text := auth.uid()::text;
BEGIN
  UPDATE "Transactions"
  SET "BudgetPositionId" = NULL
  WHERE "BudgetPositionId" = p_category_id AND "UserId" = v_uid;

  DELETE FROM "BudgetPlans"
  WHERE "CategoryId" = p_category_id AND "UserId" = v_uid;

  DELETE FROM "Categories"
  WHERE "Id" = p_category_id AND "UserId" = v_uid;
END;
$$;
