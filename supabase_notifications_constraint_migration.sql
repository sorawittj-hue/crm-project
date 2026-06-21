-- =========================================================================
-- ZENITH CRM - NOTIFICATIONS UNIQUE CONSTRAINT MIGRATION
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- to fix the batch upsert error "no unique or exclusion constraint" permanently.
--
-- This script safely cleans duplicate keys first before applying the constraint.
-- =========================================================================

-- 1. Clean up existing duplicates (keeps the newest notification per unique key)
DELETE FROM notifications a USING notifications b
WHERE a.id < b.id AND a.notification_key = b.notification_key;

-- 2. Add the unique constraint on the notification_key column
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_notification_key_key;
ALTER TABLE notifications ADD CONSTRAINT notifications_notification_key_key UNIQUE (notification_key);

-- =========================================================================
-- SUCCESS! ✅
-- Now batch upserts will run natively on the database at maximum speed
-- without needing the sequential fallback.
-- =========================================================================
