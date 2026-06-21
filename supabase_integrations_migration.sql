-- =========================================================================
-- ZENITH CRM - INTEGRATION SETTINGS DATABASE MIGRATION
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- to add the integrations JSONB column to the app_settings table.
-- =========================================================================

-- 1. Add the integrations column if it does not already exist
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS integrations JSONB DEFAULT '{}';
