-- ============================================================
-- RLS Verification Script
-- Run these queries in Supabase SQL Editor to verify
-- Row Level Security policies are working correctly.
-- ============================================================

-- 1. Verify RLS is enabled on all tables
SELECT tablename,
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END AS rls_status
FROM pg_tables
JOIN pg_class ON pg_tables.tablename = pg_class.relname
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: All 8 tables show ENABLED

-- 2. List all RLS policies
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected: Policies for profiles, pricing_tiers, sectors, categories,
-- products, dealer_addresses, orders, order_items

-- 3. Verify catalog is readable (as any authenticated user)
-- This should return rows:
SELECT COUNT(*) AS pricing_tier_count FROM pricing_tiers;
SELECT COUNT(*) AS sector_count FROM sectors;
SELECT COUNT(*) AS category_count FROM categories;
SELECT COUNT(*) AS product_count FROM products;

-- Expected: pricing_tiers=4, sectors=1, categories=4, products=12

-- 4. Verify order sequence is working
SELECT last_value FROM order_number_seq;

-- Expected: 1 (or higher if orders have been placed)

-- 5. Verify triggers exist
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Expected triggers:
-- set_order_number on orders (BEFORE INSERT)
-- update_orders_updated_at on orders (BEFORE UPDATE)
-- update_products_updated_at on products (BEFORE UPDATE)
-- update_profiles_updated_at on profiles (BEFORE UPDATE)

-- 6. Verify handle_new_user trigger on auth.users
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- Expected: on_auth_user_created trigger exists
