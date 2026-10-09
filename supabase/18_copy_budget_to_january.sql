-- Adds an opt-in, atomic copy action. Applying this migration copies no budgets.
BEGIN;
CREATE OR REPLACE FUNCTION public.copy_budget_to_january(p_year integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid text := auth.uid()::text;
  v_source_count integer;
  v_copied_count integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_year IS NULL OR p_year < 1901 OR p_year > 9999 THEN
    RAISE EXCEPTION 'Invalid destination year';
  END IF;

  WITH source AS MATERIALIZED (
    SELECT b."CategoryId", b."Amount"
    FROM public."BudgetPlans" b
    JOIN public."Categories" c ON c."Id" = b."CategoryId" AND c."UserId" = v_uid
    WHERE b."UserId" = v_uid AND b."Year" = p_year - 1 AND b."Month" = 12
      AND NOT c."IsHiddenInBudget"
  ), copied AS (
    INSERT INTO public."BudgetPlans" ("CategoryId", "Year", "Month", "Amount", "UserId")
    SELECT "CategoryId", p_year, 1, "Amount", v_uid FROM source
    -- A saved zero is an existing value. Concurrent/repeated copies are safe too.
    ON CONFLICT ("CategoryId", "Year", "Month", "UserId") DO NOTHING
    RETURNING 1
  )
  SELECT (SELECT count(*) FROM source), (SELECT count(*) FROM copied)
    INTO v_source_count, v_copied_count;

  RETURN jsonb_build_object('copiedCount', v_copied_count, 'sourceCount', v_source_count);
END;
$$;
REVOKE ALL ON FUNCTION public.copy_budget_to_january(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.copy_budget_to_january(integer) TO authenticated;
COMMIT;
