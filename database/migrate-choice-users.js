/**
 * Script di migrazione utenti da Choice (Menu Digitale) a DOID Suite
 *
 * Questo script:
 * 1. Legge gli utenti dal CSV esportato da Choice
 * 2. Crea gli utenti in Supabase Auth
 * 3. Crea le activities corrispondenti
 * 4. Collega utenti e activities
 * 5. Crea le subscriptions per menu_digitale
 *
 * PREREQUISITI:
 * - Node.js 18+
 * - npm install @supabase/supabase-js csv-parse
 *
 * CONFIGURAZIONE:
 * Impostare le variabili SUPABASE_URL e SUPABASE_SERVICE_KEY
 *
 * ESECUZIONE:
 * node migrate-choice-users.js
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURAZIONE - MODIFICA QUESTI VALORI
// ============================================
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-role-key';

// Password temporanea per gli utenti migrati (dovranno resettarla)
const DEFAULT_PASSWORD = 'ChangeMe2024!';

// ============================================
// INIZIALIZZAZIONE
// ============================================
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// ============================================
// FUNZIONI HELPER
// ============================================

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// MIGRAZIONE
// ============================================

async function migrate() {
    console.log('='.repeat(60));
    console.log('MIGRAZIONE UTENTI CHOICE -> DOID SUITE');
    console.log('='.repeat(60));

    // Verifica configurazione
    if (SUPABASE_URL.includes('your-project') || SUPABASE_SERVICE_KEY.includes('your-service')) {
        console.error('\n❌ ERRORE: Configura SUPABASE_URL e SUPABASE_SERVICE_KEY!');
        console.log('\nOpzioni:');
        console.log('1. Modifica le variabili in questo script');
        console.log('2. Usa variabili d\'ambiente:');
        console.log('   SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=yyy node migrate-choice-users.js');
        process.exit(1);
    }

    // Leggi CSV
    const csvPath = path.join(__dirname, 'menu.csv');
    if (!fs.existsSync(csvPath)) {
        console.error(`\n❌ ERRORE: File ${csvPath} non trovato!`);
        process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true
    });

    console.log(`\n📄 Trovati ${records.length} record nel CSV`);

    // Raggruppa per idUtente (attività)
    const activitiesMap = new Map();
    const usersToCreate = [];

    for (const record of records) {
        const idUtente = record.idUtente;

        if (!activitiesMap.has(idUtente)) {
            activitiesMap.set(idUtente, {
                idUtente,
                name: record.nomeLocale || 'Attività senza nome',
                email: record.indEmail || null,
                phone: record.nTelfono || null,
                address: record.via || null,
                city: record.citta?.trim() || null,
                vat_number: record.ragSociale || null,
                users: []
            });
        }

        activitiesMap.get(idUtente).users.push({
            email: record.userID,
            role: record.type === 'Admin' ? 'owner' : 'user'
        });

        // Aggiungi utente se non già presente
        if (!usersToCreate.find(u => u.email === record.userID)) {
            usersToCreate.push({
                email: record.userID,
                idUtente
            });
        }
    }

    console.log(`\n🏢 Attività da creare: ${activitiesMap.size}`);
    console.log(`👤 Utenti da creare: ${usersToCreate.length}`);

    // Ottieni service_id per menu_digitale
    const { data: menuService, error: serviceError } = await supabase
        .from('services')
        .select('id')
        .eq('code', 'menu_digitale')
        .single();

    if (serviceError || !menuService) {
        console.error('\n❌ ERRORE: Servizio menu_digitale non trovato!');
        console.log('Esegui prima migrations_activities.sql in Supabase');
        process.exit(1);
    }

    // Ottieni plan_id per piano free di menu_digitale
    const { data: freePlan, error: planError } = await supabase
        .from('plans')
        .select('id')
        .eq('service_id', menuService.id)
        .eq('code', 'free')
        .single();

    if (planError || !freePlan) {
        console.error('\n❌ ERRORE: Piano free per menu_digitale non trovato!');
        process.exit(1);
    }

    console.log(`\n✅ Servizio menu_digitale: ${menuService.id}`);
    console.log(`✅ Piano free: ${freePlan.id}`);

    // Mappa per tracciare utenti creati (email -> UUID)
    const userIdMap = new Map();
    // Mappa per tracciare attività create (idUtente -> UUID)
    const activityIdMap = new Map();

    // ============================================
    // STEP 1: Crea utenti in Supabase Auth
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('STEP 1: Creazione utenti in Supabase Auth');
    console.log('='.repeat(60));

    for (const user of usersToCreate) {
        console.log(`\n👤 Creando utente: ${user.email}`);

        try {
            // Verifica se utente esiste già
            const { data: existingUsers } = await supabase.auth.admin.listUsers();
            const existing = existingUsers?.users?.find(u => u.email === user.email);

            if (existing) {
                console.log(`   ⚠️  Utente già esistente: ${existing.id}`);
                userIdMap.set(user.email, existing.id);
                continue;
            }

            // Crea nuovo utente
            const { data: newUser, error } = await supabase.auth.admin.createUser({
                email: user.email,
                password: DEFAULT_PASSWORD,
                email_confirm: true, // Conferma email automaticamente
                user_metadata: {
                    migrated_from: 'choice',
                    original_idUtente: user.idUtente,
                    migrated_at: new Date().toISOString()
                }
            });

            if (error) {
                console.log(`   ❌ Errore: ${error.message}`);
                continue;
            }

            console.log(`   ✅ Creato: ${newUser.user.id}`);
            userIdMap.set(user.email, newUser.user.id);

            // Rate limiting - evita troppe richieste
            await delay(200);

        } catch (err) {
            console.log(`   ❌ Eccezione: ${err.message}`);
        }
    }

    // ============================================
    // STEP 2: Crea attività
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: Creazione attività');
    console.log('='.repeat(60));

    for (const [idUtente, activity] of activitiesMap) {
        const slug = slugify(activity.name) || `attivita-${idUtente}`;
        console.log(`\n🏢 Creando attività: ${activity.name} (${slug})`);

        try {
            // Verifica se esiste già
            const { data: existing } = await supabase
                .from('activities')
                .select('id')
                .eq('slug', slug)
                .single();

            if (existing) {
                console.log(`   ⚠️  Attività già esistente: ${existing.id}`);
                activityIdMap.set(idUtente, existing.id);
                continue;
            }

            // Crea attività
            const { data: newActivity, error } = await supabase
                .from('activities')
                .insert({
                    name: activity.name,
                    slug: slug,
                    email: activity.email,
                    phone: activity.phone,
                    address: activity.address,
                    city: activity.city,
                    vat_number: activity.vat_number,
                    status: 'active'
                })
                .select()
                .single();

            if (error) {
                // Se slug duplicato, prova con suffisso
                if (error.code === '23505') {
                    const newSlug = `${slug}-${idUtente}`;
                    const { data: retryActivity, error: retryError } = await supabase
                        .from('activities')
                        .insert({
                            name: activity.name,
                            slug: newSlug,
                            email: activity.email,
                            phone: activity.phone,
                            address: activity.address,
                            city: activity.city,
                            vat_number: activity.vat_number,
                            status: 'active'
                        })
                        .select()
                        .single();

                    if (retryError) {
                        console.log(`   ❌ Errore: ${retryError.message}`);
                        continue;
                    }
                    console.log(`   ✅ Creata con slug alternativo: ${retryActivity.id}`);
                    activityIdMap.set(idUtente, retryActivity.id);
                } else {
                    console.log(`   ❌ Errore: ${error.message}`);
                }
                continue;
            }

            console.log(`   ✅ Creata: ${newActivity.id}`);
            activityIdMap.set(idUtente, newActivity.id);

        } catch (err) {
            console.log(`   ❌ Eccezione: ${err.message}`);
        }
    }

    // ============================================
    // STEP 3: Collega utenti alle attività
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('STEP 3: Collegamento utenti-attività');
    console.log('='.repeat(60));

    for (const [idUtente, activity] of activitiesMap) {
        const activityId = activityIdMap.get(idUtente);
        if (!activityId) {
            console.log(`\n⚠️  Attività ${idUtente} non trovata, skip`);
            continue;
        }

        for (const user of activity.users) {
            const userId = userIdMap.get(user.email);
            if (!userId) {
                console.log(`\n⚠️  Utente ${user.email} non trovato, skip`);
                continue;
            }

            console.log(`\n🔗 Collegando ${user.email} -> ${activity.name} (${user.role})`);

            try {
                const { error } = await supabase
                    .from('activity_users')
                    .upsert({
                        activity_id: activityId,
                        user_id: userId,
                        role: user.role
                    }, {
                        onConflict: 'activity_id,user_id'
                    });

                if (error) {
                    console.log(`   ❌ Errore: ${error.message}`);
                } else {
                    console.log(`   ✅ Collegato`);
                }
            } catch (err) {
                console.log(`   ❌ Eccezione: ${err.message}`);
            }
        }
    }

    // ============================================
    // STEP 4: Crea subscriptions per menu_digitale
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('STEP 4: Creazione subscriptions menu_digitale');
    console.log('='.repeat(60));

    for (const [idUtente, activityId] of activityIdMap) {
        console.log(`\n📋 Creando subscription per attività ${idUtente}`);

        try {
            const { error } = await supabase
                .from('subscriptions')
                .upsert({
                    activity_id: activityId,
                    service_id: menuService.id,
                    plan_id: freePlan.id,
                    status: 'active',
                    billing_cycle: 'monthly'
                }, {
                    onConflict: 'activity_id,service_id'
                });

            if (error) {
                console.log(`   ❌ Errore: ${error.message}`);
            } else {
                console.log(`   ✅ Subscription creata`);
            }
        } catch (err) {
            console.log(`   ❌ Eccezione: ${err.message}`);
        }
    }

    // ============================================
    // RIEPILOGO
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('RIEPILOGO MIGRAZIONE');
    console.log('='.repeat(60));
    console.log(`\n✅ Utenti creati/trovati: ${userIdMap.size}`);
    console.log(`✅ Attività create/trovate: ${activityIdMap.size}`);
    console.log(`\n⚠️  Password temporanea per tutti gli utenti: ${DEFAULT_PASSWORD}`);
    console.log('   Gli utenti dovranno resettare la password al primo accesso.');

    // Salva mapping per riferimento
    const mappingFile = path.join(__dirname, 'migration-mapping.json');
    const mapping = {
        migratedAt: new Date().toISOString(),
        users: Object.fromEntries(userIdMap),
        activities: Object.fromEntries(activityIdMap)
    };
    fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
    console.log(`\n📄 Mapping salvato in: ${mappingFile}`);

    console.log('\n' + '='.repeat(60));
    console.log('MIGRAZIONE COMPLETATA');
    console.log('='.repeat(60));
}

// Esegui
migrate().catch(err => {
    console.error('\n❌ ERRORE FATALE:', err);
    process.exit(1);
});
