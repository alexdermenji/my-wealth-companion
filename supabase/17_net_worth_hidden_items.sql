-- Visibility only: balances, payment links and historical totals are preserved.
BEGIN;
-- Backfill once. Reapplying must not hide debts the user has restored.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'NetWorthItems' AND column_name = 'IsHidden'
  ) THEN
    ALTER TABLE public."NetWorthItems" ADD COLUMN "IsHidden" boolean NOT NULL DEFAULT false;
    UPDATE public."NetWorthItems" i SET "IsHidden" = true
    WHERE i."Type" = 'Liability' AND (
      SELECT v."Amount" <= 0 FROM public."NetWorthValues" v
      WHERE v."ItemId" = i."Id" AND v."UserId" = i."UserId"
        AND (v."Year", v."Month") <= (EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM CURRENT_DATE)::int)
      ORDER BY v."Year" DESC, v."Month" DESC LIMIT 1
    );
  END IF;
END $$;

-- Saving the latest actual balance closes/reopens a debt. Restoring only changes
-- IsHidden, so a restored zero-balance row remains available for a new loan.
-- Historical corrections and future forecasts do not archive active debts.
CREATE OR REPLACE FUNCTION public.sync_net_worth_visibility()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF (NEW."Year", NEW."Month") <= (EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM CURRENT_DATE)::int)
    AND NOT EXISTS (
      SELECT 1 FROM public."NetWorthValues" v
      WHERE v."ItemId" = NEW."ItemId" AND v."UserId" = NEW."UserId"
        AND (v."Year", v."Month") > (NEW."Year", NEW."Month")
        AND (v."Year", v."Month") <= (EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM CURRENT_DATE)::int)
    ) THEN
    UPDATE public."NetWorthItems" SET "IsHidden" = (NEW."Amount" <= 0)
    WHERE "Id" = NEW."ItemId" AND "UserId" = NEW."UserId" AND "Type" = 'Liability';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS networthvalues_sync_visibility ON public."NetWorthValues";
CREATE TRIGGER networthvalues_sync_visibility
AFTER INSERT OR UPDATE OF "Amount" ON public."NetWorthValues"
FOR EACH ROW EXECUTE FUNCTION public.sync_net_worth_visibility();
COMMIT;
