-- =========================================================================
-- ZENITH CRM - AUDIT LOG TABLE, TRIGGERS & POLICY MIGRATION
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- to create the audit_log table, set up auto-auditing triggers,
-- and allow admins/owners to read all audit log entries.
-- =========================================================================

-- Enable uuid-ossp extension for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create the audit_log table if it doesn't exist
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- 3. Create or replace the audit trigger function (SECURITY DEFINER)
-- This function runs with the privileges of the creator (bypass RLS for writing logs)
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

-- 4. Set up triggers on core tables (customers, deals, activities)
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

-- 5. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can read their audit log" ON audit_log;
DROP POLICY IF EXISTS "Authenticated users can read audit_log" ON audit_log;

-- 6. Create the updated SELECT policy for audit_log table
-- Regular users can only read audit logs they generated (changed_by = auth.uid())
-- Admins/Owners (is_admin() = true or owner email check) can read all audit logs in the system
CREATE POLICY "Users can read their audit log"
  ON audit_log
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email' = 'sorawittj@gmail.com') 
    OR (
      EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'is_admin'
      ) AND is_admin()
    )
    OR (changed_by = auth.uid())
  );
