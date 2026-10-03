-- Run only in an EMPTY, DISPOSABLE database with ON_ERROR_STOP=1.
CREATE TABLE public."Transactions" (
  "Id" text PRIMARY KEY, "UserId" text NOT NULL, "Date" date NOT NULL, "Amount" numeric
);
INSERT INTO public."Transactions" VALUES ('legacy', 'user', '2026-10-03', 10);
\ir ../14_transaction_creation_order.sql
INSERT INTO public."Transactions" ("Id", "UserId", "Date", "Amount")
  VALUES ('first', 'user', '2026-10-03', 20);
SELECT pg_sleep(0.01);
INSERT INTO public."Transactions" ("Id", "UserId", "Date", "Amount")
  VALUES ('latest', 'user', '2026-09-01', 30);
CREATE TEMP TABLE original_time AS SELECT "CreatedAt" FROM public."Transactions" WHERE "Id" = 'first';
UPDATE public."Transactions" SET "Amount" = 50 WHERE "Id" = 'first';
-- Applying the migration again must not overwrite creation times.
\ir ../14_transaction_creation_order.sql
DO $$
DECLARE actual text[];
BEGIN
  SELECT array_agg("Id" ORDER BY "CreatedAt" DESC NULLS LAST, "Date" DESC, "Id" DESC)
    INTO actual FROM public."Transactions";
  IF actual IS DISTINCT FROM ARRAY['latest', 'first', 'legacy'] THEN
    RAISE EXCEPTION 'Unexpected creation order: %', actual;
  END IF;
  IF (SELECT "CreatedAt" FROM public."Transactions" WHERE "Id" = 'legacy') IS NOT NULL THEN
    RAISE EXCEPTION 'Legacy creation time must remain unknown';
  END IF;
  IF (SELECT "CreatedAt" FROM public."Transactions" WHERE "Id" = 'first')
      IS DISTINCT FROM (SELECT "CreatedAt" FROM original_time) THEN
    RAISE EXCEPTION 'Editing or rerunning migration changed creation time';
  END IF;
END $$;
DROP TABLE public."Transactions";
