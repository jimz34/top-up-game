/*
  # Fix RLS policies to use profiles.role instead of has_role()

  ## Summary
  All RLS policies currently use the `has_role()` function which checks the
  `user_roles` table. Since admin status is now stored in `profiles.role`,
  we need to update all policies to check `profiles.role = 'admin'` instead.

  ## Changes
  - Drop all existing policies that use `has_role()`
  - Recreate them using `profiles.role = 'admin'` checks
  - This fixes admin access to games, products, transactions, wallets, etc.

  ## Security
  - All policies remain restrictive
  - Admin check now uses profiles.role column directly
  - Non-admin users still cannot access admin-only data
*/

-- Drop ALL existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Admins manage games" ON games;
DROP POLICY IF EXISTS "Games public read" ON games;
DROP POLICY IF EXISTS "Admins manage products" ON products;
DROP POLICY IF EXISTS "Products public read" ON products;
DROP POLICY IF EXISTS "Admins manage transactions" ON transactions;
DROP POLICY IF EXISTS "Users view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins update any profile" ON profiles;
DROP POLICY IF EXISTS "Profiles viewable by owner or admin" ON profiles;
DROP POLICY IF EXISTS "Users can read own role" ON profiles;
DROP POLICY IF EXISTS "Admins can update roles" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Users view own wallet" ON wallets;
DROP POLICY IF EXISTS "Admins manage wallets" ON wallets;
DROP POLICY IF EXISTS "Users view own history" ON wallet_history;

-- Games policies
CREATE POLICY "Games public read"
  ON games FOR SELECT
  TO authenticated
  USING (is_active = true OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Games anonymous read"
  ON games FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Admins manage games"
  ON games FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Products policies
CREATE POLICY "Products public read"
  ON products FOR SELECT
  TO authenticated
  USING (is_active = true OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Products anonymous read"
  ON products FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Admins manage products"
  ON products FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Transactions policies
CREATE POLICY "Users view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Users insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Profiles policies
CREATE POLICY "Profiles viewable by owner or admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- User roles policies
CREATE POLICY "Users view own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins manage roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Wallets policies
CREATE POLICY "Users view own wallet"
  ON wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins manage wallets"
  ON wallets FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Wallet history policies
CREATE POLICY "Users view own history"
  ON wallet_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
