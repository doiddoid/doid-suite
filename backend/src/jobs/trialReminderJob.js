/**
 * Trial Reminder Job
 *
 * Job giornaliero che controlla i trial in scadenza e invia
 * webhook a GoHighLevel per i reminder automatici.
 *
 * Reminder schedule (basato su trial di 30 giorni):
 * - trial.day_7  : 23 giorni rimanenti (7 giorni dal trial)
 * - trial.day_14 : 16 giorni rimanenti (14 giorni dal trial)
 * - trial.day_21 : 9 giorni rimanenti (21 giorni dal trial)
 * - trial.day_27 : 3 giorni rimanenti (27 giorni dal trial)
 * - trial.expired: 0 giorni rimanenti (trial scaduto)
 */

import cron from 'node-cron';
import { supabaseAdmin } from '../config/supabase.js';
import webhookService from '../services/webhookService.js';

// Mapping: giorni rimanenti -> tipo evento
const REMINDER_MAP = {
  23: 'trial.day_7',    // 30-7=23 giorni rimanenti
  16: 'trial.day_14',   // 30-14=16 giorni rimanenti
  9: 'trial.day_21',    // 30-21=9 giorni rimanenti
  3: 'trial.day_27',    // 30-27=3 giorni rimanenti
  0: 'trial.expired'    // Trial scaduto
};

// Nome servizi leggibili
const SERVICE_NAMES = {
  'smart_review': 'Smart Review',
  'smart_page': 'Smart Page',
  'menu_digitale': 'Menu Digitale',
  'display_suite': 'Display Suite'
};

/**
 * Processa tutti i trial e invia i reminder appropriati
 */
