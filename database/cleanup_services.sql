-- ============================================
-- Pulizia Servizi - Eliminazione Permanente
-- Esegui in Supabase SQL Editor
-- ============================================

-- 1. Elimina subscriptions (tabella legacy) che referenziano i piani
DELETE FROM subscriptions
WHERE plan_id IN (
    SELECT p.id FROM plans p
    JOIN services s ON p.service_id = s.id
    WHERE s.code IN ('smart_review', 'smart_page', 'menu_digitale', 'display', 'display_suite', 'accessi')
);

-- 2. Elimina service_subscriptions associate
DELETE FROM service_subscriptions
WHERE service_id IN (
    SELECT id FROM services
    WHERE code IN ('smart_review', 'smart_page', 'menu_digitale', 'display', 'display_suite', 'accessi')
);

-- 3. Elimina i piani associati
DELETE FROM plans
WHERE service_id IN (
    SELECT id FROM services
    WHERE code IN ('smart_review', 'smart_page', 'menu_digitale', 'display', 'display_suite', 'accessi')
);

-- 4. Elimina i servizi
DELETE FROM services
WHERE code IN ('smart_review', 'smart_page', 'menu_digitale', 'display', 'display_suite', 'accessi');

-- 5. Verifica risultato
SELECT code, name, is_active FROM services ORDER BY sort_order;
