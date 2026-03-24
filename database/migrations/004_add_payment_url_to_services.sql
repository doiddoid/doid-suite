-- Aggiunge colonna payment_url alla tabella services
-- URL del link di pagamento GHL per acquisto/rinnovo servizio
ALTER TABLE services ADD COLUMN IF NOT EXISTS payment_url TEXT DEFAULT NULL;

COMMENT ON COLUMN services.payment_url IS 'URL link di pagamento GHL (es. https://connect.doid.it/cartsmartreview)';
