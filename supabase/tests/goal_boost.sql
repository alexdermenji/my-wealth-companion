-- Run only in an EMPTY DISPOSABLE database. This fixture creates and drops its schema.
DO $$ BEGIN IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF; IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF; END $$;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
CREATE TABLE "Categories"("Id" text PRIMARY KEY,"UserId" text NOT NULL,"Name" text,"Type" text);
CREATE TABLE "Accounts"("Id" text PRIMARY KEY,"UserId" text NOT NULL);
CREATE TABLE "Transactions"("Id" text PRIMARY KEY,"UserId" text NOT NULL,"Date" timestamptz,"Amount" real,"Details" text,"AccountId" text,"BudgetType" text,"BudgetPositionId" text,"TransferPairId" text);
\ir ../15_goal_boost.sql
\ir ../15_goal_boost.sql
GRANT USAGE ON SCHEMA public,auth TO authenticated;
GRANT SELECT,UPDATE,DELETE ON "Transactions" TO authenticated;
INSERT INTO "Categories" VALUES ('debt','11111111-1111-1111-1111-111111111111','Card','Debt'),('saving','11111111-1111-1111-1111-111111111111','Reserve','Savings'),('income','11111111-1111-1111-1111-111111111111','Gift','Income'),('foreign','22222222-2222-2222-2222-222222222222','Other','Debt');
INSERT INTO "Accounts" VALUES ('bank','11111111-1111-1111-1111-111111111111');
INSERT INTO "Transactions" VALUES ('income-tx','11111111-1111-1111-1111-111111111111',current_date,100,'Gift','bank','Income','income',NULL),('debt-tx','11111111-1111-1111-1111-111111111111',current_date,-100,'Card payment','bank','Debt','debt',NULL);
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
DO $$ DECLARE g jsonb; old_goal uuid; data jsonb; n int; BEGIN
 g:=goal_boost_command('goal','{"categoryId":"debt"}'); old_goal:=(g->>'id')::uuid;
 data:=jsonb_build_object('id','aaaaaaaa-0000-0000-0000-000000000001','kind','saved','amount',4,'description','Asda','date',current_date,'faceValue',100,'paid',96);
 PERFORM goal_boost_command('add',data); PERFORM goal_boost_command('add',data);
 IF (SELECT count(*) FROM "GoalBoostEntries")<>1 THEN RAISE EXCEPTION 'Retry duplicated saving'; END IF;
 PERFORM goal_boost_command('add',jsonb_build_object('id','aaaaaaaa-0000-0000-0000-000000000002','kind','received','amount',30,'transactionId','income-tx'));
 PERFORM goal_boost_command('add',jsonb_build_object('id','aaaaaaaa-0000-0000-0000-000000000003','kind','contribution','amount',15,'transactionId','debt-tx','goalId',old_goal));
 IF (SELECT sum(CASE WHEN kind='contribution' THEN -amount ELSE amount END) FROM "GoalBoostEntries")<>19 THEN RAISE EXCEPTION 'Partial allocation wrong'; END IF;
 BEGIN
  PERFORM goal_boost_command('add',jsonb_build_object('id',gen_random_uuid(),'kind','contribution','amount',20,'transactionId','debt-tx','goalId',old_goal));
  RAISE EXCEPTION 'Overspend accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Overspend accepted' THEN RAISE; END IF; END;
 BEGIN
  DELETE FROM "Transactions" WHERE "Id"='debt-tx'; RAISE EXCEPTION 'Delete accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Delete accepted' THEN RAISE; END IF; END;
 BEGIN
  UPDATE "Transactions" SET "Amount"=-10 WHERE "Id"='debt-tx'; RAISE EXCEPTION 'Reduction accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Reduction accepted' THEN RAISE; END IF; END;
 UPDATE "Transactions" SET "Details"='Updated payment' WHERE "Id"='debt-tx';
 IF (SELECT description FROM "GoalBoostEntries" WHERE kind='contribution')<>'Updated payment' THEN RAISE EXCEPTION 'Metadata stale'; END IF;
 BEGIN
  PERFORM goal_boost_command('remove','{"id":"aaaaaaaa-0000-0000-0000-000000000002"}'); RAISE EXCEPTION 'Negative balance accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Negative balance accepted' THEN RAISE; END IF; END;
 PERFORM goal_boost_command('goal','{"categoryId":"saving"}');
 IF (SELECT goal_id FROM "GoalBoostEntries" WHERE kind='contribution')<>old_goal THEN RAISE EXCEPTION 'History moved'; END IF;
 IF (SELECT count(*) FROM "GoalBoostGoals" WHERE active)<>1 THEN RAISE EXCEPTION 'Multiple goals'; END IF;
 PERFORM goal_boost_command('remove','{"id":"aaaaaaaa-0000-0000-0000-000000000003"}');
 IF NOT EXISTS(SELECT 1 FROM "Transactions" WHERE "Id"='debt-tx') THEN RAISE EXCEPTION 'Unlink deleted transaction'; END IF;
 data:=jsonb_build_object('id','aaaaaaaa-0000-0000-0000-000000000004','kind','received','amount',10,'transactionAmount',50,'accountId','bank','categoryId','income','description','New gift','date',current_date);
 SELECT count(*) INTO n FROM "Transactions";
 PERFORM goal_boost_command('add',data); PERFORM goal_boost_command('add',data);
 IF (SELECT count(*) FROM "Transactions")<>n+1 THEN RAISE EXCEPTION 'Atomic retry duplicated transaction'; END IF;
 BEGIN
  PERFORM goal_boost_command('add',data || jsonb_build_object('id',gen_random_uuid(),'amount',100,'transactionAmount',1)); RAISE EXCEPTION 'Invalid transaction accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Invalid transaction accepted' THEN RAISE; END IF; END;
 IF (SELECT count(*) FROM "Transactions")<>n+1 THEN RAISE EXCEPTION 'Failed action left transaction'; END IF;
 BEGIN
  PERFORM goal_boost_command('goal','{"categoryId":"foreign"}'); RAISE EXCEPTION 'Foreign goal accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Foreign goal accepted' THEN RAISE; END IF; END;
 BEGIN
  INSERT INTO "GoalBoostEntries"(id,user_id,kind,amount,description,date) VALUES(gen_random_uuid(),auth.uid()::text,'saved',999,'Bypass',current_date); RAISE EXCEPTION 'Direct write accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM "GoalBoostEntries") OR EXISTS(SELECT 1 FROM "GoalBoostGoals") THEN RAISE EXCEPTION 'RLS leaked data'; END IF;
END $$;
RESET ROLE;
\echo 'Goal Boost SQL checks PASS'
