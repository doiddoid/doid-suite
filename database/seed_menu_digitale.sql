-- DOID Suite - Menu Digitale Service Setup
-- Run this in Supabase SQL Editor to set up the Menu Digitale service

-- ============================================
-- INSERT SERVICE (if not exists)
-- ============================================

INSERT INTO services (code, name, description, app_url, icon, color, is_active, sort_order)
VALUES (
    'menu_digitale',
    'Menu Digitale',
    'Menu digitale per ristoranti con QR code e multilingua',
    'https://menu.doid.it',
    'UtensilsCrossed',
    '#10B981',
    true,
    3
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    app_url = EXCLUDED.app_url,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    is_active = EXCLUDED.is_active;

-- ============================================
-- INSERT PLANS FOR MENU DIGITALE
-- ============================================

-- Free Plan
INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, features, is_active, sort_order)
SELECT
    s.id,
    'free',
    'Free',
    0,
    0,
    '{
        "menus": 1,
        "categories": 5,
        "items": 20,
        "languages": 1,
        "qr_codes": 1,
        "analytics": false,
        "custom_domain": false,
        "delivery_orders": false
    }'::jsonb,
    true,
    1
FROM services s
WHERE s.code = 'menu_digitale'
ON CONFLICT (service_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active;

-- Pro Plan
INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, features, is_active, sort_order, trial_days)
SELECT
    s.id,
    'pro',
    'Pro',
    9.99,
    99.99,
    '{
        "menus": 10,
        "categories": -1,
        "items": -1,
        "languages": 11,
        "qr_codes": -1,
        "analytics": true,
        "custom_domain": true,
        "delivery_orders": true,
        "allergens": true,
        "prices_variants": true
    }'::jsonb,
    true,
    2,
    30
FROM services s
WHERE s.code = 'menu_digitale'
ON CONFLICT (service_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active;

-- Business Plan (for agencies)
INSERT INTO plans (service_id, code, name, price_monthly, price_yearly, features, is_active, sort_order, trial_days)
SELECT
    s.id,
    'business',
    'Business',
    29.99,
    299.99,
    '{
        "menus": -1,
        "categories": -1,
        "items": -1,
        "languages": 11,
        "qr_codes": -1,
        "analytics": true,
        "custom_domain": true,
        "delivery_orders": true,
        "allergens": true,
        "prices_variants": true,
        "white_label": true,
        "api_access": true,
        "priority_support": true
    }'::jsonb,
    true,
    3,
    30
FROM services s
WHERE s.code = 'menu_digitale'
ON CONFLICT (service_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active;

-- ============================================
-- VERIFY DATA
-- ============================================

-- Show service
SELECT 'SERVICE:' as type, id, code, name, app_url, is_active
FROM services
WHERE code = 'menu_digitale';

-- Show plans
SELECT 'PLAN:' as type, p.id, p.code, p.name, p.price_monthly, p.features, p.trial_days
FROM plans p
JOIN services s ON p.service_id = s.id
WHERE s.code = 'menu_digitale'
ORDER BY p.sort_order;

-- ============================================
-- HELPER: CREATE TEST SUBSCRIPTION FOR USER
-- ============================================

-- Uncomment and modify to create a test trial subscription for a specific user
-- Replace 'YOUR_USER_ID' with actual Supabase user UUID
-- Replace 'YOUR_ACTIVITY_ID' with actual activity UUID

/*
INSERT INTO subscriptions (
    activity_id,
    service_id,
    plan_id,
    status,
    trial_ends_at,
    current_period_start,
    current_period_end
)
SELECT
    'YOUR_ACTIVITY_ID'::uuid,
    s.id,
    p.id,
    'trial',
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW() + INTERVAL '30 days'
FROM services s
JOIN plans p ON p.service_id = s.id
WHERE s.code = 'menu_digitale'
  AND p.code = 'pro';
*/
