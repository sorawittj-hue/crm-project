-- ===========================================
-- MIGRATION: Add Deal Fields
-- ===========================================
-- Purpose: Adds new columns to the `deals` table that are required for new CRM features.
-- Run this in the Supabase SQL Editor.

-- Add lost_reason to track why a deal was lost
ALTER TABLE deals ADD COLUMN IF NOT EXISTS lost_reason TEXT;

-- Add is_recurring to flag recurring revenue deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- Add renewal_date to track when a recurring deal renews
ALTER TABLE deals ADD COLUMN IF NOT EXISTS renewal_date DATE;
