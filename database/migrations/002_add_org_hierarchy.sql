-- ============================================
-- DOID Suite - Migration: Gerarchia Clienti
-- ============================================
-- Eseguire in Supabase SQL Editor
-- Prerequisito: migrations_agencies.sql (account_type ENUM gia' esistente)

-- 1. Estendere ENUM account_type con i nuovi valori per gerarchia
ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'client';
ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'sub';

-- 2. Aggiungere il riferimento al padre gerarchico
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS parent_org_id UUID
  REFERENCES organizations(id) ON DELETE SET NULL;

-- 3. Indice per le query gerarchiche
CREATE INDEX IF NOT EXISTS idx_organizations_parent_org_id
  ON organizations(parent_org_id);

-- 4. Indice per le query per tipo account
CREATE INDEX IF NOT EXISTS idx_organizations_account_type
  ON organizations(account_type);

-- 5. Commenti
COMMENT ON COLUMN organizations.parent_org_id
  IS 'FK a organizzazione padre nella gerarchia: agency->client->sub. NULL per agenzie e clienti diretti (single)';

-- NOTA: i record esistenti restano invariati:
--   account_type = 'agency' per le agenzie (gia' esistente)
--   account_type = 'single' per i clienti diretti (gia' esistente)
--   parent_org_id = NULL per tutti (aggiornare manualmente le relazioni)
--
-- Mappatura tipi:
--   'agency' = Agenzia (Livello 1)
--   'client' = Cliente di agenzia (Livello 2, parent_org_id = agenzia)
--   'sub'    = Sotto-sede (Livello 3, parent_org_id = cliente L2)
--   'single' = Cliente diretto (nessun parent)

-- ============================================
-- FINE MIGRATION
-- ============================================
