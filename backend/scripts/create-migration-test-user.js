/**
 * Script per creare un utente di test per la migrazione
 * Uso: node create-migration-test-user.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica .env
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_KEY richieste');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMigrationUser() {
  const email = 'amazon@doid.biz';
  const password = 'SmartReview2024!Migrate';
  const fullName = 'Demo Migration';

  console.log('🚀 Creazione utente di test per migrazione...\n');

  // 1. Verifica se l'utente esiste già
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === email);

  let userId;

  if (existingUser) {
    console.log('⚠️  Utente già esistente:', existingUser.id);
    userId = existingUser.id;

    // Aggiorna la password
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password
    });
    if (updateError) {
      console.error('Errore aggiornamento password:', updateError.message);
    } else {
      console.log('✅ Password aggiornata');
    }
  } else {
    // Crea nuovo utente
    console.log('📝 Creando nuovo utente...');
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (userError) {
      console.error('❌ Errore creazione utente:', userError.message);
      return;
    }

    userId = userData.user.id;
    console.log('✅ Utente creato:', userId);
  }

  // 2. Verifica se esiste già un profilo
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existingProfile) {
    // Reset del profilo a pending
    console.log('📝 Reset profilo a pending...');
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        migration_status: 'pending',
        migrated_from: 'smart_review',
        password_changed: false,
        first_login_after_migration: null,
        password_changed_at: null
      })
      .eq('id', userId);

    if (updateProfileError) {
      console.error('❌ Errore reset profilo:', updateProfileError.message);
      return;
    }
    console.log('✅ Profilo resettato a pending');
  } else {
    // Crea nuovo profilo
    console.log('📝 Creando profilo migrazione...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        migration_status: 'pending',
        migrated_from: 'smart_review',
        password_changed: false
      });

    if (profileError) {
      console.error('❌ Errore creazione profilo:', profileError.message);
      return;
    }
    console.log('✅ Profilo creato');
  }

  console.log('\n========================================');
  console.log('✅ UTENTE DI TEST PRONTO');
  console.log('========================================');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('User ID:', userId);
  console.log('Migration Status: pending');
  console.log('Migrated From: smart_review');
  console.log('Password Changed: false');
  console.log('\n📌 Test:');
  console.log('1. Vai su https://suite.doid.it/login');
  console.log('2. Inserisci email e password');
  console.log('3. Verrai reindirizzato a /change-password');
  console.log('4. Cambia password');
  console.log('5. Verifica tag "migrazione-confermata" in GHL');
  console.log('========================================\n');
}

createMigrationUser().catch(console.error);
