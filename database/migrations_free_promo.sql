-- DOID Suite - Free Promo Migration
-- Aggiunge supporto per PRO gratuito (promo/partner)
-- Run this in Supabase SQL Editor

-- Aggiungi colonna is_free_promo alla tabella subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_free_promo BOOLEAN DEFAULT FALSE;

-- Commento descrittivo
COMMENT ON COLUMN subscriptions.is_free_promo IS 'Indica se l''abbonamento PRO è stato concesso gratuitamente (promo, partner, demo)';

-- Indice per query future
CREATE INDEX IF NOT EXISTS idx_subscriptions_free_promo ON subscriptions(is_free_promo) WHERE is_free_promo = true;
