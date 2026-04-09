-- =============================================================================
-- Step 4: Auto-seed default data for new users
-- Replaces UserSeedMiddleware + UserDataSeeder.SeedIfNewUserAsync
-- Fires ONCE when a new user signs up via Supabase Auth.
--
-- Existing users are unaffected — their data was already seeded by the .NET
-- middleware and lives in the database.
-- =============================================================================

CREATE OR REPLACE FUNCTION seed_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   text := NEW.id::text;
  v_year      int  := EXTRACT(YEAR  FROM NOW())::int;
  v_month     int  := EXTRACT(MONTH FROM NOW())::int;
BEGIN
  -- Settings (ON CONFLICT DO NOTHING = idempotent guard)
  INSERT INTO "Settings" ("StartYear", "StartMonth", "Currency", "UserId")
  VALUES (v_year, v_month, '$', v_user_id)
  ON CONFLICT DO NOTHING;

  -- Default accounts
  INSERT INTO "Accounts" ("Id", "Name", "Type", "OpeningBalance", "UserId") VALUES
    (gen_random_uuid()::text, 'Bank Account',   'Bank',          0, v_user_id),
    (gen_random_uuid()::text, 'Cash on Hand',   'Cash',          0, v_user_id),
    (gen_random_uuid()::text, 'Credit Card 1',  'Credit Card',   0, v_user_id);

  -- Default budget categories (20 total, Order matches C# seeder sequence)
  INSERT INTO "Categories" ("Id", "Name", "Type", "Group", "Order", "UserId") VALUES
    (gen_random_uuid()::text, 'Employment (Net)',      'Income',   'Work Income',        0,  v_user_id),
    (gen_random_uuid()::text, 'Side Hustle (Net)',     'Income',   'Work Income',        1,  v_user_id),
    (gen_random_uuid()::text, 'Dividends (Net)',       'Income',   'Capital Income',     2,  v_user_id),
    (gen_random_uuid()::text, 'Rent',                 'Expenses', 'Housing',            0,  v_user_id),
    (gen_random_uuid()::text, 'Utilities',            'Expenses', 'Housing',            1,  v_user_id),
    (gen_random_uuid()::text, 'Internet',             'Expenses', 'Housing',            2,  v_user_id),
    (gen_random_uuid()::text, 'Groceries',            'Expenses', 'Groceries',          3,  v_user_id),
    (gen_random_uuid()::text, 'Going Out',            'Expenses', 'Fun',                4,  v_user_id),
    (gen_random_uuid()::text, 'Shopping',             'Expenses', 'Fun',                5,  v_user_id),
    (gen_random_uuid()::text, 'Gym',                  'Expenses', 'Self-Care',          6,  v_user_id),
    (gen_random_uuid()::text, 'Body Care & Medicine', 'Expenses', 'Self-Care',          7,  v_user_id),
    (gen_random_uuid()::text, 'Car Gas',              'Expenses', 'Transportation',     8,  v_user_id),
    (gen_random_uuid()::text, 'Metro Ticket',         'Expenses', 'Transportation',     9,  v_user_id),
    (gen_random_uuid()::text, 'Netflix',              'Expenses', 'Entertainment',      10, v_user_id),
    (gen_random_uuid()::text, 'Roth IRA',             'Savings',  'Retirement',         0,  v_user_id),
    (gen_random_uuid()::text, 'Emergency Fund',       'Savings',  'Emergency',          1,  v_user_id),
    (gen_random_uuid()::text, 'Stock Portfolio',      'Savings',  'Investments',        2,  v_user_id),
    (gen_random_uuid()::text, 'Car Loan',             'Debt',     'Car Debt',           0,  v_user_id),
    (gen_random_uuid()::text, 'Credit Card Debt',     'Debt',     'Credit Card Debt',   1,  v_user_id),
    (gen_random_uuid()::text, 'Undergraduate Loan',   'Debt',     'Student Loan Debt',  2,  v_user_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION seed_new_user();
