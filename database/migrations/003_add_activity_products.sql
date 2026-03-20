-- Migration 003: Tracciamento prodotti fisici acquistati per attività
-- Card, Stand, Adesivi NFC e altri prodotti custom

-- Tipo prodotto enum
CREATE TYPE product_type AS ENUM ('card', 'stand', 'adesivo', 'altro');

-- Tabella prodotti acquistati per attività
CREATE TABLE activity_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  product_type product_type NOT NULL,
  product_name VARCHAR(100), -- nome custom (es. "Stand in legno personalizzato")
  quantity INTEGER NOT NULL DEFAULT 1,
  purchase_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id), -- admin che ha registrato
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice per lookup rapido: "questa attività ha prodotti?"
CREATE INDEX idx_activity_products_activity_id ON activity_products(activity_id);

-- RLS policies
ALTER TABLE activity_products ENABLE ROW LEVEL SECURITY;

-- Le operazioni admin passano tramite supabaseAdmin (service_role key) che bypassa RLS.
-- Utenti possono leggere i propri prodotti (per verificare eligibilità Free plan)
CREATE POLICY "Users can view own activity products"
  ON activity_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activity_users
      WHERE activity_users.activity_id = activity_products.activity_id
      AND activity_users.user_id = auth.uid()
    )
  );

-- Trigger updated_at
CREATE TRIGGER update_activity_products_updated_at
  BEFORE UPDATE ON activity_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
