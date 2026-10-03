-- Apply before deploying the client that sorts by CreatedAt.
-- Existing rows retain NULL: their original insertion time is unknown.
BEGIN;
ALTER TABLE public."Transactions"
  ADD COLUMN IF NOT EXISTS "CreatedAt" timestamptz;
ALTER TABLE public."Transactions"
  ALTER COLUMN "CreatedAt" SET DEFAULT clock_timestamp();

COMMENT ON COLUMN public."Transactions"."CreatedAt" IS
  'Insertion time; unchanged by edits. NULL for legacy rows whose insertion time is unknown.';

CREATE INDEX IF NOT EXISTS transactions_user_creation_order_idx
  ON public."Transactions" ("UserId", "CreatedAt" DESC NULLS LAST, "Date" DESC, "Id" DESC);
COMMIT;
