/**
 * Export contatti per GoHighLevel (CSV)
 * Ogni attività = un contatto/cliente
 *
 * Uso: node scripts/export-ghl-contacts.js
 * Output: export-ghl-contacts.csv nella root del backend
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function escapeCSV(v) {
  if (!v) return '';
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

async function exportContacts() {
  console.log('Recupero dati da Supabase...');

  // 1. Tutte le attività
  const { data: activities } = await supabase
    .from('activities')
    .select('id, name, email, phone, organization_id, status');

  console.log(`Trovate ${activities.length} attività`);

  // 2. Organizations
  const orgIds = [...new Set(activities.map(a => a.organization_id).filter(Boolean))];
  const orgsMap = {};
  for (let i = 0; i < orgIds.length; i += 500) {
    const batch = orgIds.slice(i, i + 500);
    const { data } = await supabase
      .from('organizations')
      .select('id, name, account_type')
      .in('id', batch);
    for (const o of data || []) orgsMap[o.id] = o;
  }

  // 3. Utenti owner/admin per ogni attività (per nome/email/telefono di riferimento)
  const { data: activityUsers } = await supabase
    .from('activity_users')
    .select('activity_id, user_id, role');

  // Mappa activity_id -> user_ids (preferisci owner)
  const activityOwners = {};
  for (const au of activityUsers || []) {
    if (!activityOwners[au.activity_id]) activityOwners[au.activity_id] = [];
    activityOwners[au.activity_id].push(au);
  }

  // 4. Tutti gli utenti auth (per nome/email)
  const allUsers = [];
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    if (!users || users.length === 0) break;
    allUsers.push(...users);
    if (users.length < perPage) break;
    page++;
  }
  const usersMap = {};
  for (const u of allUsers) usersMap[u.id] = u;

  // 5. TUTTE le subscriptions
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select(`
      activity_id,
      status,
      plan:plans ( code ),
      service:services ( code )
    `);

  const activitySubs = {};
  for (const sub of subscriptions || []) {
    if (!sub.activity_id || !sub.service?.code) continue;
    if (!activitySubs[sub.activity_id]) activitySubs[sub.activity_id] = [];
    activitySubs[sub.activity_id].push({
      serviceCode: sub.service.code,
      planCode: sub.plan?.code || 'free',
      status: sub.status
    });
  }

  // 6. Activity service accounts (completo/da-completare)
  const { data: serviceAccounts } = await supabase
    .from('activity_service_accounts')
    .select('activity_id, service_code');

  const activityLinked = {};
  for (const sa of serviceAccounts || []) {
    if (!activityLinked[sa.activity_id]) activityLinked[sa.activity_id] = new Set();
    activityLinked[sa.activity_id].add(sa.service_code);
  }

  // 7. Menu restaurants
  const { data: menuRestaurants } = await supabase
    .from('menu_restaurants')
    .select('activity_id')
    .not('activity_id', 'is', null);

  const menuActivityIds = new Set((menuRestaurants || []).map(r => r.activity_id));

  // 8. Costruisci righe CSV — una per attività
  const rows = [];

  for (const act of activities) {
    // Trova l'owner/admin dell'attività per nome contatto
    const aus = activityOwners[act.id] || [];
    const ownerAu = aus.find(a => a.role === 'owner') || aus.find(a => a.role === 'admin') || aus[0];
    const owner = ownerAu ? usersMap[ownerAu.user_id] : null;

    const fullName = owner?.user_metadata?.full_name || '';
    const firstName = fullName.split(' ')[0] || '';
    const lastName = fullName.split(' ').slice(1).join(' ') || '';
    const email = act.email || owner?.email || '';
    const phone = act.phone || '';

    // Organizzazione che gestisce l'attività
    const org = act.organization_id ? orgsMap[act.organization_id] : null;
    const orgName = org?.name || '';
    const isAgency = org?.account_type === 'agency';

    // --- Tag ---
    const tags = ['old'];
    tags.push(isAgency ? 'agenzia' : 'singolo');

    // Servizi (anche scaduti)
    const activeStatuses = new Set(['active', 'trial', 'free']);
    const allServices = new Set();
    const servicesAttivi = new Set();
    const plansActive = new Set();

    const subs = activitySubs[act.id] || [];
    for (const sub of subs) {
      if (['review', 'page', 'menu'].includes(sub.serviceCode)) {
        allServices.add(sub.serviceCode);
        if (activeStatuses.has(sub.status)) {
          servicesAttivi.add(sub.serviceCode);
          plansActive.add(sub.planCode === 'pro' ? 'pro' : 'free');
        }
      }
    }

    // Completamento
    const linked = activityLinked[act.id] || new Set();
    const servicesCompleto = new Set();
    if (linked.has('review')) servicesCompleto.add('review');
    if (linked.has('page')) servicesCompleto.add('page');
    if (linked.has('menu') || menuActivityIds.has(act.id)) servicesCompleto.add('menu');

    for (const svc of allServices) tags.push(svc);
    for (const plan of plansActive) tags.push(plan);

    if (allServices.size > 0) {
      const hasScaduto = [...allServices].some(svc => !servicesAttivi.has(svc));
      if (hasScaduto) tags.push('scaduto');

      const tuttiCompleti = [...allServices].every(svc => servicesCompleto.has(svc));
      tags.push(tuttiCompleti ? 'completo' : 'da-completare');
    }

    rows.push({
      activityName: act.name || '',
      firstName,
      lastName,
      email,
      phone,
      orgName,
      tags: tags.join(', ')
    });
  }

  // 9. Ordina: agenzie in cima raggruppate per org, poi singoli
  rows.sort((a, b) => {
    if (a.orgName && !b.orgName) return -1;
    if (!a.orgName && b.orgName) return 1;
    if (a.orgName && b.orgName) {
      const cmp = a.orgName.localeCompare(b.orgName, 'it');
      if (cmp !== 0) return cmp;
    }
    return a.activityName.localeCompare(b.activityName, 'it');
  });

  // 10. Genera CSV
  const header = 'Activity,First Name,Last Name,Email,Phone,Organization,Tags';
  const csvRows = rows.map(r => [
    escapeCSV(r.activityName),
    escapeCSV(r.firstName),
    escapeCSV(r.lastName),
    escapeCSV(r.email),
    escapeCSV(r.phone),
    escapeCSV(r.orgName),
    escapeCSV(r.tags)
  ].join(','));

  const csv = [header, ...csvRows].join('\n');
  const outputPath = resolve(__dirname, '../export-ghl-contacts.csv');
  writeFileSync(outputPath, csv, 'utf-8');

  console.log(`\nCSV esportato: ${outputPath}`);
  console.log(`Totale clienti (attività): ${rows.length}`);

  const withService = rows.filter(r => r.tags.includes('review') || r.tags.includes('page') || r.tags.includes('menu'));
  const scaduti = rows.filter(r => r.tags.includes('scaduto'));
  const completi = rows.filter(r => r.tags.includes('completo'));
  const daCompletare = rows.filter(r => r.tags.includes('da-completare'));
  const agenzie = rows.filter(r => r.tags.includes('agenzia'));
  console.log(`Con servizi: ${withService.length}`);
  console.log(`Scaduti: ${scaduti.length}`);
  console.log(`Completi: ${completi.length}`);
  console.log(`Da completare: ${daCompletare.length}`);
  console.log(`Gestiti da agenzie: ${agenzie.length}`);
  console.log(`Singoli: ${rows.length - agenzie.length}`);
}

exportContacts().catch(err => {
  console.error('Errore:', err);
  process.exit(1);
});
