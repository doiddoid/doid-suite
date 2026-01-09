/**
 * Sincronizza abbonamenti da Smart Review DB a DOID Suite
 *
 * Analizza il dump SQL e crea gli abbonamenti corretti per:
 * - Smart Review (utenti con review_settings attivo)
 * - Smart Page (utenti con vcards)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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

// IDs servizi e piani
const SERVICES = {
  SMART_REVIEW: '4a8966ab-b29e-4946-8847-b085afb8a4af',
  SMART_PAGE: '3e4748c9-fbb9-430b-946e-947d95041875'
};

const PLANS = {
  SMART_REVIEW_FREE: 'ac6331fa-de03-4274-adbd-e18185b2c512',
  SMART_REVIEW_PRO: '529a06b2-1ee5-4d1a-a268-3bdbd1ca2d78',
  SMART_PAGE_FREE: '714ecb30-8cee-421c-84fd-4ffba97c087e',
  SMART_PAGE_PRO: 'd0a130f4-bdf2-4a5e-b2d6-f349f64a54f1'
};

// Utente PRO per Smart Review
const PRO_REVIEW_USER = 'gelaterialeccalecca@libero.it';

const DRY_RUN = process.argv.includes('--dry-run');

// Analizza il dump SQL
function analyzeSQL(sqlPath) {
  const sql = readFileSync(sqlPath, 'utf8');

  // Estrai utenti attivi
  const users = new Map();
  const usersMatch = sql.match(/INSERT INTO `users`[\s\S]+?;/);
  if (usersMatch) {
    const regex = /\('([^']+)',\s*(NULL|'[^']*'),\s*(NULL|'[^']*'),\s*(NULL|'[^']*'),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',/g;
    let match;
    while ((match = regex.exec(usersMatch[0])) !== null) {
      const id = match[1];
      const email = match[5]?.toLowerCase().trim();
      const name = match[6];
      const surname = match[7];
      if (email) {
        users.set(id, { id, email, name, surname, hasReview: false, hasPage: false });
      }
    }
  }

  // Estrai review_settings (Smart Review) - is_active = 1
  const reviewMatch = sql.match(/INSERT INTO `review_settings`[\s\S]+?;/);
  if (reviewMatch) {
    const regex = /\('([^']+)',\s*'([^']+)',\s*1,/g;
    let match;
    while ((match = regex.exec(reviewMatch[0])) !== null) {
      const userId = match[2];
      if (users.has(userId)) {
        users.get(userId).hasReview = true;
      }
    }
  }

  // Estrai vcards (Smart Page)
  const vcardsMatch = sql.match(/INSERT INTO `vcards`[\s\S]+?;/);
  if (vcardsMatch) {
    const regex = /\('([^']+)',\s*\d+,\s*\d+,\s*'([^']+)'/g;
    let match;
    while ((match = regex.exec(vcardsMatch[0])) !== null) {
      const userId = match[2];
      if (users.has(userId)) {
        users.get(userId).hasPage = true;
      }
    }
  }

  return users;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  SINCRONIZZAZIONE ABBONAMENTI SMART REVIEW -> DOID SUITE');
  console.log('='.repeat(60));

  if (DRY_RUN) {
    console.log('\n🔍 MODALITÀ DRY-RUN\n');
  }

  // Analizza SQL
  const sqlPath = join(__dirname, '../../database/db7ecfykwhnspm.sql');
  const usersFromSQL = analyzeSQL(sqlPath);
  console.log(`📋 Utenti analizzati dal SQL: ${usersFromSQL.size}`);

  // Conta servizi
  let reviewCount = 0, pageCount = 0, bothCount = 0;
  usersFromSQL.forEach(u => {
    if (u.hasReview && u.hasPage) bothCount++;
    else if (u.hasReview) reviewCount++;
    else if (u.hasPage) pageCount++;
  });
  console.log(`   - Solo Review: ${reviewCount}`);
  console.log(`   - Solo Page: ${pageCount}`);
  console.log(`   - Entrambi: ${bothCount}`);

  // Ottieni utenti Supabase
  let allAuthUsers = [];
  let page = 1;
  while (true) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (!data?.users?.length) break;
    allAuthUsers = allAuthUsers.concat(data.users);
    if (data.users.length < 1000) break;
    page++;
  }
  const supabaseUsers = new Map(allAuthUsers.map(u => [u.email.toLowerCase(), u]));
  console.log(`\n👥 Utenti in Supabase: ${supabaseUsers.size}`);

  // Ottieni organizzazioni e attività
  const { data: orgUsers } = await supabase
    .from('organization_users')
    .select('user_id, organization_id');
  const userOrgMap = new Map(orgUsers?.map(ou => [ou.user_id, ou.organization_id]) || []);

  const { data: activities } = await supabase
    .from('activities')
    .select('id, organization_id, email');
  const orgActivityMap = new Map();
  const emailActivityMap = new Map();
  activities?.forEach(a => {
    if (!orgActivityMap.has(a.organization_id)) {
      orgActivityMap.set(a.organization_id, a);
    }
    if (a.email) {
      emailActivityMap.set(a.email.toLowerCase(), a);
    }
  });

  // Ottieni abbonamenti esistenti
  const { data: existingSubs } = await supabase
    .from('subscriptions')
    .select('id, activity_id, service_id');
  const existingSubsSet = new Set(
    existingSubs?.map(s => `${s.activity_id}-${s.service_id}`) || []
  );

  console.log(`\n📊 Abbonamenti esistenti: ${existingSubs?.length || 0}`);

  // Contatori
  let reviewCreated = 0, reviewSkipped = 0, reviewErrors = 0;
  let pageCreated = 0, pageSkipped = 0, pageErrors = 0;

  const now = new Date();
  const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  // Processa ogni utente dal SQL
  for (const [userId, user] of usersFromSQL) {
    if (!user.hasReview && !user.hasPage) continue;

    // Trova utente Supabase
    const supabaseUser = supabaseUsers.get(user.email);
    if (!supabaseUser) {
      // Utente non migrato, skip silenzioso
      continue;
    }

    // Trova organizzazione e attività
    const orgId = userOrgMap.get(supabaseUser.id);
    let activity = orgId ? orgActivityMap.get(orgId) : null;

    // Prova anche con email
    if (!activity) {
      activity = emailActivityMap.get(user.email);
    }

    if (!activity) {
      console.log(`⚠️  Nessuna attività per: ${user.email}`);
      if (user.hasReview) reviewErrors++;
      if (user.hasPage) pageErrors++;
      continue;
    }

    // Crea abbonamento Smart Review se necessario
    if (user.hasReview) {
      const subKey = `${activity.id}-${SERVICES.SMART_REVIEW}`;
      if (existingSubsSet.has(subKey)) {
        reviewSkipped++;
      } else {
        const isPro = user.email === PRO_REVIEW_USER;
        const planId = isPro ? PLANS.SMART_REVIEW_PRO : PLANS.SMART_REVIEW_FREE;

        if (DRY_RUN) {
          console.log(`[DRY-RUN] Review ${isPro ? 'PRO' : 'FREE'}: ${user.email}`);
          reviewCreated++;
        } else {
          const { error } = await supabase.from('subscriptions').insert({
            activity_id: activity.id,
            organization_id: orgId,
            service_id: SERVICES.SMART_REVIEW,
            plan_id: planId,
            status: 'active',
            billing_cycle: 'yearly',
            current_period_start: now.toISOString(),
            current_period_end: nextYear.toISOString(),
            inherited_from_org: false
          });

          if (error) {
            console.log(`❌ Review error ${user.email}: ${error.message}`);
            reviewErrors++;
          } else {
            console.log(`✅ Review ${isPro ? 'PRO' : 'FREE'}: ${user.email}`);
            reviewCreated++;
            existingSubsSet.add(subKey);
          }
        }
      }
    }

    // Crea abbonamento Smart Page se necessario
    if (user.hasPage) {
      const subKey = `${activity.id}-${SERVICES.SMART_PAGE}`;
      if (existingSubsSet.has(subKey)) {
        pageSkipped++;
      } else {
        if (DRY_RUN) {
          console.log(`[DRY-RUN] Page FREE: ${user.email}`);
          pageCreated++;
        } else {
          const { error } = await supabase.from('subscriptions').insert({
            activity_id: activity.id,
            organization_id: orgId,
            service_id: SERVICES.SMART_PAGE,
            plan_id: PLANS.SMART_PAGE_FREE,
            status: 'active',
            billing_cycle: 'yearly',
            current_period_start: now.toISOString(),
            current_period_end: nextYear.toISOString(),
            inherited_from_org: false
          });

          if (error) {
            console.log(`❌ Page error ${user.email}: ${error.message}`);
            pageErrors++;
          } else {
            console.log(`✅ Page FREE: ${user.email}`);
            pageCreated++;
            existingSubsSet.add(subKey);
          }
        }
      }
    }
  }

  // Report finale
  console.log('\n' + '='.repeat(60));
  console.log('  REPORT FINALE');
  console.log('='.repeat(60));

  console.log('\n📱 SMART REVIEW:');
  console.log(`   ✅ Creati:    ${reviewCreated}`);
  console.log(`   ℹ️  Esistenti: ${reviewSkipped}`);
  console.log(`   ❌ Errori:    ${reviewErrors}`);

  console.log('\n📄 SMART PAGE:');
  console.log(`   ✅ Creati:    ${pageCreated}`);
  console.log(`   ℹ️  Esistenti: ${pageSkipped}`);
  console.log(`   ❌ Errori:    ${pageErrors}`);

  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(console.error);
