-- ============================================
-- AGGIORNA TRIAL DAYS A 30 GIORNI
-- Eseguire in Supabase SQL Editor
-- ============================================

-- Aggiorna trial_days per tutti i piani PRO a 30 giorni
UPDATE plans
SET trial_days = 30
WHERE code = 'pro';

-- Aggiorna trial_days per tutti i piani BUSINESS a 30 giorni
UPDATE plans
SET trial_days = 30
WHERE code = 'business';

-- Aggiorna trial_days nella tabella services (se presente)
UPDATE services
SET trial_days = 30
WHERE trial_days IS NOT NULL AND trial_days != 0;

-- Verifica i risultati
SELECT
    s.code as service_code,
    p.code as plan_code,
    p.name as plan_name,
    p.trial_days
FROM plans p
JOIN services s ON p.service_id = s.id
ORDER BY s.code, p.sort_order;
