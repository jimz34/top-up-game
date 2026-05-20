/*
  # Add role column to profiles table

  ## Summary
  Adds a `role` column to the `profiles` table so admin status can be stored
  directly on the user profile, matching the user's existing data setup.

  ## Changes

  ### Modified Tables
  - `profiles`
    - `role` (text, not null, default 'user') — user role: 'user' or 'admin'

  ## Security
  - No RLS policy changes required — existing policies remain unchanged
  - The role column is readable by the user themselves for client-side admin checks
  - Role updates should be restricted to admins only (policy added below)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text NOT NULL DEFAULT 'user';
  END IF;
END $$;

-- Allow users to read their own role
CREATE POLICY "Users can read own role"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow admins to update roles
CREATE POLICY "Admins can update roles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
