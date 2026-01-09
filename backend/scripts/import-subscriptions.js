/**
 * Import abbonamenti da Smart Review a DOID Suite
 *
 * Legge il CSV degli utenti con le licenze e crea gli abbonamenti
 * per le attività corrispondenti.
 *
 * Esegui con: node scripts/import-subscriptions.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// IDs fissi per Smart Review
const SMART_REVIEW_SERVICE_ID = '4a8966ab-b29e-4946-8847-b085afb8a4af';
const SMART_REVIEW_PRO_PLAN_ID = '529a06b2-1ee5-4d1a-a268-3bdbd1ca2d78';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log('\n' + '='.repeat(50));
  console.log('  IMPORT ABBONAMENTI SMART REVIEW');
  console.log('='.repeat(50));

  if (DRY_RUN) {
    console.log('\n🔍 MODALITÀ DRY-RUN\n');
  }

  // Leggi CSV
  const csvPath = join(__dirname, '../../database/users-smart.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  const users = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  console.log(`📋 Trovati ${users.length} utenti nel CSV\n`);

  // Ottieni tutti gli utenti Supabase (con paginazione)
  let allAuthUsers = [];
  let page = 1;
  while (true) {
    const { data: authData } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (!authData?.users?.length) break;
    allAuthUsers = allAuthUsers.concat(authData.users);
    if (authData.users.length < 1000) break;
    page++;
  }
  const supabaseUsers = new Map(allAuthUsers.map(u => [u.email.toLowerCase(), u]));

  // Ottieni tutte le organizzazioni con utenti
  const { data: orgUsers } = await supabase
    .from('organization_users')
    .select('user_id, organization_id, organizations(id, name)');

  const userOrgMap = new Map();
  orgUsers?.forEach(ou => {
    if (!userOrgMap.has(ou.user_id)) {
      userOrgMap.set(ou.user_id, ou.organization_id);
    }
  });

  // Ottieni tutte le attività
  const { data: activities } = await supabase
    .from('activities')
    .select('id, organization_id, name, email');

  const orgActivityMap = new Map();
  activities?.forEach(a => {
    if (!orgActivityMap.has(a.organization_id)) {
      orgActivityMap.set(a.organization_id, a);
    }
  });

  // Ottieni abbonamenti esistenti
  const { data: existingSubs } = await supabase
    .from('subscriptions')
    .select('id, activity_id, service_id');

  const existingSubsSet = new Set(
    existingSubs?.map(s => `${s.activity_id}-${s.service_id}`) || []
  );

  let created = 0;
  let skipped = 0;
  let errors = 0;
  let noLicense = 0;

  for (const user of users) {
    const email = user.email?.toLowerCase().trim();
    if (!email) continue;

    // Verifica se ha licenza attiva
    const hasLicense = user.license_id && user.license_active === '1';

    if (!hasLicense) {
      noLicense++;
      continue;
    }

    // Trova utente Supabase
    const supabaseUser = supabaseUsers.get(email);
    if (!supabaseUser) {
      console.log(`⚠️  Utente non trovato: ${email}`);
      errors++;
      continue;
    }

    // Trova organizzazione
    const orgId = userOrgMap.get(supabaseUser.id);
    if (!orgId) {
      console.log(`⚠️  Org non trovata per: ${email}`);
      errors++;
      continue;
    }

    // Trova attività
    const activity = orgActivityMap.get(orgId);
    if (!activity) {
      console.log(`⚠️  Attività non trovata per org: ${orgId}`);
      errors++;
      continue;
    }

    // Verifica se abbonamento esiste già
    const subKey = `${activity.id}-${SMART_REVIEW_SERVICE_ID}`;
    if (existingSubsSet.has(subKey)) {
      console.log(`ℹ️  Abbonamento esistente: ${email}`);
      skipped++;
      continue;
    }

    // Calcola date abbonamento
    const licenseExpiration = parseInt(user.license_expiration) || 0;
    const now = new Date();
    const expiresAt = licenseExpiration > 0
      ? new Date(licenseExpiration * 1000)
      : new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    const isExpired = expiresAt < now;
    const status = isExpired ? 'expired' : 'active';

    if (DRY_RUN) {
      console.log(`[DRY-RUN] Creerebbe abbonamento per ${email} (${status}, exp: ${expiresAt.toISOString().split('T')[0]})`);
      created++;
      continue;
    }

    // Crea abbonamento
    const { error } = await supabase.from('subscriptions').insert({
      activity_id: activity.id,
      organization_id: orgId,
      service_id: SMART_REVIEW_SERVICE_ID,
      plan_id: SMART_REVIEW_PRO_PLAN_ID,
      status: status,
      billing_cycle: 'yearly',
      current_period_start: now.toISOString(),
      current_period_end: expiresAt.toISOString(),
      inherited_from_org: false
    });

    if (error) {
      console.log(`❌ Errore per ${email}: ${error.message}`);
      errors++;
    } else {
      console.log(`✅ Abbonamento creato: ${email} (${status})`);
      created++;
      existingSubsSet.add(subKey);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('  REPORT');
  console.log('='.repeat(50));
  console.log(`\n✅ Creati:     ${created}`);
  console.log(`ℹ️  Esistenti:  ${skipped}`);
  console.log(`⚠️  Senza lic:  ${noLicense}`);
  console.log(`❌ Errori:     ${errors}`);
  console.log(`📊 Totale:     ${users.length}\n`);
}

main().catch(console.error);
