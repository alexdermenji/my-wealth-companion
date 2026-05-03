-- =============================================================================
-- Migration: add ResponseType column to DailyCheckIns
-- Run this once against the live database.
-- =============================================================================

ALTER TABLE "DailyCheckIns"
  ADD COLUMN IF NOT EXISTS "ResponseType" text;
-- values: 'spent' | 'no_spend' | 'passive' | NULL (legacy rows)
