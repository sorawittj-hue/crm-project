-- ===========================================
-- ZENITH CRM - COMPLETE DATABASE SCHEMA
-- Production-Ready CRM Application
-- ===========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- TABLE: team_members
-- ===========================================
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  goal NUMERIC DEFAULT 0,
  color TEXT,
  icon_type TEXT DEFAULT 'UserCheck',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members are created per authenticated owner by the app.

-- ===========================================
-- TABLE: app_settings
-- ===========================================
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

-- App settings are created per authenticated owner by the app.

-- ===========================================
-- TABLE: customers
-- ===========================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  industry TEXT,
  tier TEXT DEFAULT 'Silver', -- Silver, Gold, Platinum
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster searches
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier);

-- ===========================================
-- TABLE: deals
-- ===========================================
CREATE TABLE IF NOT EXISTS deals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  value NUMERIC DEFAULT 0,
  stage TEXT DEFAULT 'lead', -- lead, contact, proposal, negotiation, won, lost
  probability INTEGER DEFAULT 0,
  assigned_to TEXT REFERENCES team_members(id),
  contact TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  description TEXT,
  source TEXT, -- inbound, referral, cold_call, marketing
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  expected_close_date DATE,
  actual_close_date DATE,
  lost_reason TEXT,
  last_activity TIMESTAMPTZ,
  next_step TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_company ON deals(company);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_value ON deals(value DESC);
CREATE INDEX IF NOT EXISTS idx_deals_probability ON deals(probability DESC);
CREATE INDEX IF NOT EXISTS idx_deals_last_activity ON deals(last_activity DESC);

-- ===========================================
-- TABLE: activities
-- ===========================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- call, email, meeting, note, task, whatsapp
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result TEXT,
  created_by TEXT REFERENCES team_members(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activities_owner_id ON activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_scheduled_at ON activities(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- ===========================================
-- TABLE: email_templates
-- ===========================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  variables TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default templates
INSERT INTO email_templates (name, subject, body, category, variables) VALUES
  ('Follow-up After Meeting', 'Follow-up: {{company}} Meeting', 'Dear {{contact}},\n\nThank you for taking the time to meet with us today. As discussed, here are the key points...\n\nBest regards,\n{{sender}}', 'follow_up', ARRAY['company', 'contact', 'sender']),
  ('Proposal Submission', 'Proposal: {{title}}', 'Dear {{contact}},\n\nPlease find attached our proposal for {{title}}...\n\nLooking forward to your feedback.\n\nBest regards,\n{{sender}}', 'proposal', ARRAY['title', 'contact', 'sender']),
  ('Price Negotiation', 'Re: Pricing Discussion - {{company}}', 'Dear {{contact}},\n\nRegarding our discussion on pricing, I''d like to offer...\n\nBest regards,\n{{sender}}', 'negotiation', ARRAY['company', 'contact', 'sender'])
ON CONFLICT DO NOTHING;

-- ===========================================
-- TABLE: notifications
-- ===========================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES team_members(id),
  notification_key TEXT UNIQUE,
  type TEXT NOT NULL, -- deal_update, activity_reminder, mention, system
  priority TEXT DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  related_deal_id UUID REFERENCES deals(id),
  related_activity_id UUID REFERENCES activities(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_owner_id ON team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_owner_id ON app_settings(owner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_owner_id ON notifications(owner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_notification_key ON notifications(notification_key);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ===========================================
-- TABLE: audit_log
-- ===========================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_by UUID DEFAULT auth.uid(),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- ===========================================
-- Enable Row Level Security (RLS)
-- ===========================================
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS Policies
-- The app UI already requires Supabase Auth. These policies make the
-- database match that boundary so anonymous clients cannot read or write CRM data.
-- ===========================================

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

CREATE POLICY "Authenticated users can manage team_members"
  ON team_members FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Authenticated users can manage app_settings"
  ON app_settings FOR ALL TO authenticated USING (owner_id = auth.uid() AND id = auth.uid()::TEXT) WITH CHECK (owner_id = auth.uid() AND id = auth.uid()::TEXT);

CREATE POLICY "Authenticated users can manage customers"
  ON customers FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Authenticated users can manage deals"
  ON deals FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Authenticated users can manage activities"
  ON activities FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Authenticated users can manage email_templates"
  ON email_templates FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Authenticated users can manage notifications"
  ON notifications FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Authenticated users can read audit_log"
  ON audit_log FOR SELECT TO authenticated USING (changed_by = auth.uid());

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-set last_activity on deals when activity is created
CREATE OR REPLACE FUNCTION update_deal_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deal_id IS NOT NULL THEN
    UPDATE deals SET last_activity = NOW() WHERE id = NEW.deal_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activity_created_update_deal
  AFTER INSERT ON activities
  FOR EACH ROW
  WHEN (NEW.deal_id IS NOT NULL)
  EXECUTE FUNCTION update_deal_last_activity();

-- Audit mutations for core CRM records. The trigger runs as SECURITY DEFINER
-- so app users can read audit history without receiving direct insert rights.
CREATE OR REPLACE FUNCTION record_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  affected_record_id TEXT;
  old_payload JSONB;
  new_payload JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_record_id = OLD.id::TEXT;
    old_payload = TO_JSONB(OLD);
  ELSE
    affected_record_id = NEW.id::TEXT;
    new_payload = TO_JSONB(NEW);
    IF TG_OP = 'UPDATE' THEN
      old_payload = TO_JSONB(OLD);
    END IF;
  END IF;

  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    affected_record_id,
    TG_OP,
    auth.uid(),
    old_payload,
    new_payload
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS audit_customers_changes ON customers;
CREATE TRIGGER audit_customers_changes
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION record_audit_event();

DROP TRIGGER IF EXISTS audit_deals_changes ON deals;
CREATE TRIGGER audit_deals_changes
  AFTER INSERT OR UPDATE OR DELETE ON deals
  FOR EACH ROW EXECUTE FUNCTION record_audit_event();

DROP TRIGGER IF EXISTS audit_activities_changes ON activities;
CREATE TRIGGER audit_activities_changes
  AFTER INSERT OR UPDATE OR DELETE ON activities
  FOR EACH ROW EXECUTE FUNCTION record_audit_event();

-- ===========================================
-- VIEWS FOR ANALYTICS
-- ===========================================

-- Pipeline Summary View
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

-- Team Performance View
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

-- Customer Lifetime Value View
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

-- Monthly Revenue View
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

-- ===========================================
-- SAMPLE DATA (Optional - for testing)
-- ===========================================

-- You can add sample customers and deals here for testing

-- ===========================================
-- DONE! ✅
-- ===========================================
