-- Run ONLY in an empty disposable database; never against the linked project.
\ir goal_boost.sql
\ir ../16_goal_boost_interest_settings.sql
\ir ../16_goal_boost_interest_settings.sql
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
DO $$
DECLARE
  g jsonb; s jsonb; initial_goals int; initial_entries int; first_id uuid;
BEGIN
  s := jsonb_build_object('version',2,'debtType','loan','balance',1000,'payment',510,'rate',12,'balanceDate',current_date,'nextPaymentDate',(current_date + interval '1 month')::date);
  SELECT count(*) INTO initial_goals FROM "GoalBoostGoals";
  BEGIN
    PERFORM goal_boost_save_goal('debt',s || '{"rate":101}');
    RAISE EXCEPTION 'Invalid rate accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM='Invalid rate accepted' THEN RAISE; END IF; END;
  IF (SELECT count(*) FROM "GoalBoostGoals") <> initial_goals OR NOT EXISTS(SELECT FROM "GoalBoostGoals" WHERE active AND kind='Savings') THEN
    RAISE EXCEPTION 'Settings failure left a changed goal';
  END IF;
  -- A repayment recorded by the old client survives the settings upgrade.
  g := goal_boost_command('goal','{"categoryId":"debt"}'); first_id := (g->>'id')::uuid;
  PERFORM goal_boost_command('add',jsonb_build_object('id',gen_random_uuid(),'kind','contribution','amount',4,'transactionId','debt-tx','goalId',first_id));
  SELECT count(*) INTO initial_entries FROM "GoalBoostEntries";
  g := goal_boost_save_goal('debt',s);
  PERFORM goal_boost_save_goal('debt',s);
  IF (g->>'id')::uuid <> first_id OR g->'settings' <> s THEN RAISE EXCEPTION 'Existing goal or settings changed incorrectly'; END IF;
  IF (SELECT count(*) FROM "GoalBoostEntries") <> initial_entries OR NOT EXISTS(SELECT FROM "GoalBoostEntries" WHERE goal_id=first_id AND amount=4) THEN RAISE EXCEPTION 'Old contribution changed'; END IF;
  IF (SELECT count(*) FROM "GoalBoostGoals" WHERE active) <> 1 THEN RAISE EXCEPTION 'Retry duplicated goal'; END IF;
  BEGIN
    PERFORM goal_boost_save_goal('debt',s || '{"payment":10}');
    RAISE EXCEPTION 'Non-amortizing loan accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM='Non-amortizing loan accepted' THEN RAISE; END IF; END;
  BEGIN
    PERFORM goal_boost_save_goal('debt',s || jsonb_build_object('nextPaymentDate',current_date));
    RAISE EXCEPTION 'Invalid schedule accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM='Invalid schedule accepted' THEN RAISE; END IF; END;
  BEGIN
    PERFORM goal_boost_save_goal('debt',NULL);
    RAISE EXCEPTION 'Null settings accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM='Null settings accepted' THEN RAISE; END IF; END;
  BEGIN
    PERFORM goal_boost_save_goal('foreign',s);
    RAISE EXCEPTION 'Foreign category accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM='Foreign category accepted' THEN RAISE; END IF; END;
  IF (SELECT settings FROM "GoalBoostGoals" WHERE id=first_id) <> s THEN RAISE EXCEPTION 'Validation failure overwrote settings'; END IF;
  PERFORM goal_boost_save_goal('saving');
  IF NOT EXISTS(SELECT FROM "GoalBoostEntries" WHERE goal_id=first_id AND amount=4) THEN RAISE EXCEPTION 'Goal switch moved history'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
DO $$ BEGIN IF EXISTS(SELECT FROM "GoalBoostGoals") OR EXISTS(SELECT FROM "GoalBoostEntries") THEN RAISE EXCEPTION 'RLS leaked data'; END IF; END $$;
RESET ROLE;
\echo 'Goal Boost interest settings SQL checks PASS'
