-- =============================================================================
-- Step 8: Custom timeline events
-- Stores user-defined milestones such as SAYE maturity, BAYE release, bonuses,
-- vesting dates, or any other dated event that should appear in Timeline.
-- =============================================================================

CREATE TABLE IF NOT EXISTS "TimelineEvents" (
  "Id"          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "Title"       text NOT NULL,
  "EventDate"   date NOT NULL,
  "Type"        text NOT NULL DEFAULT 'Custom' CHECK ("Type" IN ('Custom')),
  "Amount"      real NULL,
  "Description" text NOT NULL DEFAULT '',
  "UserId"      text NOT NULL
);

ALTER TABLE "TimelineEvents" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "timelineevents_select" ON "TimelineEvents"
  FOR SELECT USING ("UserId" = auth.uid()::text);

CREATE POLICY "timelineevents_insert" ON "TimelineEvents"
  FOR INSERT WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "timelineevents_update" ON "TimelineEvents"
  FOR UPDATE USING ("UserId" = auth.uid()::text)
  WITH CHECK ("UserId" = auth.uid()::text);

CREATE POLICY "timelineevents_delete" ON "TimelineEvents"
  FOR DELETE USING ("UserId" = auth.uid()::text);

CREATE TRIGGER timelineevents_set_user_id
  BEFORE INSERT ON "TimelineEvents"
  FOR EACH ROW EXECUTE FUNCTION set_user_id();
