/**
 * ============================================
 * MIGRAZIONE COMPLETA UTENTI SMART REVIEW -> SUPABASE
 * ============================================
 *
 * Questo script:
 * 1. Legge utenti dal CSV esportato da MySQL
 * 2. Crea/aggiorna utenti in Supabase Auth
 * 3. Crea organizzazioni per ogni utente
 * 4. Crea attività per ogni organizzazione
 * 5. Importa le licenze come abbonamenti
 *
 * Esegui con: node scripts/migrate-users-full.js
 *
 * Opzioni:
 *   --dry-run    Simula senza modificare (default: false)
 *   --skip-existing  Salta utenti già esistenti (default: true)
 *   --reset-password Forza reset password per tutti (default: false)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Setup
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

// Configurazione
const CONFIG = {
  TEMP_PASSWORD: 'SmartReview2024!Migrate',
  DRY_RUN: process.argv.includes('--dry-run'),
  SKIP_EXISTING: !process.argv.includes('--no-skip-existing'),
  RESET_PASSWORD: process.argv.includes('--reset-password'),
  CSV_PATH: join(__dirname, '../../database/users-smart.csv'),
  MAPPING_PATH: join(__dirname, '../../database/user-id-mapping.json'),
  LOG_PATH: join(__dirname, '../../database/migration-log.json')
};

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Mancano SUPABASE_URL o SUPABASE_SERVICE_KEY nel file .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Utilities
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = { info: 'ℹ️ ', success: '✅', warning: '⚠️ ', error: '❌' }[level] || '  ';
  console.log(`${prefix} ${message}`);
  if (data && CONFIG.DRY_RUN) {
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
}

// Leggi CSV
function readUsersFromCSV() {
  if (!existsSync(CONFIG.CSV_PATH)) {
    console.error(`❌ File CSV non trovato: ${CONFIG.CSV_PATH}`);
    console.error('   Esegui prima export-users-mysql.sql e salva il risultato come users-smart.csv');
    process.exit(1);
  }

  const csvContent = readFileSync(CONFIG.CSV_PATH, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });

  return records.filter(r => r.email && r.email.trim() !== '');
}

// Ottieni utenti esistenti da Supabase (con supporto paginazione)
async function getExistingUsers() {
  let allUsers = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: perPage
    });
    if (error) throw error;
    if (!data.users || data.users.length === 0) break;
    allUsers = allUsers.concat(data.users);
    if (data.users.length < perPage) break;
    page++;
  }

  // Mappa con email lowercase per gestire case-insensitivity
  return new Map(allUsers.map(u => [u.email.toLowerCase(), u]));
}

// Crea utente in Supabase Auth
async function createOrUpdateUser(user, existingUsers) {
  const email = user.email.toLowerCase().trim();
  const fullName = `${user.name || ''} ${user.surname || ''}`.trim();

  // Salta utenti di test
  if (email === 'test@test.it') {
    return { status: 'skipped', reason: 'test_user', email };
  }

  const existing = existingUsers.get(email);

  if (existing) {
    if (CONFIG.SKIP_EXISTING && !CONFIG.RESET_PASSWORD) {
      log('info', `Esiste già: ${email}`);
      return {
        status: 'exists',
        email,
        supabaseId: existing.id,
        smartId: user.id
      };
    }

    // Aggiorna utente esistente
    if (CONFIG.DRY_RUN) {
      log('info', `[DRY-RUN] Aggiornerebbe: ${email}`);
      return { status: 'would_update', email, smartId: user.id };
    }

    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: CONFIG.RESET_PASSWORD ? CONFIG.TEMP_PASSWORD : undefined,
      user_metadata: {
        ...existing.user_metadata,
        full_name: fullName || existing.user_metadata?.full_name,
        smart_review_id: user.id,
        updated_at: new Date().toISOString()
      }
    });

    if (error) {
      log('error', `Errore aggiornamento ${email}: ${error.message}`);
      return { status: 'error', email, error: error.message };
    }

    log('success', `Aggiornato: ${email}`);
    return { status: 'updated', email, supabaseId: existing.id, smartId: user.id };
  }

  // Crea nuovo utente
  if (CONFIG.DRY_RUN) {
    log('info', `[DRY-RUN] Creerebbe: ${email}`);
    return { status: 'would_create', email, smartId: user.id, fullName };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: CONFIG.TEMP_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: fullName || null,
      smart_review_id: user.id,
      migrated_from: 'smart_review',
      migrated_at: new Date().toISOString(),
      is_admin: user.is_admin === '1' || user.is_admin === 1
    }
  });

  if (error) {
    // Se l'utente esiste già, recupera l'ID e trattalo come esistente
    if (error.message.includes('already been registered')) {
      const { data: allUsers } = await supabase.auth.admin.listUsers();
      const existingUser = allUsers?.users?.find(u => u.email.toLowerCase() === email);
      if (existingUser) {
        log('info', `Già registrato: ${email}`);
        return {
          status: 'exists',
          email,
          supabaseId: existingUser.id,
          smartId: user.id
        };
      }
    }
    log('error', `Errore creazione ${email}: ${error.message}`);
    return { status: 'error', email, error: error.message, smartId: user.id };
  }

  log('success', `Creato: ${email} -> ${data.user.id}`);
  return {
    status: 'created',
    email,
    supabaseId: data.user.id,
    smartId: user.id,
    fullName
  };
}

// Crea organizzazione per utente
async function createOrganization(userResult, csvUser) {
  if (!userResult.supabaseId) return null;

  const orgName = `${csvUser.name || ''} ${csvUser.surname || ''}`.trim() ||
                  userResult.email.split('@')[0];

  const slug = generateSlug(orgName) + '-' + userResult.supabaseId.substring(0, 8);

  // Verifica se esiste già
  const { data: existing } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    return { id: existing.id, name: orgName, slug, status: 'exists' };
  }

  if (CONFIG.DRY_RUN) {
    log('info', `[DRY-RUN] Creerebbe org: ${orgName}`);
    return { name: orgName, slug, status: 'would_create' };
  }

  const { data: org, error } = await supabase
    .from('organizations')
    .insert({
      name: orgName,
      slug: slug,
      status: 'active',
      account_type: 'single',
      max_activities: 1
    })
    .select()
    .single();

  if (error) {
    log('error', `Errore creazione org per ${userResult.email}: ${error.message}`);
    return null;
  }

  // Collega utente come owner
  await supabase.from('organization_users').insert({
    organization_id: org.id,
    user_id: userResult.supabaseId,
    role: 'owner'
  });

  log('success', `Org creata: ${orgName} (${org.id})`);
  return { id: org.id, name: orgName, slug, status: 'created' };
}

// Crea attività per organizzazione
async function createActivity(org, userResult, csvUser) {
  if (!org?.id) return null;

  const activityName = `${csvUser.name || ''} ${csvUser.surname || ''}`.trim() ||
                       'Attività principale';
  const activitySlug = generateSlug(activityName) + '-' + org.id.substring(0, 8);

  // Verifica se esiste già
  const { data: existing } = await supabase
    .from('activities')
    .select('id')
    .eq('organization_id', org.id)
    .single();

  if (existing) {
    return { id: existing.id, name: activityName, status: 'exists' };
  }

  if (CONFIG.DRY_RUN) {
    log('info', `[DRY-RUN] Creerebbe attività: ${activityName}`);
    return { name: activityName, status: 'would_create' };
  }

  const { data: activity, error } = await supabase
    .from('activities')
    .insert({
      organization_id: org.id,
      name: activityName,
      slug: activitySlug,
      email: csvUser.email
    })
    .select()
    .single();

  if (error) {
    log('error', `Errore creazione attività: ${error.message}`);
    return null;
  }

  // Collega utente come owner dell'attività
  await supabase.from('activity_users').insert({
    activity_id: activity.id,
    user_id: userResult.supabaseId,
    role: 'owner'
  });

  log('success', `Attività creata: ${activityName} (${activity.id})`);
  return { id: activity.id, name: activityName, status: 'created' };
}

// Crea abbonamento da licenza
async function createSubscription(activity, csvUser) {
  if (!activity?.id) return null;

  // Se non c'è licenza attiva, non creare abbonamento
  if (!csvUser.license_id || csvUser.license_active !== '1') {
    return null;
  }

  // Verifica se esiste già
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('activity_id', activity.id)
    .eq('service_code', 'smart_review')
    .single();

  if (existing) {
    return { id: existing.id, status: 'exists' };
  }

  if (CONFIG.DRY_RUN) {
    log('info', `[DRY-RUN] Creerebbe abbonamento Smart Review`);
    return { status: 'would_create' };
  }

  // Determina date abbonamento
  const now = new Date();
  const expirationTimestamp = parseInt(csvUser.license_expiration) || 0;
  const expiresAt = expirationTimestamp > 0
    ? new Date(expirationTimestamp * 1000)
    : new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  const isExpired = expiresAt < now;

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .insert({
      activity_id: activity.id,
      service_code: 'smart_review',
      plan_code: 'pro', // Default a pro per utenti migrati
      status: isExpired ? 'expired' : 'active',
      billing_cycle: 'yearly',
      current_period_start: now.toISOString(),
      current_period_end: expiresAt.toISOString(),
      features: {
        migrated_from: 'smart_review',
        original_license_id: csvUser.license_id,
        migrated_at: new Date().toISOString()
      }
    })
    .select()
    .single();

  if (error) {
    log('error', `Errore creazione abbonamento: ${error.message}`);
    return null;
  }

  log('success', `Abbonamento creato: ${subscription.id} (${isExpired ? 'expired' : 'active'})`);
  return { id: subscription.id, status: 'created', isExpired };
}

// Main
async function main() {
  console.log('\n' + '='.repeat(50));
  console.log('  MIGRAZIONE COMPLETA SMART REVIEW -> SUPABASE');
  console.log('='.repeat(50));

  if (CONFIG.DRY_RUN) {
    console.log('\n🔍 MODALITÀ DRY-RUN - Nessuna modifica verrà effettuata\n');
  }

  // Leggi utenti
  const csvUsers = readUsersFromCSV();
  console.log(`\n📋 Trovati ${csvUsers.length} utenti nel CSV\n`);

  // Ottieni utenti esistenti
  const existingUsers = await getExistingUsers();
  console.log(`📊 Utenti già in Supabase: ${existingUsers.size}\n`);

  // Risultati
  const results = {
    users: { created: 0, updated: 0, exists: 0, errors: 0 },
    organizations: { created: 0, exists: 0, errors: 0 },
    activities: { created: 0, exists: 0, errors: 0 },
    subscriptions: { created: 0, exists: 0, errors: 0 },
    mapping: [],
    errors: []
  };

  // Processa ogni utente
  for (let i = 0; i < csvUsers.length; i++) {
    const csvUser = csvUsers[i];
    console.log(`\n[${i + 1}/${csvUsers.length}] Processando: ${csvUser.email}`);

    try {
      // 1. Crea/aggiorna utente
      const userResult = await createOrUpdateUser(csvUser, existingUsers);
      results.users[userResult.status === 'created' ? 'created' :
                    userResult.status === 'updated' ? 'updated' :
                    userResult.status === 'exists' ? 'exists' : 'errors']++;

      if (userResult.status === 'error' || userResult.status === 'skipped') {
        if (userResult.status === 'error') {
          results.errors.push({ email: csvUser.email, step: 'user', error: userResult.error });
        }
        continue;
      }

      // Aggiorna existingUsers se nuovo utente creato
      if (userResult.status === 'created' && userResult.supabaseId) {
        existingUsers.set(csvUser.email.toLowerCase(), {
          id: userResult.supabaseId,
          email: csvUser.email
        });
      }

      // 2. Crea organizzazione
      const org = await createOrganization(userResult, csvUser);
      if (org) {
        results.organizations[org.status === 'created' ? 'created' :
                              org.status === 'exists' ? 'exists' : 'errors']++;
      }

      // 3. Crea attività
      const activity = await createActivity(org, userResult, csvUser);
      if (activity) {
        results.activities[activity.status === 'created' ? 'created' :
                           activity.status === 'exists' ? 'exists' : 'errors']++;
      }

      // 4. Crea abbonamento (se licenza presente)
      const subscription = await createSubscription(activity, csvUser);
      if (subscription) {
        results.subscriptions[subscription.status === 'created' ? 'created' :
                              subscription.status === 'exists' ? 'exists' : 'errors']++;
      }

      // Salva mapping
      results.mapping.push({
        email: csvUser.email,
        smart_review_id: csvUser.id,
        supabase_id: userResult.supabaseId,
        organization_id: org?.id,
        activity_id: activity?.id,
        subscription_id: subscription?.id
      });

    } catch (err) {
      log('error', `Eccezione per ${csvUser.email}: ${err.message}`);
      results.errors.push({ email: csvUser.email, step: 'unknown', error: err.message });
    }

    // Pausa per non sovraccaricare API
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  // Report finale
  console.log('\n' + '='.repeat(50));
  console.log('  REPORT MIGRAZIONE');
  console.log('='.repeat(50));

  console.log('\n📊 UTENTI:');
  console.log(`   ✅ Creati:    ${results.users.created}`);
  console.log(`   🔄 Aggiornati: ${results.users.updated}`);
  console.log(`   ℹ️  Esistenti: ${results.users.exists}`);
  console.log(`   ❌ Errori:    ${results.users.errors}`);

  console.log('\n🏢 ORGANIZZAZIONI:');
  console.log(`   ✅ Create:    ${results.organizations.created}`);
  console.log(`   ℹ️  Esistenti: ${results.organizations.exists}`);

  console.log('\n📍 ATTIVITÀ:');
  console.log(`   ✅ Create:    ${results.activities.created}`);
  console.log(`   ℹ️  Esistenti: ${results.activities.exists}`);

  console.log('\n💳 ABBONAMENTI:');
  console.log(`   ✅ Creati:    ${results.subscriptions.created}`);
  console.log(`   ℹ️  Esistenti: ${results.subscriptions.exists}`);

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORI:');
    results.errors.forEach(e => console.log(`   - ${e.email}: ${e.error}`));
  }

  // Salva file di output
  if (!CONFIG.DRY_RUN && results.mapping.length > 0) {
    writeFileSync(CONFIG.MAPPING_PATH, JSON.stringify(results.mapping, null, 2));
    console.log(`\n💾 Mapping salvato: ${CONFIG.MAPPING_PATH}`);

    writeFileSync(CONFIG.LOG_PATH, JSON.stringify(results, null, 2));
    console.log(`📝 Log salvato: ${CONFIG.LOG_PATH}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('  MIGRAZIONE COMPLETATA');
  console.log('='.repeat(50));

  console.log('\n⚠️  NOTA: Gli utenti migrati devono usare "Password dimenticata"');
  console.log('   oppure la password temporanea: ' + CONFIG.TEMP_PASSWORD);
  console.log('');
}

// Esegui
main().catch(err => {
  console.error('❌ Errore fatale:', err);
  process.exit(1);
});