export async function processTrialReminders() {
  console.log('[TRIAL-JOB] Avvio job trial reminders...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let processed = 0;
  let sent = 0;
  let expired = 0;
  let errors = 0;

  try {
    // Recupera tutti i trial attivi con i dati dell'activity e degli utenti
    const { data: trials, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        activity_id,
        service_id,
        trial_ends_at,
        status,
        activities (
          id,
          name,
          email,
          activity_users (
            user_id,
            role
          )
        ),
        services (
          code,
          name
        )
      `)
      .eq('status', 'trial')
      .not('trial_ends_at', 'is', null);

    if (error) {
      console.error('[TRIAL-JOB] Errore query subscriptions:', error);
      return { success: false, error: error.message };
    }

    if (!trials || trials.length === 0) {
      console.log('[TRIAL-JOB] Nessun trial attivo trovato');
      return { success: true, processed: 0, sent: 0, expired: 0 };
    }

    console.log(`[TRIAL-JOB] Trovati ${trials.length} trial attivi`);

    for (const trial of trials) {
      processed++;

      try {
        const trialEnd = new Date(trial.trial_ends_at);
        trialEnd.setHours(0, 0, 0, 0);

        const daysRemaining = Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24));

        // Trova l'owner dell'activity
        const ownerRelation = trial.activities?.activity_users?.find(u => u.role === 'owner');

        if (!ownerRelation) {
          console.log(`[TRIAL-JOB] No owner found for activity ${trial.activity_id}`);
          continue;
        }

        // Recupera i dati utente separatamente (auth.users)
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(ownerRelation.user_id);

        if (!userData?.user) {
          console.log(`[TRIAL-JOB] User not found: ${ownerRelation.user_id}`);
          continue;
        }

        const user = userData.user;
        const serviceCode = trial.services?.code || trial.service_id;

        const webhookData = {
          email: user.email,
          fullName: user.user_metadata?.full_name || 'Utente',
          firstName: user.user_metadata?.first_name,
          lastName: user.user_metadata?.last_name,
          activityId: trial.activity_id,
          activityName: trial.activities?.name || 'La mia attività',
          service: serviceCode,
          serviceName: SERVICE_NAMES[serviceCode] || trial.services?.name || serviceCode,
          trialEndDate: trial.trial_ends_at,
          daysRemaining: Math.max(0, daysRemaining)
        };

        // Determina quale reminder inviare
        const eventType = REMINDER_MAP[daysRemaining];

        if (eventType) {
          // Controlla se già inviato oggi
          const { data: alreadySent } = await supabaseAdmin
            .from('sent_reminders')
            .select('id')
            .eq('subscription_id', trial.id)
            .eq('reminder_type', eventType)
            .single();

          if (!alreadySent) {
            // Invia webhook
            console.log(`[TRIAL-JOB] Invio ${eventType} a ${user.email} (${daysRemaining} giorni rimanenti)`);

            const result = await webhookService.send(eventType, webhookData);

            if (result.success) {
              // Registra reminder inviato
              await supabaseAdmin.from('sent_reminders').insert({
                subscription_id: trial.id,
                reminder_type: eventType,
                user_id: user.id,
                details: {
                  email: user.email,
                  activity_name: webhookData.activityName,
                  days_remaining: daysRemaining
                }
              });

              sent++;
              console.log(`[TRIAL-JOB] ✓ ${eventType} inviato a ${user.email}`);
            } else {
              errors++;
              console.error(`[TRIAL-JOB] ✗ Errore invio ${eventType} a ${user.email}:`, result.error);
            }
          } else {
            console.log(`[TRIAL-JOB] Skip ${eventType} per ${user.email} (già inviato)`);
          }
        }

        // Se trial scaduto, aggiorna status
        if (daysRemaining <= 0 && trial.status === 'trial') {
          const { error: updateError } = await supabaseAdmin
            .from('subscriptions')
            .update({
              status: 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('id', trial.id);

          if (!updateError) {
            expired++;
            console.log(`[TRIAL-JOB] Trial ${trial.id} marcato come expired`);
          } else {
            console.error(`[TRIAL-JOB] Errore update trial ${trial.id}:`, updateError);
          }
        }

      } catch (trialError) {
        errors++;
        console.error(`[TRIAL-JOB] Errore processing trial ${trial.id}:`, trialError);
      }
    }

    console.log(`[TRIAL-JOB] Completato: ${processed} processati, ${sent} reminder inviati, ${expired} expired, ${errors} errori`);

    return {
      success: true,
      processed,
      sent,
      expired,
      errors
    };

  } catch (error) {
    console.error('[TRIAL-JOB] Errore fatale:', error);
    return {
      success: false,
      error: error.message,
      processed,
      sent,
      expired,
      errors
    };
  }
}

/**
 * Avvia lo scheduler cron
 * Esegue ogni giorno alle 9:00 ora italiana
 */
export function startTrialReminderScheduler() {
  // Verifica se siamo in production o se il job è esplicitamente abilitato
  const isEnabled = process.env.ENABLE_TRIAL_REMINDERS === 'true' || process.env.NODE_ENV === 'production';

  if (!isEnabled) {
    console.log('[TRIAL-JOB] Trial reminder scheduler disabilitato (set ENABLE_TRIAL_REMINDERS=true per abilitare)');
    return null;
  }

  // Cron: 0 9 * * * = ogni giorno alle 9:00
  const job = cron.schedule('0 9 * * *', async () => {
    console.log('[TRIAL-JOB] Esecuzione schedulata alle 9:00');
    await processTrialReminders();
  }, {
    timezone: 'Europe/Rome',
    scheduled: true
  });

  console.log('[TRIAL-JOB] ✓ Trial reminder scheduler avviato (ogni giorno alle 9:00 CET)');

  return job;
}

/**
 * Esegui manualmente il job (utile per testing)
 */
export async function runManually() {
  console.log('[TRIAL-JOB] Esecuzione manuale...');
  return await processTrialReminders();
}

export default {
  processTrialReminders,
  startTrialReminderScheduler,
  runManually
};
