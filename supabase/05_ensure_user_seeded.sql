-- =============================================================================
-- Step 5: Idempotent user seeding function (called from frontend on SIGNED_IN)
-- Safe alternative to the auth.users trigger — does not touch Supabase internals.
-- Exits immediately if the user already has data (fast no-op for existing users).
-- =============================================================================

CREATE OR REPLACE FUNCTION ensure_user_seeded()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   text := auth.uid()::text;
  v_year  int  := EXTRACT(YEAR  FROM NOW())::int;
  v_month int  := EXTRACT(MONTH FROM NOW())::int;
BEGIN
  -- Fast exit if already seeded
  IF EXISTS (SELECT 1 FROM "Settings" WHERE "UserId" = v_uid) THEN
    RETURN;
  END IF;

  -- Settings
  INSERT INTO "Settings" ("StartYear", "StartMonth", "Currency", "UserId")
  VALUES (v_year, v_month, '$', v_uid);

  -- Default accounts
  INSERT INTO "Accounts" ("Id", "Name", "Type", "OpeningBalance", "UserId") VALUES
    (gen_random_uuid()::text, 'Bank Account',   'Bank',        0, v_uid),
    (gen_random_uuid()::text, 'Cash on Hand',   'Cash',        0, v_uid),
    (gen_random_uuid()::text, 'Credit Card 1',  'Credit Card', 0, v_uid);

  -- Default budget categories
  INSERT INTO "Categories" ("Id", "Name", "Type", "Group", "Order", "UserId") VALUES
    (gen_random_uuid()::text, 'Employment (Net)',      'Income',   'Work Income',        0,  v_uid),
    (gen_random_uuid()::text, 'Side Hustle (Net)',     'Income',   'Work Income',        1,  v_uid),
    (gen_random_uuid()::text, 'Dividends (Net)',       'Income',   'Capital Income',     2,  v_uid),
    (gen_random_uuid()::text, 'Rent',                 'Expenses', 'Housing',            0,  v_uid),
    (gen_random_uuid()::text, 'Utilities',            'Expenses', 'Housing',            1,  v_uid),
    (gen_random_uuid()::text, 'Internet',             'Expenses', 'Housing',            2,  v_uid),
    (gen_random_uuid()::text, 'Groceries',            'Expenses', 'Groceries',          3,  v_uid),
    (gen_random_uuid()::text, 'Going Out',            'Expenses', 'Fun',                4,  v_uid),
    (gen_random_uuid()::text, 'Shopping',             'Expenses', 'Fun',                5,  v_uid),
    (gen_random_uuid()::text, 'Gym',                  'Expenses', 'Self-Care',          6,  v_uid),
    (gen_random_uuid()::text, 'Body Care & Medicine', 'Expenses', 'Self-Care',          7,  v_uid),
    (gen_random_uuid()::text, 'Car Gas',              'Expenses', 'Transportation',     8,  v_uid),
    (gen_random_uuid()::text, 'Metro Ticket',         'Expenses', 'Transportation',     9,  v_uid),
    (gen_random_uuid()::text, 'Netflix',              'Expenses', 'Entertainment',      10, v_uid),
    (gen_random_uuid()::text, 'Roth IRA',             'Savings',  'Retirement',         0,  v_uid),
    (gen_random_uuid()::text, 'Emergency Fund',       'Savings',  'Emergency',          1,  v_uid),
    (gen_random_uuid()::text, 'Stock Portfolio',      'Savings',  'Investments',        2,  v_uid),
    (gen_random_uuid()::text, 'Car Loan',             'Debt',     'Car Debt',           0,  v_uid),
    (gen_random_uuid()::text, 'Credit Card Debt',     'Debt',     'Credit Card Debt',   1,  v_uid),
    (gen_random_uuid()::text, 'Undergraduate Loan',   'Debt',     'Student Loan Debt',  2,  v_uid);
END;
$$;

GRANT EXECUTE ON FUNCTION ensure_user_seeded() TO authenticated;
