/**
 * Script one-shot: setta must_reset_password = true per tutti gli utenti
 * TRANNE i super admin.
 *
 * Esegui con: node scripts/set-must-reset-password.js
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

const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || 'admin@doid.it').split(',').map(e => e.trim());

async function main() {
  console.log('Fetching all users...');
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  if (error) {
    console.error('Errore listUsers:', error);
    process.exit(1);
  }

  const users = data.users;
  console.log(`Trovati ${users.length} utenti. Super admin esclusi: ${SUPER_ADMIN_EMAILS.join(', ')}`);

  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    // Skip super admin
    if (SUPER_ADMIN_EMAILS.includes(user.email)) {
      console.log(`  SKIP (super admin): ${user.email}`);
      skipped++;
      continue;
    }

    // Skip se ha già must_reset_password = true
    if (user.user_metadata?.must_reset_password === true) {
      console.log(`  SKIP (già settato): ${user.email}`);
      skipped++;
      continue;
    }

    // Skip se ha già must_reset_password = false (ha già cambiato la password)
    if (user.user_metadata?.must_reset_password === false) {
      console.log(`  SKIP (già cambiata): ${user.email}`);
      skipped++;
      continue;
    }

    // Setta must_reset_password = true
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        must_reset_password: true
      }
    });

    if (updateError) {
      console.error(`  ERRORE ${user.email}:`, updateError.message);
    } else {
      console.log(`  OK: ${user.email}`);
      updated++;
    }
  }

  console.log(`\nDone! Aggiornati: ${updated}, Skippati: ${skipped}`);
}

main().catch(console.error);
