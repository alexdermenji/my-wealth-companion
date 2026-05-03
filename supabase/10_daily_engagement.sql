-- =============================================================================
-- Step 10: Daily engagement — check-ins, streaks, and task summary
-- DailyCheckIns stores explicit "nothing today" confirmations.
-- Transactions already on record count as implicit full-credit days.
-- =============================================================================

-- ─── Table ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "DailyCheckIns" (
  "Id"           text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "UserId"       text NOT NULL,
  "CheckInDate"  date NOT NULL,
  "ResponseType" text,
  -- values: 'spent' | 'no_spend' | 'passive' | NULL (legacy rows)
  UNIQUE ("UserId", "CheckInDate")
);

-- Add ResponseType to existing tables that predate this column
ALTER TABLE "DailyCheckIns" ADD COLUMN IF NOT EXISTS "ResponseType" text;

-- ─── RLS Policies ────────────────────────────────────────────────────────────

ALTER TABLE "DailyCheckIns" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dailycheckins_select" ON "DailyCheckIns";
CREATE POLICY "dailycheckins_select" ON "DailyCheckIns"
  FOR SELECT USING ("UserId" = auth.uid()::text);

DROP POLICY IF EXISTS "dailycheckins_insert" ON "DailyCheckIns";
CREATE POLICY "dailycheckins_insert" ON "DailyCheckIns"
  FOR INSERT WITH CHECK ("UserId" = auth.uid()::text);

DROP POLICY IF EXISTS "dailycheckins_delete" ON "DailyCheckIns";
CREATE POLICY "dailycheckins_delete" ON "DailyCheckIns"
  FOR DELETE USING ("UserId" = auth.uid()::text);

-- ─── Auto-UserId Trigger ─────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS dailycheckins_set_user_id ON "DailyCheckIns";
CREATE TRIGGER dailycheckins_set_user_id
  BEFORE INSERT ON "DailyCheckIns"
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- ─── complete_daily_checkin ───────────────────────────────────────────────────
-- Records a daily check-in for the calling user.
-- response_type: 'spent' | 'no_spend' | 'passive'
-- Idempotent: first write wins; subsequent calls on the same day are ignored.
CREATE OR REPLACE FUNCTION complete_daily_checkin(response_type text DEFAULT 'passive')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid text := auth.uid()::text;
BEGIN
  INSERT INTO "DailyCheckIns" ("UserId", "CheckInDate", "ResponseType")
  VALUES (v_uid, CURRENT_DATE, response_type)
  ON CONFLICT ("UserId", "CheckInDate") DO NOTHING;
END;
$$;

-- ─── get_engagement_summary ───────────────────────────────────────────────────
-- Returns streak data and the state of all dashboard task checklist items.
-- Credit rules:
--   full  = at least one transaction logged for that date
--   half  = DailyCheckIn row exists for that date (no transactions)
--   none  = no activity of any kind
-- Two independent streaks:
--   tracking  = consecutive days with at least one transaction logged
--   no-spend  = days since last expense transaction
CREATE OR REPLACE FUNCTION get_engagement_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid        text := auth.uid()::text;
  v_today      date := CURRENT_DATE;
  v_year       int  := EXTRACT(YEAR  FROM v_today)::int;
  v_month      int  := EXTRACT(MONTH FROM v_today)::int;
  v_next_year  int;
  v_next_month int;
  v_result     jsonb;
