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

-- Insert default team members
INSERT INTO team_members (id, name, role, goal, color, icon_type)
VALUES
  ('leader', 'Sorawit (Leader)', 'หัวหน้าทีม', 7000000, 'bg-indigo-600 shadow-indigo-500/20', 'ShieldCheck'),
  ('off', 'น้องออฟ', 'ทีมงาน', 3000000, 'bg-orange-600 shadow-orange-500/20', 'UserCheck')
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- TABLE: app_settings
-- ===========================================
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  monthly_target NUMERIC DEFAULT 10000000,
  leader_target NUMERIC DEFAULT 7000000,
  member_target NUMERIC DEFAULT 3000000,
  currency TEXT DEFAULT 'THB',
  timezone TEXT DEFAULT 'Asia/Bangkok',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (id, monthly_target, leader_target, member_target)
VALUES ('global', 10000000, 7000000, 3000000)
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- TABLE: customers
-- ===========================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier);

-- ===========================================
-- TABLE: deals
-- ===========================================
CREATE TABLE IF NOT EXISTS deals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_scheduled_at ON activities(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- ===========================================
-- TABLE: email_templates
-- ===========================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
  user_id TEXT REFERENCES team_members(id),
  type TEXT NOT NULL, -- deal_update, activity_reminder, mention, system
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_deal_id UUID REFERENCES deals(id),
  related_activity_id UUID REFERENCES activities(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

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

-- ===========================================
-- RLS Policies (Allow all operations for now)
-- In production, you should restrict based on user authentication
-- ===========================================

CREATE POLICY "Allow all operations on team_members"
  ON team_members FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on app_settings"
  ON app_settings FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on customers"
  ON customers FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on deals"
  ON deals FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on activities"
  ON activities FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on email_templates"
  ON email_templates FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on notifications"
  ON notifications FOR ALL USING (true) WITH CHECK (true);

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

-- ===========================================
-- VIEWS FOR ANALYTICS
-- ===========================================

-- Pipeline Summary View
CREATE OR REPLACE VIEW pipeline_summary AS
SELECT 
  stage,
  COUNT(*) as deal_count,
  SUM(value) as total_value,
  AVG(probability) as avg_probability
FROM deals
WHERE stage NOT IN ('won', 'lost')
GROUP BY stage;

-- Team Performance View
CREATE OR REPLACE VIEW team_performance AS
SELECT 
  t.id,
  t.name,
  t.role,
  t.goal,
  COUNT(DISTINCT d.id) as total_deals,
  COUNT(DISTINCT CASE WHEN d.stage = 'won' THEN d.id END) as won_deals,
  SUM(CASE WHEN d.stage = 'won' THEN d.value ELSE 0 END) as won_value,
  SUM(CASE WHEN d.stage NOT IN ('won', 'lost') THEN d.value ELSE 0 END) as pipeline_value
FROM team_members t
LEFT JOIN deals d ON d.assigned_to = t.id
GROUP BY t.id, t.name, t.role, t.goal;

-- Customer Lifetime Value View
CREATE OR REPLACE VIEW customer_lifetime_value AS
SELECT 
  c.id,
  c.name,
  c.company,
  c.tier,
  COUNT(DISTINCT d.id) as total_deals,
  COUNT(DISTINCT CASE WHEN d.stage = 'won' THEN d.id END) as won_deals,
  SUM(CASE WHEN d.stage = 'won' THEN d.value ELSE 0 END) as lifetime_value,
  MAX(d.created_at) as last_activity
FROM customers c
LEFT JOIN deals d ON d.customer_id = c.id
GROUP BY c.id, c.name, c.company, c.tier;

-- Monthly Revenue View
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT 
  DATE_TRUNC('month', actual_close_date) as month,
  COUNT(*) as deal_count,
  SUM(value) as total_revenue,
  AVG(value) as avg_deal_value
FROM deals
WHERE stage = 'won' AND actual_close_date IS NOT NULL
GROUP BY DATE_TRUNC('month', actual_close_date)
ORDER BY month DESC;

-- ===========================================
-- SAMPLE DATA (Optional - for testing)
-- ===========================================

-- You can add sample customers and deals here for testing

-- ===========================================
-- DONE! ✅
-- ===========================================
