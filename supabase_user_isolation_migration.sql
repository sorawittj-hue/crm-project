-- ===========================================
-- ZENITH CRM - USER DATA ISOLATION MIGRATION
-- Run this in Supabase SQL Editor before deploying the app changes.
-- Existing shared rows with NULL owner_id will no longer be visible until
-- you assign them to the intended auth.users.id.
-- ===========================================

ALTER TABLE team_members ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT '';
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS company_industry TEXT DEFAULT '';
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS fiscal_month_start INTEGER DEFAULT 1;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS notification_key TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'info';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_notification_key_key'
  ) THEN
    ALTER TABLE notifications ADD CONSTRAINT notifications_notification_key_key UNIQUE (notification_key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_team_members_owner_id ON team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_owner_id ON app_settings(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_owner_id ON activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_owner_id ON notifications(owner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_notification_key ON notifications(notification_key);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on team_members" ON team_members;
DROP POLICY IF EXISTS "Allow all operations on app_settings" ON app_settings;
DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
DROP POLICY IF EXISTS "Allow all operations on deals" ON deals;
DROP POLICY IF EXISTS "Allow all operations on activities" ON activities;
DROP POLICY IF EXISTS "Allow all operations on email_templates" ON email_templates;
DROP POLICY IF EXISTS "Allow all operations on notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can manage team_members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can manage app_settings" ON app_settings;
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can manage deals" ON deals;
DROP POLICY IF EXISTS "Authenticated users can manage activities" ON activities;
DROP POLICY IF EXISTS "Authenticated users can manage email_templates" ON email_templates;
DROP POLICY IF EXISTS "Authenticated users can manage notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can read audit_log" ON audit_log;

CREATE POLICY "Users can manage their team members"
  ON team_members FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can manage their settings"
  ON app_settings FOR ALL TO authenticated
  USING (owner_id = auth.uid() AND id = auth.uid()::TEXT)
  WITH CHECK (owner_id = auth.uid() AND id = auth.uid()::TEXT);

CREATE POLICY "Users can manage their customers"
  ON customers FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can manage their deals"
  ON deals FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can manage their activities"
  ON activities FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can manage their email templates"
  ON email_templates FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can manage their notifications"
  ON notifications FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can read their audit log"
  ON audit_log FOR SELECT TO authenticated
  USING (changed_by = auth.uid());

DROP VIEW IF EXISTS monthly_revenue;
DROP VIEW IF EXISTS customer_lifetime_value;
DROP VIEW IF EXISTS team_performance;
DROP VIEW IF EXISTS pipeline_summary;

CREATE OR REPLACE VIEW pipeline_summary
WITH (security_invoker = true) AS
SELECT
  owner_id,
  stage,
  COUNT(*) as deal_count,
  SUM(value) as total_value,
  AVG(probability) as avg_probability
FROM deals
WHERE stage NOT IN ('won', 'lost')
GROUP BY owner_id, stage;

CREATE OR REPLACE VIEW team_performance
WITH (security_invoker = true) AS
SELECT
  t.owner_id,
  t.id,
  t.name,
  t.role,
  t.goal,
  COUNT(DISTINCT d.id) as total_deals,
  COUNT(DISTINCT CASE WHEN d.stage = 'won' THEN d.id END) as won_deals,
  SUM(CASE WHEN d.stage = 'won' THEN d.value ELSE 0 END) as won_value,
  SUM(CASE WHEN d.stage NOT IN ('won', 'lost') THEN d.value ELSE 0 END) as pipeline_value
FROM team_members t
LEFT JOIN deals d ON d.assigned_to = t.id AND d.owner_id = t.owner_id
GROUP BY t.owner_id, t.id, t.name, t.role, t.goal;

CREATE OR REPLACE VIEW customer_lifetime_value
WITH (security_invoker = true) AS
SELECT
  c.owner_id,
  c.id,
  c.name,
  c.company,
  c.tier,
  COUNT(DISTINCT d.id) as total_deals,
  COUNT(DISTINCT CASE WHEN d.stage = 'won' THEN d.id END) as won_deals,
  SUM(CASE WHEN d.stage = 'won' THEN d.value ELSE 0 END) as lifetime_value,
  MAX(d.created_at) as last_activity
FROM customers c
LEFT JOIN deals d ON d.customer_id = c.id AND d.owner_id = c.owner_id
GROUP BY c.owner_id, c.id, c.name, c.company, c.tier;

CREATE OR REPLACE VIEW monthly_revenue
WITH (security_invoker = true) AS
SELECT
  owner_id,
  DATE_TRUNC('month', actual_close_date) as month,
  COUNT(*) as deal_count,
  SUM(value) as total_revenue,
  AVG(value) as avg_deal_value
FROM deals
WHERE stage = 'won' AND actual_close_date IS NOT NULL
GROUP BY owner_id, DATE_TRUNC('month', actual_close_date)
ORDER BY month DESC;
