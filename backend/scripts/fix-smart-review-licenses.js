/**
 * Fix licenze Smart Review per utenti migrati da DOID Suite
 *
 * Problema: Gli utenti migrati hanno licenze disattive e senza plan_id
 * Soluzione: Attivare le licenze e assegnare il piano corretto
 *
 * gelaterialeccalecca@libero.it -> piano PROFESSIONAL
 * Altri utenti migrati -> piano FREE
 */

import mysql from 'mysql2/promise';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

// Configurazione database Smart Review produzione
const DB_CONFIG = {
  host: 'localhost',
  database: 'dbtpchahdn2f3k',
  user: 'ughvp8xgg6kgt',
  password: 'a4yneqfrcuoe'
};

// Utente PRO
const PRO_USER_EMAIL = 'gelaterialeccalecca@libero.it';
const PRO_USER_LICENSE_ID = '31745d75-1794-485b-a2c5-fcfdbe8de672';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  FIX LICENZE SMART REVIEW PER UTENTI MIGRATI');
  console.log('='.repeat(60));

  if (DRY_RUN) {
    console.log('\n🔍 MODALITÀ DRY-RUN\n');
  }

  // Connessione al database
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connesso al database Smart Review\n');
  } catch (error) {
    console.error('❌ Errore connessione database:', error.message);
    console.log('\nNota: Questo script deve essere eseguito dal server di produzione');
    console.log('o con un tunnel SSH al database MySQL.');
    process.exit(1);
  }

  try {
    // STEP 1: Trova i piani
    console.log('📋 Ricerca piani...');
    const [plans] = await connection.execute(
      'SELECT id, name, display_name FROM plans WHERE name IN (?, ?) AND is_active = 1',
      ['professional', 'free']
    );

    const proPlan = plans.find(p => p.name === 'professional');
    const freePlan = plans.find(p => p.name === 'free');

    if (!proPlan) {
      console.error('❌ Piano PROFESSIONAL non trovato! Eseguire prima migration-new-plans-2025.sql');
      process.exit(1);
    }
    if (!freePlan) {
      console.error('❌ Piano FREE non trovato! Eseguire prima migration-new-plans-2025.sql');
      process.exit(1);
    }

    console.log(`   - FREE: ${freePlan.id} (${freePlan.display_name})`);
    console.log(`   - PROFESSIONAL: ${proPlan.id} (${proPlan.display_name})`);

    // STEP 2: Trova utenti migrati con licenze problematiche
    console.log('\n📋 Ricerca utenti migrati con licenze da sistemare...');
    const [usersToFix] = await connection.execute(`
      SELECT
        u.id as user_id,
        u.email,
        u.license_id,
        u.doid_user_id,
        l.id as license_id_check,
        l.is_active as license_is_active,
        l.plan_id
      FROM users u
      LEFT JOIN licenses l ON u.license_id = l.id
      WHERE u.doid_user_id IS NOT NULL
      AND (l.is_active = 0 OR l.plan_id IS NULL)
      ORDER BY u.email
    `);

    console.log(`   Trovati ${usersToFix.length} utenti da sistemare\n`);

    if (usersToFix.length === 0) {
      console.log('✅ Tutti gli utenti migrati hanno già licenze attive con piano assegnato!');
      await connection.end();
      return;
    }

    // STEP 3: Fix licenze
    let proFixed = 0;
    let freeFixed = 0;
    let errors = 0;

    for (const user of usersToFix) {
      const isPro = user.email === PRO_USER_EMAIL;
      const planId = isPro ? proPlan.id : freePlan.id;
      const planName = isPro ? 'PROFESSIONAL' : 'FREE';

      if (DRY_RUN) {
        console.log(`[DRY-RUN] ${user.email}: assegna ${planName}`);
        if (isPro) proFixed++;
        else freeFixed++;
        continue;
      }

      try {
        await connection.execute(`
          UPDATE licenses
          SET is_active = 1,
              plan_id = ?,
              updated = UNIX_TIMESTAMP()
          WHERE id = ?
        `, [planId, user.license_id]);

        console.log(`✅ ${user.email}: ${planName}`);
        if (isPro) proFixed++;
        else freeFixed++;
      } catch (error) {
        console.log(`❌ ${user.email}: ${error.message}`);
        errors++;
      }
    }

    // STEP 4: Report
    console.log('\n' + '='.repeat(60));
    console.log('  REPORT FINALE');
    console.log('='.repeat(60));
    console.log(`\n✅ PROFESSIONAL: ${proFixed}`);
    console.log(`✅ FREE: ${freeFixed}`);
    console.log(`❌ Errori: ${errors}`);
    console.log('\n' + '='.repeat(60) + '\n');

    // STEP 5: Verifica
    if (!DRY_RUN) {
      console.log('📋 Verifica finale...\n');
      const [result] = await connection.execute(`
        SELECT
          u.email,
          l.is_active,
          p.name as plan_name,
          p.display_name as plan_display_name
        FROM users u
        JOIN licenses l ON u.license_id = l.id
        LEFT JOIN plans p ON l.plan_id = p.id
        WHERE u.doid_user_id IS NOT NULL
        ORDER BY u.email
        LIMIT 10
      `);

      console.log('Primi 10 utenti migrati:');
      result.forEach(r => {
        console.log(`  ${r.email}: ${r.plan_display_name || 'NO PIANO'} (active: ${r.is_active})`);
      });
    }

  } finally {
    await connection.end();
  }
}

main().catch(console.error);
