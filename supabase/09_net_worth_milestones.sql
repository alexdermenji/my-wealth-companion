CREATE TABLE IF NOT EXISTS "NetWorthMilestones" (
  "Id"           text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "Label"        text,
  "TargetAmount" real NOT NULL,
  "TargetDate"   date,
  "Note"         text NOT NULL DEFAULT '',
  "Order"        integer NOT NULL DEFAULT 0,
  "UserId"       text NOT NULL
);

ALTER TABLE "NetWorthMilestones" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "networthmilestones_select" ON "NetWorthMilestones"
  FOR SELECT USING ("UserId" = auth.uid()::text);

CREATE POLICY "networthmilestones_insert" ON "NetWorthMilestones"
  FOR INSERT WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "networthmilestones_update" ON "NetWorthMilestones"
  FOR UPDATE USING ("UserId" = auth.uid()::text)
  WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "networthmilestones_delete" ON "NetWorthMilestones"
  FOR DELETE USING ("UserId" = auth.uid()::text);

CREATE TRIGGER networthmilestones_set_user_id
  BEFORE INSERT ON "NetWorthMilestones"
  FOR EACH ROW EXECUTE FUNCTION set_user_id();
