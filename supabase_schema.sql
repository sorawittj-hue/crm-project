-- CRM Application Database Schema
-- Run this in your Supabase SQL Editor for the basic settings/team tables.

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  goal NUMERIC DEFAULT 0,
  color TEXT,
  icon_type TEXT DEFAULT 'UserCheck',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_target NUMERIC DEFAULT 10000000,
  leader_target NUMERIC DEFAULT 7000000,
  member_target NUMERIC DEFAULT 3000000,
  company_name TEXT DEFAULT '',
  company_industry TEXT DEFAULT '',
  currency TEXT DEFAULT 'THB',
  fiscal_month_start INTEGER DEFAULT 1,
  timezone TEXT DEFAULT 'Asia/Bangkok',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_owner_id ON team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_owner_id ON app_settings(owner_id);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on team_members" ON team_members;
DROP POLICY IF EXISTS "Allow all operations on app_settings" ON app_settings;
DROP POLICY IF EXISTS "Authenticated users can manage team_members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can manage app_settings" ON app_settings;

CREATE POLICY "Authenticated users can manage team_members"
  ON team_members
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Authenticated users can manage app_settings"
  ON app_settings
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() AND id = auth.uid()::TEXT)
  WITH CHECK (owner_id = auth.uid() AND id = auth.uid()::TEXT);
