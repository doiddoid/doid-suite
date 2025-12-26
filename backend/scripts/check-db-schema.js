/**
 * Verifica schema database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkSchema() {
  console.log('\n=== VERIFICA SCHEMA DATABASE ===\n');

  // Check subscriptions columns
  const { data: subCols, error: subErr } = await supabase.rpc('get_table_columns', {
    table_name: 'subscriptions'
  });

  if (subErr) {
    console.log('Provo query diretta sulla tabella subscriptions...\n');

    // Try a direct query
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);

    if (error) {
      console.log('Errore query subscriptions:', error.message);

      // Check if table exists at all
      const { data: testData, error: testErr } = await supabase
        .from('services')
        .select('id, code')
        .limit(3);

      console.log('\nServizi disponibili:');
      console.log(testData);

      const { data: planData } = await supabase
        .from('plans')
        .select('id, code, service_id, trial_days')
        .limit(5);

      console.log('\nPiani disponibili:');
      console.log(planData);

    } else {
      console.log('Colonne in subscriptions (da dati):');
      if (data && data[0]) {
        console.log(Object.keys(data[0]));
      } else {
        console.log('(tabella vuota)');

        // Insert test
        console.log('\nProvo insert di test...');

        // Get a service and plan
        const { data: service } = await supabase
          .from('services')
          .select('id')
          .eq('code', 'smart_review')
          .single();

        const { data: plan } = await supabase
          .from('plans')
          .select('id')
          .eq('code', 'pro')
          .limit(1)
          .single();

        console.log('Service ID:', service?.id);
        console.log('Plan ID:', plan?.id);

        if (service && plan) {
          const testInsert = {
            activity_id: 'c6504247-26c7-4eb3-96f8-529c8600f73c',
            service_id: service.id,
            plan_id: plan.id,
            status: 'trial',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          };

          console.log('\nDati insert:', testInsert);

          const { data: inserted, error: insertErr } = await supabase
            .from('subscriptions')
            .insert(testInsert)
            .select();

          if (insertErr) {
            console.log('\n❌ Errore insert:', insertErr);
          } else {
            console.log('\n✅ Insert OK:', inserted);
          }
        }
      }
    }
  }

  // Check activities
  console.log('\n=== ACTIVITIES ===');
  const { data: activities } = await supabase
    .from('activities')
    .select('id, name, organization_id')
    .limit(3);
  console.log(activities);
}

checkSchema().catch(console.error);
