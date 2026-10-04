-- Atomically choose a goal and save the debt inputs used by contribution projections.
-- No balances, transactions or historical contributions are changed.
BEGIN;
CREATE OR REPLACE FUNCTION public.goal_boost_save_goal(p_category_id text, p_settings jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  u text := auth.uid()::text;
  c "Categories"%ROWTYPE;
  g jsonb;
  balance_date date;
  next_payment date;
  first_contribution date;
BEGIN
  IF u IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('goal-boost:'||u,0));
  SELECT * INTO c FROM "Categories" WHERE "Id"=p_category_id AND "UserId"=u FOR UPDATE;
  IF NOT FOUND OR c."Type" NOT IN ('Debt','Savings') THEN
    RAISE EXCEPTION 'Choose a Debt or Savings category';
  END IF;
  IF c."Type"='Debt' THEN
    IF jsonb_typeof(p_settings) IS DISTINCT FROM 'object' OR p_settings->>'version' IS DISTINCT FROM '2'
      OR coalesce(p_settings->>'balanceDate','') !~ '^\d{4}-\d{2}-\d{2}$'
      OR coalesce(p_settings->>'nextPaymentDate','') !~ '^\d{4}-\d{2}-\d{2}$'
      OR (p_settings->>'balance')::numeric IS NULL OR (p_settings->>'balance')::numeric NOT BETWEEN 0.01 AND 10000000000
      OR (p_settings->>'balance')::numeric <> round((p_settings->>'balance')::numeric,2)
      OR (p_settings->>'payment')::numeric <> round((p_settings->>'payment')::numeric,2) THEN
      RAISE EXCEPTION 'Enter valid debt details, including the balance date and next payment date';
    END IF;
    balance_date := (p_settings->>'balanceDate')::date;
    next_payment := (p_settings->>'nextPaymentDate')::date;
    IF balance_date > current_date OR next_payment <= balance_date OR next_payment > (balance_date + interval '1 month')::date THEN
      RAISE EXCEPTION 'The next payment must be after the balance date and within one month';
    END IF;
    IF (p_settings->>'payment')::numeric * 100 <= round((p_settings->>'balance')::numeric * (p_settings->>'rate')::numeric / 12) THEN
      RAISE EXCEPTION 'This payment does not cover the interest. Increase the monthly payment';
    END IF;
  END IF;
  -- Both calls run in this transaction. Validation failures roll back the goal change.
  g := goal_boost_command('goal',jsonb_build_object('categoryId',p_category_id));
  IF c."Type"='Debt' THEN
    SELECT min(date) INTO first_contribution FROM "GoalBoostEntries" WHERE goal_id=(g->>'id')::uuid AND user_id=u AND kind='contribution';
    IF first_contribution < balance_date THEN
      RAISE EXCEPTION 'Use a balance dated on or before the earliest contribution';
    END IF;
    g := goal_boost_command('settings',jsonb_build_object('goalId',g->>'id','settings',p_settings));
  END IF;
  RETURN g;
END; $$;
REVOKE ALL ON FUNCTION public.goal_boost_save_goal(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.goal_boost_save_goal(text,jsonb) TO authenticated;
COMMIT;
