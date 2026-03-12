-- CRM Application Database Schema
-- Run this in your Supabase SQL Editor: https://ycjccjvndgqtwertpfep.supabase.co/project/_/sql

-- ===========================================
-- TABLE: team_members
-- ===========================================
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  goal NUMERIC DEFAULT 0,
  color TEXT,
  icon_type TEXT DEFAULT 'UserCheck',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default team members
INSERT INTO team_members (id, name, role, goal, color, icon_type)
VALUES
  ('leader', 'Sorawit (Leader)', 'หัวหน้าทีม', 7000000, 'bg-indigo-600 shadow-indigo-500/20', 'ShieldCheck'),
  ('off', 'น้องออฟ', 'ทีมงาน', 3000000, 'bg-orange-600 shadow-orange-500/20', 'UserCheck')
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- TABLE: app_settings (for app configuration)
-- ===========================================
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  monthly_target NUMERIC DEFAULT 10000000,
  leader_target NUMERIC DEFAULT 7000000,
  member_target NUMERIC DEFAULT 3000000,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO app_settings (id, monthly_target, leader_target, member_target)
VALUES ('global', 10000000, 7000000, 3000000)
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- Enable Row Level Security (RLS)
-- ===========================================
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS Policies (Allow all operations)
-- ===========================================

-- team_members policies
CREATE POLICY "Allow all operations on team_members"
  ON team_members
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- app_settings policies
CREATE POLICY "Allow all operations on app_settings"
  ON app_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- Done! ✅
-- ===========================================
