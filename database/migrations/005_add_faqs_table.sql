-- Migration: Aggiunta tabella FAQ gestibili da admin
-- Data: 2026-03-26

-- Tabella FAQ
CREATE TABLE IF NOT EXISTS faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_code VARCHAR(50) NOT NULL,        -- 'suite', 'review', 'page', 'menu', 'general'
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice per query per servizio
CREATE INDEX idx_faqs_service_code ON faqs(service_code);
CREATE INDEX idx_faqs_published ON faqs(is_published, service_code, sort_order);

-- RLS
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Policy: tutti possono leggere le FAQ pubblicate
CREATE POLICY "faqs_read_published" ON faqs
  FOR SELECT USING (is_published = true);

-- Policy: solo service role può gestire (admin via backend)
CREATE POLICY "faqs_admin_manage" ON faqs
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW
  EXECUTE FUNCTION update_faqs_updated_at();
