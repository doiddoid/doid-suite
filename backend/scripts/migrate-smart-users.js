/**
 * Script per migrare utenti da Smart Review a Supabase Auth
 *
 * Esegui con: node migrate-smart-users.js
 *
 * Requisiti:
 * - File .env nella cartella backend con SUPABASE_URL e SUPABASE_SERVICE_KEY
 * - File users-smart.csv nella stessa cartella
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carica variabili ambiente dal backend
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Mancano SUPABASE_URL o SUPABASE_SERVICE_KEY nel file .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Password temporanea per utenti migrati (dovranno fare reset)
const TEMP_PASSWORD = 'SmartReview2024!Migrate';

// Leggi e parsa CSV
function readUsersFromCSV() {
  const csvPath = join(__dirname, '../../database/users-smart.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  return records;
}

// Genera un UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Migra un singolo utente
async function migrateUser(user, index, total) {
  const email = user.email?.toLowerCase().trim();
  const fullName = `${user.name || ''} ${user.surname || ''}`.trim();

  if (!email) {
    console.log(`⚠️  [${index}/${total}] Saltato: email mancante`);
    return { status: 'skipped', reason: 'no_email' };
  }

  // Salta utenti di test
  if (email === 'test@test.it') {
    console.log(`⚠️  [${index}/${total}] Saltato: ${email} (utente test)`);
    return { status: 'skipped', reason: 'test_user', email };
  }

  try {
    // Verifica se l'utente esiste già
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      console.log(`ℹ️  [${index}/${total}] Esiste già: ${email}`);
      return {
        status: 'exists',
        email,
        supabaseId: existingUser.id,
        smartId: user.id
      };
    }

    // Crea nuovo utente in Supabase Auth
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email: email,
      password: TEMP_PASSWORD,
      email_confirm: true, // Conferma email automaticamente
      user_metadata: {
        full_name: fullName || null,
        smart_review_id: user.id, // Mantieni riferimento all'ID originale
        migrated_from: 'smart_review',
        migrated_at: new Date().toISOString(),
        is_admin: user.is_admin === '1'
      }
    });

    if (error) {
      console.error(`❌ [${index}/${total}] Errore per ${email}: ${error.message}`);
      return { status: 'error', email, error: error.message, smartId: user.id };
    }

    console.log(`✅ [${index}/${total}] Migrato: ${email} -> ${newUser.user.id}`);
    return {
      status: 'created',
      email,
      supabaseId: newUser.user.id,
      smartId: user.id,
      fullName
    };

  } catch (err) {
    console.error(`❌ [${index}/${total}] Eccezione per ${email}: ${err.message}`);
    return { status: 'error', email, error: err.message, smartId: user.id };
  }
}

// Funzione principale
async function main() {
  console.log('\n========================================');
  console.log('  MIGRAZIONE UTENTI SMART REVIEW');
  console.log('========================================\n');

  // Leggi utenti dal CSV
  const users = readUsersFromCSV();
  console.log(`📋 Trovati ${users.length} utenti nel CSV\n`);

  const results = {
    created: [],
    exists: [],
    skipped: [],
    errors: []
  };

  // Migra ogni utente
  for (let i = 0; i < users.length; i++) {
    const result = await migrateUser(users[i], i + 1, users.length);

    switch (result.status) {
      case 'created':
        results.created.push(result);
        break;
      case 'exists':
        results.exists.push(result);
        break;
      case 'skipped':
        results.skipped.push(result);
        break;
      case 'error':
        results.errors.push(result);
        break;
    }

    // Piccola pausa per non sovraccaricare l'API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Report finale
  console.log('\n========================================');
  console.log('  REPORT MIGRAZIONE');
  console.log('========================================\n');

  console.log(`✅ Creati:    ${results.created.length}`);
  console.log(`ℹ️  Esistenti: ${results.exists.length}`);
  console.log(`⚠️  Saltati:   ${results.skipped.length}`);
  console.log(`❌ Errori:    ${results.errors.length}`);
  console.log(`📊 Totale:    ${users.length}\n`);

  if (results.errors.length > 0) {
    console.log('ERRORI:');
    results.errors.forEach(e => {
      console.log(`  - ${e.email}: ${e.error}`);
    });
    console.log('');
  }

  // Salva mapping ID per riferimento futuro
  const mapping = [...results.created, ...results.exists].map(r => ({
    smart_review_id: r.smartId,
    supabase_id: r.supabaseId,
    email: r.email
  }));

  if (mapping.length > 0) {
    const mappingPath = join(__dirname, '../../database/user-id-mapping.json');
    const { writeFileSync } = await import('fs');
    writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
    console.log(`💾 Mapping salvato in: ${mappingPath}\n`);
  }

  console.log('========================================');
  console.log('  MIGRAZIONE COMPLETATA');
  console.log('========================================\n');

  console.log('⚠️  NOTA: Gli utenti migrati devono fare "Reset Password"');
  console.log('   per impostare una nuova password.\n');
}

// Esegui
main().catch(console.error);
