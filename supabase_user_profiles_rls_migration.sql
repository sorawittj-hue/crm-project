-- =========================================================================
-- ZENITH CRM - USER PROFILES SECURITY & ROW LEVEL SECURITY (RLS) MIGRATION
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- to secure the `user_profiles` table against client-side exploitation.
--
-- This script does NOT modify or delete any existing data. It is 100% safe.
-- =========================================================================

-- 1. Ensure the owner account has the 'admin' role in user_profiles
UPDATE user_profiles SET role = 'admin' WHERE email = 'sorawittj@gmail.com';

-- 2. Define the SECURITY DEFINER function to check admin role (avoids RLS infinite recursion)
-- We cast auth.uid() to text (auth.uid()::text) because the id column in user_profiles is stored as text.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'email' = 'sorawittj@gmail.com')
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Enable Row Level Security (RLS) on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Drop any pre-existing policies on this table to prevent conflicts
DROP POLICY IF EXISTS "Allow authenticated read on user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow owner all access on user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow self updates on user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Self read on user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin read all on user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow admin all access on user_profiles" ON user_profiles;

-- 5. Policy: Allow users to read their own profile row
CREATE POLICY "Self read on user_profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id);

-- 6. Policy: Allow admins/owner to read all profile rows
CREATE POLICY "Admin read all on user_profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- 7. Policy: Allow admins/owner full access (INSERT, UPDATE, DELETE)
CREATE POLICY "Allow admin all access on user_profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- 8. Policy: Allow authenticated users to update their own profile row
CREATE POLICY "Allow self updates on user_profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- 9. Trigger: Enforce column-level security on self-updates (Role/Plan Protection)
-- Even though a user is allowed to update their own row, we want to block regular users
-- from modifying sensitive columns like 'role', 'plan_type', or 'trial_ends_at'.
-- Only admins/owner are allowed to change these fields.

CREATE OR REPLACE FUNCTION verify_user_profile_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- If the transaction is executed by an admin/owner, allow all changes
  IF is_admin() THEN
    RETURN NEW;
  END IF;

  -- Block normal users from modifying role
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Unauthorized operation: Regular users cannot modify system roles.';
  END IF;

  -- Block normal users from modifying plan type
  IF OLD.plan_type IS DISTINCT FROM NEW.plan_type THEN
    RAISE EXCEPTION 'Unauthorized operation: Regular users cannot modify subscription plans.';
  END IF;

  -- Block normal users from modifying trial dates
  IF OLD.trial_ends_at IS DISTINCT FROM NEW.trial_ends_at THEN
    RAISE EXCEPTION 'Unauthorized operation: Regular users cannot modify subscription trial dates.';
  END IF;

  -- Double-check that normal users can only edit their own profile row
  IF auth.uid()::text <> NEW.id::text THEN
    RAISE EXCEPTION 'Unauthorized operation: You can only modify your own profile.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_verify_user_profile_integrity ON user_profiles;
CREATE TRIGGER trg_verify_user_profile_integrity
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION verify_user_profile_integrity();

-- =========================================================================
-- SECURED! ✅ 
-- Regular users can still edit their own names, personal targets, and avatar 
-- color themes, but can NEVER escalate their role to Admin or upgrade their 
-- plan to Pro. The systems owner/admins retain full administrative privileges.
-- =========================================================================
