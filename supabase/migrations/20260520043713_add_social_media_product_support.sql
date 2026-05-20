/*
  # Add Social Media Product Support

  ## Summary
  Extends the products table to support custom-quantity social media products
  (e.g., followers, likes) where users can input any quantity and the price
  is calculated dynamically based on a per-unit rate.

  ## Changes

  ### Modified Tables
  - `products`
    - `product_type` (text, not null, default 'fixed') — distinguishes product pricing model:
        'fixed' = standard fixed-price product (existing behavior)
        'followers' = social media followers, custom quantity, price_per_unit applies
        'likes' = social media likes, custom quantity, price_per_unit applies
    - `min_quantity` (integer, nullable) — minimum allowed quantity for custom-quantity products
    - `price_per_unit` (numeric, nullable) — price per single unit for custom-quantity products
      (e.g., 50 IDR per follower means 100 followers = 5000 IDR)

  ### Also stores user-provided social media URL/handle in transactions
  - `transactions`
    - `user_input` (text, nullable) — extra user input (e.g. social media profile URL or handle)

  ## Security
  - No RLS policy changes required — existing policies cover new columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'product_type'
  ) THEN
    ALTER TABLE products ADD COLUMN product_type text NOT NULL DEFAULT 'fixed';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'min_quantity'
  ) THEN
    ALTER TABLE products ADD COLUMN min_quantity integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'price_per_unit'
  ) THEN
    ALTER TABLE products ADD COLUMN price_per_unit numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'user_input'
  ) THEN
    ALTER TABLE transactions ADD COLUMN user_input text;
  END IF;
END $$;
