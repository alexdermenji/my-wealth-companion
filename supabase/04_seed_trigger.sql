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

  -- New users start with no categories — they build their own from scratch.

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION seed_new_user();
