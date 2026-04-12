-- =============================================================================
-- Step 6: Net Worth tables, RLS policies, triggers, and functions
-- Mirrors the Categories + BudgetPlans pattern for tracking assets/liabilities
-- over time with monthly granularity.
-- =============================================================================

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE "NetWorthItems" (
  "Id"     text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "Name"   text NOT NULL,
  "Group"  text NOT NULL DEFAULT '',
  "Type"   text NOT NULL CHECK ("Type" IN ('Asset', 'Liability')),
  "Order"  integer NOT NULL DEFAULT 0,
  "UserId" text NOT NULL
);

CREATE TABLE "NetWorthValues" (
  "ItemId" text    NOT NULL REFERENCES "NetWorthItems"("Id") ON DELETE CASCADE,
  "Year"   integer NOT NULL,
  "Month"  integer NOT NULL CHECK ("Month" BETWEEN 1 AND 12),
  "Amount" real    NOT NULL DEFAULT 0,
  "UserId" text    NOT NULL,
  PRIMARY KEY ("ItemId", "Year", "Month", "UserId")
);

-- ─── RLS Policies ────────────────────────────────────────────────────────────

ALTER TABLE "NetWorthItems" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "networthitems_select" ON "NetWorthItems"
  FOR SELECT USING ("UserId" = auth.uid()::text);

CREATE POLICY "networthitems_insert" ON "NetWorthItems"
  FOR INSERT WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "networthitems_update" ON "NetWorthItems"
  FOR UPDATE USING ("UserId" = auth.uid()::text)
  WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "networthitems_delete" ON "NetWorthItems"
  FOR DELETE USING ("UserId" = auth.uid()::text);


ALTER TABLE "NetWorthValues" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "networthvalues_select" ON "NetWorthValues"
  FOR SELECT USING ("UserId" = auth.uid()::text);

CREATE POLICY "networthvalues_insert" ON "NetWorthValues"
  FOR INSERT WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "networthvalues_update" ON "NetWorthValues"
  FOR UPDATE USING ("UserId" = auth.uid()::text)
  WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "networthvalues_delete" ON "NetWorthValues"
  FOR DELETE USING ("UserId" = auth.uid()::text);

-- ─── Auto-UserId Triggers ─────────────────────────────────────────────────────
-- Reuses the set_user_id() function defined in 02_auto_userid_trigger.sql

CREATE TRIGGER networthitems_set_user_id
  BEFORE INSERT ON "NetWorthItems"
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

CREATE TRIGGER networthvalues_set_user_id
  BEFORE INSERT ON "NetWorthValues"
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- ─── Functions ───────────────────────────────────────────────────────────────

-- Upsert a single monthly value and return the full year for that item.
-- Mirrors set_budget_amount().
CREATE OR REPLACE FUNCTION set_net_worth_value(
  p_item_id text,
  p_year    int,
  p_month   int,
  p_amount  real
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid text := auth.uid()::text;
BEGIN
  -- Verify the user owns the item
  IF NOT EXISTS (
    SELECT 1 FROM "NetWorthItems"
    WHERE "Id" = p_item_id AND "UserId" = v_uid
  ) THEN
    RAISE EXCEPTION 'NetWorthItem not found: %', p_item_id;
  END IF;

  INSERT INTO "NetWorthValues" ("ItemId", "Year", "Month", "Amount", "UserId")
  VALUES (p_item_id, p_year, p_month, p_amount, v_uid)
  ON CONFLICT ("ItemId", "Year", "Month", "UserId")
  DO UPDATE SET "Amount" = EXCLUDED."Amount";

  RETURN (
    SELECT jsonb_build_object(
      'itemId', p_item_id,
      'year',   p_year,
      'months', jsonb_object_agg("Month"::text, "Amount"::real)
    )
    FROM "NetWorthValues"
    WHERE "ItemId"  = p_item_id
      AND "Year"    = p_year
      AND "UserId"  = v_uid
  );
END;
$$;

-- Reorder all items of the same Type for a user, placing the target at
-- p_new_order. Mirrors reorder_category().
CREATE OR REPLACE FUNCTION reorder_net_worth_item(p_item_id text, p_new_order int)
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
  FROM "NetWorthItems"
  WHERE "Id" = p_item_id AND "UserId" = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NetWorthItem not found: %', p_item_id;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM "NetWorthItems"
  WHERE "Type" = v_type AND "UserId" = v_uid AND "Id" <> p_item_id;

  v_clamped := GREATEST(0, LEAST(p_new_order, v_count));

  WITH
  siblings AS (
    SELECT "Id", ROW_NUMBER() OVER (ORDER BY "Order") - 1 AS rn
    FROM "NetWorthItems"
    WHERE "Type" = v_type AND "UserId" = v_uid AND "Id" <> p_item_id
  ),
  new_positions AS (
    SELECT "Id",
      CASE WHEN rn < v_clamped THEN rn ELSE rn + 1 END AS new_order
    FROM siblings
    UNION ALL
    SELECT p_item_id, v_clamped
  )
  UPDATE "NetWorthItems" nwi
  SET "Order" = np.new_order
  FROM new_positions np
  WHERE nwi."Id" = np."Id" AND nwi."UserId" = v_uid;
END;
$$;
