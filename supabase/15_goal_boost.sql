-- Goal Boost: additive schema. Run before the frontend release.
BEGIN;
CREATE TABLE IF NOT EXISTS public."GoalBoostGoals" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL DEFAULT auth.uid()::text,
  category_id text NOT NULL REFERENCES public."Categories"("Id") ON DELETE RESTRICT,
  name text NOT NULL, kind text NOT NULL CHECK (kind IN ('Debt','Savings')),
  active boolean NOT NULL DEFAULT true, settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS goal_boost_one_active ON public."GoalBoostGoals"(user_id) WHERE active;
CREATE TABLE IF NOT EXISTS public."GoalBoostEntries" (
  id uuid PRIMARY KEY, user_id text NOT NULL DEFAULT auth.uid()::text,
  kind text NOT NULL CHECK (kind IN ('saved','received','contribution')),
  amount numeric(14,2) NOT NULL CHECK (amount > 0 AND amount < 1000000000000),
  description text NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 200),
  date date NOT NULL, face_value numeric(14,2), paid numeric(14,2),
  transaction_id text REFERENCES public."Transactions"("Id") ON DELETE RESTRICT,
  goal_id uuid REFERENCES public."GoalBoostGoals"(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind='saved' AND transaction_id IS NULL AND goal_id IS NULL) OR
    (kind='received' AND transaction_id IS NOT NULL AND goal_id IS NULL) OR
    (kind='contribution' AND transaction_id IS NOT NULL AND goal_id IS NOT NULL)),
  CHECK ((face_value IS NULL AND paid IS NULL) OR
    (kind='saved' AND face_value IS NOT NULL AND paid IS NOT NULL AND face_value > 0 AND paid >= 0 AND face_value-paid=amount))
);
CREATE INDEX IF NOT EXISTS goal_boost_entries_owner ON public."GoalBoostEntries"(user_id,date);
CREATE INDEX IF NOT EXISTS goal_boost_entries_transaction ON public."GoalBoostEntries"(transaction_id);
ALTER TABLE public."GoalBoostGoals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."GoalBoostEntries" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS goal_boost_goals_read ON public."GoalBoostGoals";
CREATE POLICY goal_boost_goals_read ON public."GoalBoostGoals" FOR SELECT TO authenticated USING (user_id=auth.uid()::text);
DROP POLICY IF EXISTS goal_boost_entries_read ON public."GoalBoostEntries";
CREATE POLICY goal_boost_entries_read ON public."GoalBoostEntries" FOR SELECT TO authenticated USING (user_id=auth.uid()::text);
REVOKE ALL ON public."GoalBoostGoals",public."GoalBoostEntries" FROM anon,authenticated;
GRANT SELECT ON public."GoalBoostGoals",public."GoalBoostEntries" TO authenticated;