BEGIN
  IF v_month = 12 THEN
    v_next_year  := v_year + 1;
    v_next_month := 1;
  ELSE
    v_next_year  := v_year;
    v_next_month := v_month + 1;
  END IF;

  WITH

  -- ── Tracking streak ───────────────────────────────────────────────────────
  -- Distinct days with at least one transaction logged
  tx_days AS (
    SELECT DISTINCT "Date"::date AS day
    FROM   "Transactions"
    WHERE  "UserId" = v_uid
  ),

  -- Check-in days (explicit daily check-in, any response type)
  checkin_days AS (
    SELECT "CheckInDate" AS day
    FROM   "DailyCheckIns"
    WHERE  "UserId" = v_uid
  ),

  -- Credited days = transaction days OR check-in days
  credited_days AS (
    SELECT day FROM tx_days
    UNION
    SELECT day FROM checkin_days
  ),

  -- Today's transaction status (for distinguishing "logged" vs "checked_in")
  today_tx_logged AS (
    SELECT EXISTS (SELECT 1 FROM tx_days WHERE day = v_today) AS val
  ),

  -- Today's check-in status
  today_checkin AS (
    SELECT EXISTS (SELECT 1 FROM checkin_days WHERE day = v_today) AS val
  ),

  -- Today is credited if either a transaction or check-in exists
  today_credited AS (
    SELECT (SELECT val FROM today_tx_logged) OR (SELECT val FROM today_checkin) AS val
  ),

  -- Reference date: today if credited, yesterday if still pending
  tracking_ref AS (
    SELECT CASE WHEN (SELECT val FROM today_credited) THEN v_today ELSE v_today - 1 END AS ref_date
  ),

  -- Current tracking streak via offset match (uses credited_days)
  tracking_numbered AS (
    SELECT day, (ROW_NUMBER() OVER (ORDER BY day DESC) - 1)::int AS day_offset
    FROM   credited_days
    WHERE  day <= (SELECT ref_date FROM tracking_ref)
  ),
  tracking_current AS (
    SELECT COUNT(*)::int AS val
    FROM   tracking_numbered
    CROSS  JOIN tracking_ref
    WHERE  day = tracking_ref.ref_date - day_offset
  ),

  -- Longest tracking streak ever (gaps-and-islands, uses credited_days)
  tracking_grp AS (
    SELECT day, day - ROW_NUMBER() OVER (ORDER BY day)::int AS island
    FROM   credited_days
  ),
  tracking_longest AS (
    SELECT COALESCE(MAX(cnt), 0)::int AS val
    FROM (SELECT COUNT(*)::int AS cnt FROM tracking_grp GROUP BY island) s
  ),

  -- Last 28 days logged status for activity board (credited = tx OR check-in)
  recent_days AS (
    SELECT
      d::date AS day,
      EXISTS (SELECT 1 FROM credited_days c WHERE c.day = d::date) AS logged
    FROM generate_series(v_today - 27, v_today, '1 day'::interval) d
  ),

  -- ── No-spend streak ───────────────────────────────────────────────────────
  -- Days since the last expense transaction (= current no-spend streak)
  last_expense AS (
    SELECT MAX("Date"::date) AS last_date
    FROM   "Transactions"
    WHERE  "UserId" = v_uid AND "BudgetType" = 'Expenses'
  ),
  no_spend_current AS (
    SELECT
      CASE
        WHEN last_date IS NULL          THEN 0
        WHEN last_date = v_today        THEN 0
        ELSE (v_today - last_date)::int
      END AS val,
      CASE
        WHEN last_date = v_today THEN 'spent'
        ELSE 'no-spend'
      END AS today_status
    FROM last_expense
  ),

  -- Longest no-spend streak = longest gap between consecutive expense dates
  expense_dates AS (
    SELECT DISTINCT "Date"::date AS expense_day
    FROM   "Transactions"
    WHERE  "UserId" = v_uid AND "BudgetType" = 'Expenses'
  ),
  expense_gaps AS (
    SELECT (expense_day - LAG(expense_day) OVER (ORDER BY expense_day) - 1)::int AS gap
    FROM   expense_dates
  ),
  no_spend_longest AS (
    SELECT COALESCE(MAX(gap), 0)::int AS val
    FROM   expense_gaps
    WHERE  gap > 0
  ),

  -- ── Insights ──────────────────────────────────────────────────────────────
  -- Total of all transactions logged since Monday (what the user "tracked" this week)
  weekly_tracked AS (
    SELECT COALESCE(SUM(ABS("Amount")), 0)::real AS val
    FROM   "Transactions"
    WHERE  "UserId" = v_uid
      AND  "Date"::date >= date_trunc('week', v_today::timestamp)::date
  ),

  -- Average daily expense over the last 30 days (total / 30 including zero days)
  -- Used to estimate savings during a no-spend streak on the frontend
  avg_daily_spend AS (
    SELECT COALESCE(
      (
        SELECT SUM(ABS("Amount"))
        FROM   "Transactions"
        WHERE  "UserId" = v_uid
          AND  "BudgetType" = 'Expenses'
          AND  "Date"::date >= v_today - 30
          AND  "Date"::date <  v_today
      ) / 30.0,
      0
    )::real AS val
  ),

  -- ── Tasks ─────────────────────────────────────────────────────────────────
  last_tx AS (
    SELECT MAX("Date"::date) AS last_date
    FROM   "Transactions"
    WHERE  "UserId" = v_uid
  ),
  over_budget AS (
    SELECT
      c."Name",
      COALESCE(SUM(ABS(t."Amount")), 0)::real AS tracked,
      COALESCE(MAX(bp."Amount"), 0)::real      AS budget
    FROM "Categories" c
    LEFT JOIN "BudgetPlans" bp
      ON  bp."CategoryId" = c."Id"
      AND bp."UserId"     = v_uid
      AND bp."Year"       = v_year
      AND bp."Month"      = v_month
    LEFT JOIN "Transactions" t
      ON  t."BudgetPositionId" = c."Id"
      AND t."UserId"           = v_uid
      AND EXTRACT(YEAR  FROM t."Date")::int = v_year
      AND EXTRACT(MONTH FROM t."Date")::int = v_month
    WHERE c."UserId" = v_uid AND c."Type" = 'Expenses'
    GROUP BY c."Name"
    HAVING COALESCE(MAX(bp."Amount"), 0) > 0
       AND COALESCE(SUM(ABS(t."Amount")), 0) > COALESCE(MAX(bp."Amount"), 0)
  )

  SELECT jsonb_build_object(
    'streak', jsonb_build_object(
      'tracking', jsonb_build_object(
        'currentStreak', (SELECT val FROM tracking_current),
        'longestStreak', (SELECT val FROM tracking_longest),
        'todayStatus',   CASE
                           WHEN (SELECT val FROM today_tx_logged) THEN 'logged'
                           WHEN (SELECT val FROM today_checkin)   THEN 'checked_in'
                           ELSE 'pending'
                         END,
        'recentDays', (
          SELECT jsonb_agg(jsonb_build_object('date', day, 'logged', logged) ORDER BY day)
          FROM recent_days
        )
      ),
      'noSpend', jsonb_build_object(
        'currentStreak', (SELECT val FROM no_spend_current),
        'longestStreak', (SELECT val FROM no_spend_longest),
        'todayStatus',   (SELECT today_status FROM no_spend_current)
      )
    ),
    'tasks', jsonb_build_object(
      'daysSinceLastTransaction', (
        SELECT CASE WHEN last_date IS NULL THEN NULL ELSE (v_today - last_date)::int END
        FROM last_tx
      ),
      'overBudgetCategories', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object('name', "Name", 'overspend', (tracked - budget)::real)
        ), '[]'::jsonb)
        FROM over_budget
      ),
      'nextMonthBudgetFilled', EXISTS (
        SELECT 1 FROM "BudgetPlans"
        WHERE  "UserId" = v_uid AND "Year" = v_next_year AND "Month" = v_next_month
      ),
      'currentMonthNetWorthFilled', EXISTS (
        SELECT 1 FROM "NetWorthValues"
        WHERE  "UserId" = v_uid AND "Year" = v_year AND "Month" = v_month
      )
    ),
    'insights', jsonb_build_object(
      'weeklyTrackedTotal', (SELECT val FROM weekly_tracked),
      'avgDailySpend',      (SELECT val FROM avg_daily_spend)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION complete_daily_checkin(text)  TO authenticated;
GRANT EXECUTE ON FUNCTION get_engagement_summary()  TO authenticated;
