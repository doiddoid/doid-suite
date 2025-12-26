/**
 * Fix schema subscriptions per activity-based model
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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

async function fixSchema() {
  console.log('\n=== FIX SCHEMA SUBSCRIPTIONS ===\n');

  // Non possiamo eseguire ALTER TABLE direttamente via Supabase client
  // Dobbiamo usare la REST API con il ruolo service_role

  // Invece, fissiamo i dati mancanti

  // 1. Assegna organization_id alle attività orfane
  console.log('1. Verifico attività senza organization_id...');

  const { data: orphanActivities } = await supabase
    .from('activities')
    .select('id, name')
    .is('organization_id', null);

  if (orphanActivities && orphanActivities.length > 0) {
    console.log(`   Trovate ${orphanActivities.length} attività orfane`);

    for (const activity of orphanActivities) {
      // Trova l'owner dell'attività
      const { data: activityUser } = await supabase
        .from('activity_users')
        .select('user_id')
        .eq('activity_id', activity.id)
        .eq('role', 'owner')
        .single();

      if (activityUser) {
        // Trova l'organizzazione dell'utente
        const { data: orgUser } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', activityUser.user_id)
          .limit(1)
          .single();

        if (orgUser) {
          await supabase
            .from('activities')
            .update({ organization_id: orgUser.organization_id })
            .eq('id', activity.id);

          console.log(`   ✅ ${activity.name} -> org ${orgUser.organization_id}`);
        } else {
          console.log(`   ⚠️  ${activity.name}: utente senza organizzazione`);
        }
      } else {
        console.log(`   ⚠️  ${activity.name}: nessun owner trovato`);
      }
    }
  } else {
    console.log('   ✅ Tutte le attività hanno organization_id');
  }

  // 2. Verifica stato finale
  console.log('\n2. Stato finale:');

  const { data: activities } = await supabase
    .from('activities')
    .select('id, name, organization_id, status')
    .limit(10);

  console.log('\n   Attività:');
  activities?.forEach(a => {
    console.log(`   - ${a.name}: org=${a.organization_id || 'NULL'}, status=${a.status}`);
  });

  console.log('\n=================================');
  console.log('⚠️  IMPORTANTE: Esegui la seguente query in Supabase SQL Editor:\n');
  console.log('   ALTER TABLE subscriptions ALTER COLUMN organization_id DROP NOT NULL;');
  console.log('\n=================================\n');
}

fixSchema().catch(console.error);
