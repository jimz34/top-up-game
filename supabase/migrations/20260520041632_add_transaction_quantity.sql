/*
  # Add quantity column to transactions table

  1. Modified Tables
    - `transactions`
      - `quantity` (integer, not null, default 1) — number of items in the transaction

  2. Security
    - No RLS changes — existing policies remain unchanged
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE transactions ADD COLUMN quantity integer NOT NULL DEFAULT 1;
  END IF;
END $$;
