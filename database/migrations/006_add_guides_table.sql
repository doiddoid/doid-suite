-- Migration: Tabella Guide gestibili da admin
-- Data: 2026-03-27

CREATE TABLE IF NOT EXISTS guides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_code VARCHAR(50) NOT NULL,          -- 'suite', 'review', 'page', 'menu', 'chat_ai'
  title TEXT NOT NULL,                         -- "Cos'è Chat AI e Come Funziona"
  subtitle TEXT,                               -- "Panoramica, funzionalità principali..."
  sections JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{title, content, tip?, warning?, screenshot?}]
  faq JSONB DEFAULT '[]'::jsonb,              -- [{q, a}]
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guides_service ON guides(service_code);
CREATE INDEX idx_guides_published ON guides(is_published, service_code, sort_order);

ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guides_read_published" ON guides FOR SELECT USING (is_published = true);
CREATE POLICY "guides_admin_manage" ON guides FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_guides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guides_updated_at
  BEFORE UPDATE ON guides
  FOR EACH ROW
  EXECUTE FUNCTION update_guides_updated_at();