CREATE OR REPLACE FUNCTION public.goal_boost_command(p_action text,p_data jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
 u text:=auth.uid()::text; g "GoalBoostGoals"%ROWTYPE; e "GoalBoostEntries"%ROWTYPE;
 t "Transactions"%ROWTYPE; c "Categories"%ROWTYPE; eid uuid; amt numeric; used numeric; balance numeric;
 txid text; k text; d date; descr text; face numeric; cost numeric; s jsonb;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('goal-boost:'||u,0));
 IF p_action='goal' THEN
   SELECT * INTO c FROM "Categories" WHERE "Id"=p_data->>'categoryId' AND "UserId"=u FOR UPDATE;
   IF NOT FOUND OR c."Type" NOT IN ('Debt','Savings') THEN RAISE EXCEPTION 'Choose a Debt or Savings category'; END IF;
   SELECT * INTO g FROM "GoalBoostGoals" WHERE user_id=u AND active;
   IF g.category_id=c."Id" THEN RETURN to_jsonb(g); END IF;
   UPDATE "GoalBoostGoals" SET active=false WHERE user_id=u AND active;
   INSERT INTO "GoalBoostGoals"(user_id,category_id,name,kind) VALUES(u,c."Id",c."Name",c."Type") RETURNING * INTO g;
   RETURN to_jsonb(g);
 ELSIF p_action='settings' THEN
   s:=p_data->'settings';
   IF jsonb_typeof(s) IS DISTINCT FROM 'object' OR coalesce(s->>'debtType','') NOT IN ('loan','card','mortgage')
     OR s->>'rate' IS NULL OR s->>'payment' IS NULL OR s->>'balance' IS NULL
     OR (s->>'rate')::numeric NOT BETWEEN 0 AND 100
     OR (s->>'payment')::numeric NOT BETWEEN 0.01 AND 1000000000000 OR (s->>'balance')::numeric NOT BETWEEN 0 AND 1000000000000 THEN RAISE EXCEPTION 'Invalid forecast settings'; END IF;
   UPDATE "GoalBoostGoals" SET settings=s WHERE id=(p_data->>'goalId')::uuid AND user_id=u AND active AND kind='Debt' RETURNING * INTO g;
   IF NOT FOUND THEN RAISE EXCEPTION 'Active debt goal not found'; END IF;
   RETURN to_jsonb(g);
 END IF;
 eid:=(p_data->>'id')::uuid;
 IF eid IS NULL THEN RAISE EXCEPTION 'Request identifier required'; END IF;
 SELECT * INTO e FROM "GoalBoostEntries" WHERE id=eid AND user_id=u;
 IF p_action='add' AND FOUND THEN RETURN to_jsonb(e); END IF;
 SELECT coalesce(sum(CASE WHEN kind='contribution' THEN -amount ELSE amount END),0) INTO balance FROM "GoalBoostEntries" WHERE user_id=u;
 IF p_action='remove' THEN
   IF e.id IS NULL THEN RETURN '{}'::jsonb; END IF;
   IF e.kind<>'contribution' AND balance<e.amount THEN RAISE EXCEPTION 'Adjust contributions first: available funds cannot be negative'; END IF;
   DELETE FROM "GoalBoostEntries" WHERE id=eid AND user_id=u;
   RETURN '{}'::jsonb;
 END IF;
 IF p_action NOT IN ('add','edit') THEN RAISE EXCEPTION 'Unknown Goal Boost action'; END IF;
 IF p_action='edit' AND (e.id IS NULL OR e.kind<>'saved') THEN RAISE EXCEPTION 'Only savings can be edited; unlink other entries first'; END IF;
 k:=CASE WHEN p_action='edit' THEN 'saved' ELSE p_data->>'kind' END;
 amt:=(p_data->>'amount')::numeric; descr:=trim(p_data->>'description'); d:=(p_data->>'date')::date;
 face:=(p_data->>'faceValue')::numeric; cost:=(p_data->>'paid')::numeric;
 IF amt IS NULL OR amt<=0 OR amt>=1000000000000 OR amt<>round(amt,2) OR amt::text='NaN' THEN RAISE EXCEPTION 'Enter a positive amount with at most two decimal places'; END IF;
 IF k='saved' THEN
   IF p_action='edit' AND balance-e.amount+amt<0 THEN RAISE EXCEPTION 'Adjust contributions first: available funds cannot be negative'; END IF;
 ELSIF k IN ('received','contribution') THEN
   IF k='contribution' THEN
     SELECT * INTO g FROM "GoalBoostGoals" WHERE user_id=u AND active FOR UPDATE;
     IF NOT FOUND OR g.id::text IS DISTINCT FROM p_data->>'goalId' THEN RAISE EXCEPTION 'The active goal changed. Reload and try again'; END IF;
     IF amt>balance THEN RAISE EXCEPTION 'Contribution exceeds available funds'; END IF;
   END IF;
   txid:=nullif(p_data->>'transactionId','');
   IF txid IS NULL THEN
     IF NOT EXISTS(SELECT 1 FROM "Accounts" WHERE "Id"=p_data->>'accountId' AND "UserId"=u) THEN RAISE EXCEPTION 'Choose your account'; END IF;
     SELECT * INTO c FROM "Categories" WHERE "Id"=CASE WHEN k='received' THEN p_data->>'categoryId' ELSE g.category_id END AND "UserId"=u;
     IF NOT FOUND OR c."Type"<>(CASE WHEN k='received' THEN 'Income' ELSE g.kind END) THEN RAISE EXCEPTION 'Choose a matching category'; END IF;
     IF (p_data->>'transactionAmount')::numeric IS NULL OR (p_data->>'transactionAmount')::numeric NOT BETWEEN 0.01 AND 1000000000000 OR (p_data->>'transactionAmount')::numeric<amt OR (p_data->>'transactionAmount')::numeric<>round((p_data->>'transactionAmount')::numeric,2) THEN RAISE EXCEPTION 'Transaction amount must cover the allocated amount'; END IF;
     txid:=gen_random_uuid()::text;
     INSERT INTO "Transactions"("Id","UserId","Date","Amount","Details","AccountId","BudgetType","BudgetPositionId")
       VALUES(txid,u,d,(CASE WHEN c."Type"='Debt' THEN -1 ELSE 1 END)*(p_data->>'transactionAmount')::numeric,descr,p_data->>'accountId',c."Type",c."Id");
   END IF;
   SELECT * INTO t FROM "Transactions" WHERE "Id"=txid AND "UserId"=u FOR UPDATE;
   IF NOT FOUND OR t."TransferPairId" IS NOT NULL THEN RAISE EXCEPTION 'Matching transaction not found'; END IF;
   IF k='received' AND (t."BudgetType"<>'Income' OR t."Amount"<=0) THEN RAISE EXCEPTION 'Choose a positive income transaction'; END IF;
   IF k='contribution' AND (t."BudgetType"<>g.kind OR t."BudgetPositionId" IS DISTINCT FROM g.category_id OR (g.kind='Debt' AND t."Amount">=0) OR (g.kind='Savings' AND t."Amount"<=0)) THEN RAISE EXCEPTION 'Choose a payment for the selected goal'; END IF;
   SELECT coalesce(sum(amount),0) INTO used FROM "GoalBoostEntries" WHERE transaction_id=txid;
   IF used+amt>round(abs(t."Amount")::numeric,2) THEN RAISE EXCEPTION 'Amount exceeds the unallocated part of this transaction'; END IF;
   d:=t."Date"; descr:=coalesce(nullif(trim(t."Details"),''),CASE WHEN k='received' THEN 'Income' ELSE g.name END);
 ELSE RAISE EXCEPTION 'Invalid boost type'; END IF;
 IF d IS NULL OR d>current_date THEN RAISE EXCEPTION 'Use the date of money already saved or received'; END IF;
 IF p_action='edit' THEN
   UPDATE "GoalBoostEntries" SET amount=amt,description=descr,date=d,face_value=face,paid=cost WHERE id=eid AND user_id=u RETURNING * INTO e;
 ELSE
   INSERT INTO "GoalBoostEntries"(id,user_id,kind,amount,description,date,face_value,paid,transaction_id,goal_id)
   VALUES(eid,u,k,amt,descr,d,face,cost,txid,CASE WHEN k='contribution' THEN g.id ELSE NULL END) RETURNING * INTO e;
 END IF;
 RETURN to_jsonb(e);
