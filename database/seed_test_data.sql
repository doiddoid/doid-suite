-- ============================================
-- DOID Suite - Seed Test Data
-- Popola il database con dati di test per I Miei Servizi
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 0. TROVA L'UTENTE
-- Prima esegui questa query per trovare l'utente admin@doid.biz
-- o un altro utente disponibile
-- ============================================

-- SELECT id, email FROM auth.users WHERE email = 'admin@doid.biz';
-- Se non esiste, trova altri utenti:
-- SELECT id, email FROM auth.users LIMIT 10;

-- ============================================
-- 1. AGGIORNA PREZZO ADD-ON REVIEW A 7.90€
-- Per ottenere il totale atteso di 22,80€
-- ============================================

UPDATE services
SET price_addon_monthly = 7.90
WHERE code = 'review';

-- ============================================
-- 2. POPOLA DATI DI TEST
-- ============================================

DO $$
DECLARE
    v_user_id UUID;
    v_organization_id UUID;
    v_activity_dolce_vita UUID;
    v_activity_napoli UUID;
    v_activity_bar_sport UUID;
    v_service_review_id UUID;
    v_service_page_id UUID;
    v_service_menu_id UUID;
BEGIN
    -- Trova admin@doid.biz o il primo utente disponibile
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@doid.biz' LIMIT 1;

    IF v_user_id IS NULL THEN
        -- Fallback: prendi il primo utente
        SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    END IF;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Nessun utente trovato nel database. Crea prima un utente.';
    END IF;

    RAISE NOTICE 'Usando utente: %', v_user_id;

    -- ============================================
    -- 2a. CREA ORGANIZZAZIONE DI TEST
    -- (per visualizzazione in Admin > Clienti)
    -- ============================================

    INSERT INTO organizations (id, name, slug, email, phone, status, account_type, max_activities)
    VALUES (
        uuid_generate_v4(),
        'DOID Test Account',
        'doid-test-account',
        'test@doid.biz',
        '+39 02 9999999',
        'active',
        'agency',
        10
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        account_type = EXCLUDED.account_type,
        max_activities = EXCLUDED.max_activities
    RETURNING id INTO v_organization_id;

    IF v_organization_id IS NULL THEN
        SELECT id INTO v_organization_id FROM organizations WHERE slug = 'doid-test-account' LIMIT 1;
    END IF;

    RAISE NOTICE 'Organizzazione creata/trovata: %', v_organization_id;

    -- ============================================
    -- 2b. COLLEGA UTENTE ALL ORGANIZZAZIONE COME OWNER
    -- ============================================

    INSERT INTO organization_users (organization_id, user_id, role)
    VALUES (v_organization_id, v_user_id, 'owner')
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role = 'owner';

    RAISE NOTICE 'Utente collegato come owner dell organizzazione';

    -- ============================================
    -- 3. OTTIENI GLI ID DEI SERVIZI
    -- ============================================

    SELECT id INTO v_service_review_id FROM services WHERE code = 'review' LIMIT 1;
    SELECT id INTO v_service_page_id FROM services WHERE code = 'page' LIMIT 1;
    SELECT id INTO v_service_menu_id FROM services WHERE code = 'menu' LIMIT 1;

    IF v_service_review_id IS NULL THEN
        RAISE EXCEPTION 'Servizio "review" non trovato. Esegui prima migrations_service_subscriptions_schema.sql';
    END IF;

    IF v_service_page_id IS NULL THEN
        RAISE EXCEPTION 'Servizio "page" non trovato. Esegui prima migrations_service_subscriptions_schema.sql';
    END IF;

    RAISE NOTICE 'Servizi trovati - Review: %, Page: %, Menu: %', v_service_review_id, v_service_page_id, v_service_menu_id;

    -- ============================================
    -- 4. CREA LE ATTIVITA DI TEST
    -- (con organization_id per visualizzazione in Admin)
    -- ============================================

    -- Ristorante La Dolce Vita
    INSERT INTO activities (id, user_id, organization_id, name, slug, address, phone, email, status, is_active)
    VALUES (
        uuid_generate_v4(),
        v_user_id,
        v_organization_id,
        'Ristorante La Dolce Vita',
        'ristorante-la-dolce-vita',
        'Via Roma 123, 20100 Milano',
        '+39 02 1234567',
        'info@ladolcevita.it',
        'active',
        TRUE
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        user_id = EXCLUDED.user_id,
        organization_id = EXCLUDED.organization_id,
        status = 'active',
        is_active = TRUE
    RETURNING id INTO v_activity_dolce_vita;

    -- Se ON CONFLICT ha restituito null, cerca l'attivita esistente
    IF v_activity_dolce_vita IS NULL THEN
        SELECT id INTO v_activity_dolce_vita FROM activities WHERE slug = 'ristorante-la-dolce-vita' LIMIT 1;
    END IF;

    RAISE NOTICE 'Attivita La Dolce Vita: %', v_activity_dolce_vita;

    -- Pizzeria Bella Napoli
    INSERT INTO activities (id, user_id, organization_id, name, slug, address, phone, email, status, is_active)
    VALUES (
        uuid_generate_v4(),
        v_user_id,
        v_organization_id,
        'Pizzeria Bella Napoli',
        'pizzeria-bella-napoli',
        'Corso Napoli 45, 80100 Napoli',
        '+39 081 7654321',
        'info@bellanapoli.it',
        'active',
        TRUE
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        user_id = EXCLUDED.user_id,
        organization_id = EXCLUDED.organization_id,
        status = 'active',
        is_active = TRUE
    RETURNING id INTO v_activity_napoli;

    IF v_activity_napoli IS NULL THEN
        SELECT id INTO v_activity_napoli FROM activities WHERE slug = 'pizzeria-bella-napoli' LIMIT 1;
    END IF;

    RAISE NOTICE 'Attivita Bella Napoli: %', v_activity_napoli;

    -- Bar Sport Centro
    INSERT INTO activities (id, user_id, organization_id, name, slug, address, phone, email, status, is_active)
    VALUES (
        uuid_generate_v4(),
        v_user_id,
        v_organization_id,
        'Bar Sport Centro',
        'bar-sport-centro',
        'Piazza Centrale 1, 00100 Roma',
        '+39 06 9876543',
        'info@barsportcentro.it',
        'active',
        TRUE
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        user_id = EXCLUDED.user_id,
        organization_id = EXCLUDED.organization_id,
        status = 'active',
        is_active = TRUE
    RETURNING id INTO v_activity_bar_sport;

    IF v_activity_bar_sport IS NULL THEN
        SELECT id INTO v_activity_bar_sport FROM activities WHERE slug = 'bar-sport-centro' LIMIT 1;
    END IF;

    RAISE NOTICE 'Attivita Bar Sport Centro: %', v_activity_bar_sport;

    -- ============================================
    -- 5. CREA LE SUBSCRIPTIONS
    -- ============================================

    -- Review / La Dolce Vita: PRO mensile, addon=false
    INSERT INTO service_subscriptions (
        activity_id, service_id, status, billing_cycle, is_addon,
        pro_started_at, current_period_start, current_period_end
    ) VALUES (
        v_activity_dolce_vita,
        v_service_review_id,
        'pro',
        'monthly',
        FALSE,
        NOW() - INTERVAL '30 days',
        NOW(),
        NOW() + INTERVAL '30 days'
    )
    ON CONFLICT (activity_id, service_id, is_addon) DO UPDATE SET
        status = EXCLUDED.status,
        billing_cycle = EXCLUDED.billing_cycle,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = NOW();

    RAISE NOTICE 'Creata subscription: Review PRO per La Dolce Vita';

    -- Review / Pizzeria Bella Napoli: PRO mensile, addon=true (add-on)
    INSERT INTO service_subscriptions (
        activity_id, service_id, status, billing_cycle, is_addon,
        pro_started_at, current_period_start, current_period_end
    ) VALUES (
        v_activity_napoli,
        v_service_review_id,
        'pro',
        'monthly',
        TRUE,
        NOW() - INTERVAL '15 days',
        NOW(),
        NOW() + INTERVAL '30 days'
    )
    ON CONFLICT (activity_id, service_id, is_addon) DO UPDATE SET
        status = EXCLUDED.status,
        billing_cycle = EXCLUDED.billing_cycle,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = NOW();

    RAISE NOTICE 'Creata subscription: Review PRO ADD-ON per Bella Napoli';

    -- Review / Bar Sport: FREE, addon=false
    INSERT INTO service_subscriptions (
        activity_id, service_id, status, billing_cycle, is_addon
    ) VALUES (
        v_activity_bar_sport,
        v_service_review_id,
        'free',
        'monthly',
        FALSE
    )
    ON CONFLICT (activity_id, service_id, is_addon) DO UPDATE SET
        status = EXCLUDED.status,
        updated_at = NOW();

    RAISE NOTICE 'Creata subscription: Review FREE per Bar Sport';

    -- Page / La Dolce Vita: TRIAL, addon=false, scade tra 15gg
    INSERT INTO service_subscriptions (
        activity_id, service_id, status, billing_cycle, is_addon,
        trial_started_at, trial_ends_at
    ) VALUES (
        v_activity_dolce_vita,
        v_service_page_id,
        'trial',
        'monthly',
        FALSE,
        NOW() - INTERVAL '15 days',
        NOW() + INTERVAL '15 days'
    )
    ON CONFLICT (activity_id, service_id, is_addon) DO UPDATE SET
        status = EXCLUDED.status,
        trial_started_at = EXCLUDED.trial_started_at,
        trial_ends_at = EXCLUDED.trial_ends_at,
        updated_at = NOW();

    RAISE NOTICE 'Creata subscription: Page TRIAL per La Dolce Vita';

    -- Page / Bar Sport: FREE, addon=false
    INSERT INTO service_subscriptions (
        activity_id, service_id, status, billing_cycle, is_addon
    ) VALUES (
        v_activity_bar_sport,
        v_service_page_id,
        'free',
        'monthly',
        FALSE
    )
    ON CONFLICT (activity_id, service_id, is_addon) DO UPDATE SET
        status = EXCLUDED.status,
        updated_at = NOW();

    RAISE NOTICE 'Creata subscription: Page FREE per Bar Sport';

    -- Menu: NESSUNA subscription (la card deve apparire vuota)
    -- Non inseriamo nulla per Menu

    RAISE NOTICE '=== SEED COMPLETATO ===';

END $$;

-- ============================================
-- 6. CHECKPOINT: Verifica dati inseriti
-- ============================================

-- Verifica organizzazione
SELECT
    o.name AS organization_name,
    o.slug,
    o.status,
    o.account_type,
    u.email AS owner_email
FROM organizations o
JOIN organization_users ou ON o.id = ou.organization_id AND ou.role = 'owner'
JOIN auth.users u ON ou.user_id = u.id
WHERE o.slug = 'doid-test-account';

-- Verifica attivita
SELECT
    a.name AS activity_name,
    a.slug,
    o.name AS organization_name,
    u.email AS owner_email,
    a.status,
    a.is_active
FROM activities a
LEFT JOIN organizations o ON a.organization_id = o.id
JOIN auth.users u ON a.user_id = u.id
WHERE a.slug IN ('ristorante-la-dolce-vita', 'pizzeria-bella-napoli', 'bar-sport-centro')
ORDER BY a.name;

-- Verifica subscriptions
SELECT
    a.name AS activity_name,
    s.code AS service_code,
    ss.status,
    ss.billing_cycle,
    ss.is_addon,
    ss.trial_ends_at,
    ss.current_period_end,
    CASE
        WHEN ss.status = 'pro' AND ss.is_addon = TRUE THEN s.price_addon_monthly
        WHEN ss.status = 'pro' THEN s.price_pro_monthly
        ELSE 0
    END AS price
FROM service_subscriptions ss
JOIN activities a ON ss.activity_id = a.id
JOIN services s ON ss.service_id = s.id
WHERE a.slug IN ('ristorante-la-dolce-vita', 'pizzeria-bella-napoli', 'bar-sport-centro')
ORDER BY s.sort_order, a.name;

-- Riepilogo totali
SELECT
    COUNT(*) FILTER (WHERE ss.status = 'pro') AS total_pro,
    COUNT(*) FILTER (WHERE ss.status = 'trial') AS total_trial,
    COUNT(*) FILTER (WHERE ss.status = 'free') AS total_free,
    SUM(
        CASE
            WHEN ss.status = 'pro' AND ss.is_addon = TRUE THEN s.price_addon_monthly
            WHEN ss.status = 'pro' THEN s.price_pro_monthly
            ELSE 0
        END
    ) AS total_monthly
FROM service_subscriptions ss
JOIN activities a ON ss.activity_id = a.id
JOIN services s ON ss.service_id = s.id
WHERE a.slug IN ('ristorante-la-dolce-vita', 'pizzeria-bella-napoli', 'bar-sport-centro');

-- ============================================
-- RISULTATI ATTESI:
--
-- ADMIN > CLIENTI:
--   - Organizzazione "DOID Test Account" con 3 attivita
--
-- I MIEI SERVIZI:
--   Review: 3 elementi
--     - La Dolce Vita: PRO mensile (14,90) -> bottone "Annuale"
--     - Bella Napoli: PRO ADD-ON mensile (7,90) -> bottone "Annuale"
--     - Bar Sport: FREE -> bottone "Attiva PRO"
--
--   Page: 2 elementi
--     - La Dolce Vita: TRIAL (scade tra 15gg) -> countdown + "Attiva PRO"
--     - Bar Sport: FREE -> bottone "Attiva PRO"
--
--   Menu: 0 elementi -> card con bottone "Attiva"
--
-- Totale mensile: 14,90 + 7,90 = 22,80
--
-- Banner sconto: NON visibile (solo 2 PRO ma dello stesso servizio Review)
-- ============================================
