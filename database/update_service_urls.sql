-- Aggiorna URL servizi DOID
-- Eseguire in Supabase SQL Editor

UPDATE services SET app_url = 'https://review.doid.it/app' WHERE code = 'smart_review';
UPDATE services SET app_url = 'https://page.doid.it' WHERE code = 'smart_page';
UPDATE services SET app_url = 'https://menu.doid.it' WHERE code = 'menu_digitale';
UPDATE services SET app_url = 'https://display.doid.it' WHERE code = 'display_suite';

-- Verifica
SELECT code, name, app_url FROM services ORDER BY sort_order;