END; $$;
REVOKE ALL ON FUNCTION public.goal_boost_command(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.goal_boost_command(text,jsonb) TO authenticated;

-- Protect links even when transactions are changed outside Goal Boost.
CREATE OR REPLACE FUNCTION public.guard_goal_boost_transaction() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE used numeric;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('goal-boost:'||OLD."UserId",0));
 SELECT sum(amount) INTO used FROM "GoalBoostEntries" WHERE transaction_id=OLD."Id";
 IF used IS NULL THEN IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF; END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Linked to Goal Boost. Unlink the entry in Goal Boost history before deleting this transaction'; END IF;
 IF NEW."Id" IS DISTINCT FROM OLD."Id" OR NEW."UserId" IS DISTINCT FROM OLD."UserId" OR NEW."BudgetType" IS DISTINCT FROM OLD."BudgetType" OR NEW."BudgetPositionId" IS DISTINCT FROM OLD."BudgetPositionId" OR NEW."TransferPairId" IS DISTINCT FROM OLD."TransferPairId" OR sign(NEW."Amount")<>sign(OLD."Amount") OR round(abs(NEW."Amount")::numeric,2)<used OR NEW."Date"::date>current_date OR NEW."Amount"::text IN ('NaN','Infinity','-Infinity') THEN
   RAISE EXCEPTION 'Linked to Goal Boost. Adjust or unlink its entries before changing this transaction';
 END IF;
 UPDATE "GoalBoostEntries" SET date=NEW."Date",description=coalesce(nullif(trim(NEW."Details"),''),description) WHERE transaction_id=OLD."Id";
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS transactions_goal_boost_guard ON public."Transactions";
CREATE TRIGGER transactions_goal_boost_guard BEFORE UPDATE OR DELETE ON public."Transactions" FOR EACH ROW EXECUTE FUNCTION public.guard_goal_boost_transaction();
CREATE OR REPLACE FUNCTION public.guard_goal_boost_category() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM "GoalBoostGoals" WHERE category_id=OLD."Id") THEN
   IF TG_OP='DELETE' THEN RAISE EXCEPTION 'This category has Goal Boost history and cannot be deleted'; END IF;
   IF NEW."Type" IS DISTINCT FROM OLD."Type" OR NEW."UserId" IS DISTINCT FROM OLD."UserId" THEN RAISE EXCEPTION 'This category is linked to Goal Boost; its type cannot change'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END; $$;
DROP TRIGGER IF EXISTS categories_goal_boost_guard ON public."Categories";
CREATE TRIGGER categories_goal_boost_guard BEFORE UPDATE OR DELETE ON public."Categories" FOR EACH ROW EXECUTE FUNCTION public.guard_goal_boost_category();
COMMIT;
