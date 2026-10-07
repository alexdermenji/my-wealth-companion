-- EMPTY DISPOSABLE DATABASE ONLY. Never run against production.
\set ON_ERROR_STOP on
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE FUNCTION set_user_id() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW."UserId" := auth.uid()::text; RETURN NEW; END $$;
\ir ../06_net_worth.sql
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
INSERT INTO "NetWorthItems" ("Id", "Name", "Type") VALUES
('paid', 'Paid loan', 'Liability'), ('open', 'Open loan', 'Liability'),
('asset', 'Savings', 'Asset'), ('empty', 'New debt', 'Liability');
INSERT INTO "NetWorthValues" ("ItemId", "Year", "Month", "Amount") VALUES
('paid', 2020, 1, 100), ('paid', 2020, 2, 0),
('open', 2020, 1, 100), ('open', 2099, 1, 0), ('asset', 2020, 1, 0);
\ir ../17_net_worth_hidden_items.sql
DO $$ BEGIN
 IF (SELECT array_agg("Id" ORDER BY "Id") FROM "NetWorthItems" WHERE "IsHidden") <> ARRAY['paid'] THEN
 RAISE EXCEPTION 'Backfill must hide only paid debts, ignoring future forecasts and empty items'; END IF;
END $$;
UPDATE "NetWorthItems" SET "IsHidden" = false WHERE "Id" = 'paid';
\ir ../17_net_worth_hidden_items.sql
DO $$ BEGIN
 IF (SELECT "IsHidden" FROM "NetWorthItems" WHERE "Id" = 'paid') THEN RAISE EXCEPTION 'Repeat migration undid restore'; END IF;
END $$;
GRANT USAGE ON SCHEMA public, auth TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "NetWorthItems", "NetWorthValues" TO authenticated;
SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
INSERT INTO "NetWorthItems" ("Id", "Name", "Type") VALUES ('other', 'Other loan', 'Liability');
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
SET ROLE authenticated;
SELECT set_net_worth_value('paid', 2020, 3, 500);
SELECT set_net_worth_value('paid', 2020, 1, 0);
DO $$ BEGIN
 IF (SELECT "IsHidden" FROM "NetWorthItems" WHERE "Id" = 'paid') THEN RAISE EXCEPTION 'Historical correction hid active loan'; END IF;
END $$;
SELECT set_net_worth_value('paid', 2020, 4, 0);
DO $$ DECLARE changed int; BEGIN
 IF NOT (SELECT "IsHidden" FROM "NetWorthItems" WHERE "Id" = 'paid') THEN RAISE EXCEPTION 'Payoff did not hide loan'; END IF;
 UPDATE "NetWorthItems" SET "IsHidden" = false WHERE "Id" = 'paid';
 IF (SELECT "IsHidden" FROM "NetWorthItems" WHERE "Id" = 'paid') THEN RAISE EXCEPTION 'Restore failed'; END IF;
 UPDATE "NetWorthItems" SET "IsHidden" = true WHERE "Id" = 'asset';
 UPDATE "NetWorthItems" SET "Name" = 'Renamed' WHERE "Id" = 'asset';
 IF NOT (SELECT "IsHidden" FROM "NetWorthItems" WHERE "Id" = 'asset') THEN RAISE EXCEPTION 'Edit undid hide'; END IF;
 UPDATE "NetWorthItems" SET "IsHidden" = true WHERE "Id" = 'other';
 GET DIAGNOSTICS changed = ROW_COUNT;
 IF changed <> 0 THEN RAISE EXCEPTION 'Owner isolation failed'; END IF;
 IF (SELECT "Amount" FROM "NetWorthValues" WHERE "ItemId" = 'paid' AND "Month" = 3) <> 500 THEN RAISE EXCEPTION 'History altered'; END IF;
END $$;
SELECT set_net_worth_value('asset', 2020, 2, 100);
DO $$ BEGIN
 IF NOT (SELECT "IsHidden" FROM "NetWorthItems" WHERE "Id" = 'asset') THEN RAISE EXCEPTION 'Asset save undid manual hide'; END IF;
END $$;
RESET ROLE;
\echo 'PASS: payoff, restore, new loan, history, future forecasts, repeatability, assets and owner isolation'
