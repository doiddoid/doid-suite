-- Migration: Add Italian billing fields to organizations table
-- Run this in Supabase SQL Editor

-- ============================================
-- NEW BILLING FIELDS FOR ORGANIZATIONS
-- ============================================

-- Ragione sociale (business name, if different from name)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);

-- Codice fiscale (Italian tax code - 16 chars alphanumeric)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS fiscal_code VARCHAR(16);

-- Address fields
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS postal_code VARCHAR(5);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS province VARCHAR(2);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Italia';

-- Electronic invoicing (Fatturazione Elettronica)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sdi_code VARCHAR(7);  -- Codice destinatario SDI
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pec VARCHAR(255);     -- PEC email
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS use_pec BOOLEAN DEFAULT false;  -- Use PEC instead of SDI

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN organizations.business_name IS 'Ragione sociale se diversa dal nome';
COMMENT ON COLUMN organizations.fiscal_code IS 'Codice fiscale italiano (16 caratteri)';
COMMENT ON COLUMN organizations.address IS 'Via e numero civico';
COMMENT ON COLUMN organizations.postal_code IS 'CAP (5 cifre)';
COMMENT ON COLUMN organizations.city IS 'Città';
COMMENT ON COLUMN organizations.province IS 'Sigla provincia (2 lettere, es: MI, RM)';
COMMENT ON COLUMN organizations.country IS 'Nazione (default: Italia)';
COMMENT ON COLUMN organizations.sdi_code IS 'Codice SDI per fatturazione elettronica (7 caratteri)';
COMMENT ON COLUMN organizations.pec IS 'Indirizzo PEC per fatturazione elettronica';
COMMENT ON COLUMN organizations.use_pec IS 'Se true, usa PEC invece di Codice SDI';
