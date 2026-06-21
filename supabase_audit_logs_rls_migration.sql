-- =========================================================================
-- ZENITH CRM - AUDIT LOG POLICY MIGRATION
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- to allow admins and owners to read all audit log entries.
-- =========================================================================

-- 1. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can read their audit log" ON audit_log;
DROP POLICY IF EXISTS "Authenticated users can read audit_log" ON audit_log;

-- 2. Create the updated SELECT policy for audit_log table
-- Regular users can only read audit logs they generated (changed_by = auth.uid())
-- Admins/Owners (is_admin() = true) can read all audit logs in the system
CREATE POLICY "Users can read their audit log"
  ON audit_log
  FOR SELECT
  TO authenticated
  USING (is_admin() OR (changed_by = auth.uid()));
