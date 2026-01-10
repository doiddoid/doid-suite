/**
 * Webhook Service
 *
 * Gestisce l'invio di webhook a GoHighLevel per tutte le email transazionali.
 * Ogni tipo di evento ha un URL webhook dedicato configurabile via env.
 * Include retry automatico con exponential backoff e logging.
 */

import { supabaseAdmin } from '../config/supabase.js';

class WebhookService {
  constructor() {
    // Mapping eventi -> URL webhook GHL (ogni evento può avere URL diverso)
    this.webhookUrls = {
      // ===== ACCOUNT E REGISTRAZIONE =====
      // Quando l'utente si registra (richiede conferma email)
      'user.registered': process.env.GHL_WEBHOOK_USER_REGISTERED,
      // Quando l'utente conferma l'email
      'user.email_confirmed': process.env.GHL_WEBHOOK_USER_EMAIL_CONFIRMED,
      // Quando l'utente richiede nuovo link di verifica
      'user.resend_verification': process.env.GHL_WEBHOOK_USER_RESEND_VERIFICATION,
      // Dopo che org/activity sono state create (legacy)
      'user.verified': process.env.GHL_WEBHOOK_USER_VERIFIED,

      // ===== ATTIVAZIONE SERVIZI =====
      // Quando l'utente attiva un trial per un servizio specifico
      'service.trial_activated': process.env.GHL_WEBHOOK_SERVICE_TRIAL_ACTIVATED,

      // ===== ADMIN =====
      'admin.user_created': process.env.GHL_WEBHOOK_ADMIN_USER_CREATED,
      'admin.setup_complete': process.env.GHL_WEBHOOK_ADMIN_SETUP_COMPLETE,

      // ===== TRIAL REMINDERS =====
      // Tutti includono il servizio specifico nel payload
      'trial.started': process.env.GHL_WEBHOOK_TRIAL_STARTED,
      'trial.day_7': process.env.GHL_WEBHOOK_TRIAL_DAY_7,
      'trial.day_14': process.env.GHL_WEBHOOK_TRIAL_DAY_14,
      'trial.day_21': process.env.GHL_WEBHOOK_TRIAL_DAY_21,
      'trial.day_27': process.env.GHL_WEBHOOK_TRIAL_DAY_27,
      'trial.expiring': process.env.GHL_WEBHOOK_TRIAL_EXPIRING,
      'trial.expired': process.env.GHL_WEBHOOK_TRIAL_EXPIRED,

      // ===== ABBONAMENTI =====
      'subscription.created': process.env.GHL_WEBHOOK_SUBSCRIPTION_CREATED,
      'subscription.activated': process.env.GHL_WEBHOOK_SUBSCRIPTION_ACTIVATED,
      'subscription.renewed': process.env.GHL_WEBHOOK_SUBSCRIPTION_RENEWED,
      'subscription.cancelled': process.env.GHL_WEBHOOK_SUBSCRIPTION_CANCELLED,
      'subscription.expired': process.env.GHL_WEBHOOK_SUBSCRIPTION_EXPIRED,
      'payment.failed': process.env.GHL_WEBHOOK_PAYMENT_FAILED,

      // ===== PASSWORD =====
      'password.reset_requested': process.env.GHL_WEBHOOK_PASSWORD_RESET,

      // ===== MIGRAZIONE =====
      'migration.password_changed': process.env.GHL_WEBHOOK_MIGRATION_PASSWORD_CHANGED,

      // ===== NOTIFICHE ADMIN =====
      'admin.new_registration': process.env.GHL_WEBHOOK_ADMIN_NEW_REGISTRATION,

      // ===== AGENCY (opzionali) =====
      'organization.upgraded': process.env.GHL_WEBHOOK_ORG_UPGRADED,
      'activity.created': process.env.GHL_WEBHOOK_ACTIVITY_CREATED,
      'member.invited': process.env.GHL_WEBHOOK_MEMBER_INVITED,
      'member.joined': process.env.GHL_WEBHOOK_MEMBER_JOINED
    };

    // URL webhook per sincronizzazione licenze verso app DOID
    this.licenseSyncUrls = {
      'smart_review': process.env.DOID_WEBHOOK_SMART_REVIEW || 'https://review.doid.it/api/webhook/sync-license',
      'smart_page': process.env.DOID_WEBHOOK_SMART_PAGE || 'https://page.doid.it/api/webhook/sync-license',
      'menu_digitale': process.env.DOID_WEBHOOK_MENU_DIGITALE,
      'display_suite': process.env.DOID_WEBHOOK_DISPLAY_SUITE
    };

    // Secret per firmare i webhook verso le app DOID
    this.licenseSyncSecret = process.env.DOID_LICENSE_SYNC_SECRET || process.env.SSO_SECRET_KEY || '';

    // URL fallback generico (se l'evento specifico non ha URL dedicato)
    this.fallbackUrl = process.env.GHL_WEBHOOK_URL || null;

    // Custom webhook (opzionale)
    this.customWebhookUrl = process.env.CUSTOM_WEBHOOK_URL || null;

    // Configurazione
    this.timeout = parseInt(process.env.WEBHOOK_TIMEOUT || '10000', 10);
    this.maxRetries = parseInt(process.env.WEBHOOK_MAX_RETRIES || '3', 10);

    // Info supporto da includere nei payload
    this.supportInfo = {
      support_email: process.env.SUPPORT_EMAIL || 'info@doid.biz',
      support_whatsapp: process.env.SUPPORT_WHATSAPP || '+393480890477'
    };

    // Mapping servizio → label italiano
    this.serviceLabels = {
      'smart_review': 'Smart Review',
      'smart-review': 'Smart Review',
      'smart_page': 'Smart Page',
      'smart-page': 'Smart Page',
      'menu_digitale': 'Menu Digitale',
      'menu': 'Menu Digitale',
      'display_suite': 'Display Suite',
      'display': 'Display Suite',
      'accessi': 'Accessi'
    };

    // Mapping servizio → prezzo PRO mensile
    this.servicePrices = {
      'smart_review': '9.90',
      'smart-review': '9.90',
      'smart_page': '6.90',
      'smart-page': '6.90',
      'menu_digitale': '9.90',
      'menu': '9.90',
      'display_suite': '14.90',
      'display': '14.90',
      'accessi': '9.90'
    };

    // Mapping servizio → ha piano FREE?
    this.serviceHasFree = {
      'smart_review': true,
      'smart-review': true,
      'smart_page': true,
      'smart-page': true,
      'menu_digitale': false,
      'menu': false,
      'display_suite': false,
      'display': false,
      'accessi': false
    };
  }

  /**
   * Ottieni URL webhook per un evento specifico
   * Usa URL dedicato se configurato, altrimenti fallback
   */
  getWebhookUrl(event) {
    return this.webhookUrls[event] || this.fallbackUrl;
  }

  /**
   * Ottieni URL dashboard per un servizio
   */
  getDashboardUrl(service) {
    const urls = {
      'smart_review': 'https://review.doid.it',
      'smart-review': 'https://review.doid.it',
      'smart_page': 'https://page.doid.it',
      'smart-page': 'https://page.doid.it',
      'menu_digitale': 'https://menu.doid.it',
      'menu': 'https://menu.doid.it',
      'display_suite': 'https://display.doid.it',
      'display': 'https://display.doid.it'
    };
    return urls[service] || 'https://suite.doid.it';
  }

  /**
   * Sleep helper per retry
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log webhook nel database
   */
  async logWebhook(eventType, payload, status, details, targetUrl) {
    try {
      await supabaseAdmin.from('webhook_logs').insert({
        event_type: eventType,
        payload: payload,
        status: status,
        details: String(details).substring(0, 1000), // Limita lunghezza
        target_url: targetUrl,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      // Non bloccare se il log fallisce (tabella potrebbe non esistere)
      console.error('[WEBHOOK] Error logging webhook:', e.message);
    }
  }

  /**
   * Invia webhook con retry automatico
   * @param {string} event - Tipo di evento
   * @param {object} data - Dati da inviare
   * @param {object} options - Opzioni (retries, skipLog)
   */
  async send(event, data, options = {}) {
    const retries = options.retries ?? this.maxRetries;
    const skipLog = options.skipLog ?? false;

    const webhookUrl = this.getWebhookUrl(event);
    const results = [];

    // Prepara payload con dati comuni
    const payload = this.formatPayload(event, data);

    // Invia a GHL (URL specifico o fallback)
    if (webhookUrl) {
      const ghlResult = await this.sendWithRetry(webhookUrl, event, payload, retries);
      results.push({ target: 'ghl', url: webhookUrl, ...ghlResult });

      // Log nel database
      if (!skipLog) {
        await this.logWebhook(event, payload, ghlResult.success ? 'success' : 'failed', ghlResult.error || ghlResult.status, webhookUrl);
      }
    }

    // Invia a custom webhook se configurato
    if (this.customWebhookUrl) {
      const customResult = await this.sendWithRetry(this.customWebhookUrl, event, payload, retries);
      results.push({ target: 'custom', url: this.customWebhookUrl, ...customResult });

      if (!skipLog) {
        await this.logWebhook(event, payload, customResult.success ? 'success' : 'failed', customResult.error || customResult.status, this.customWebhookUrl);
      }
    }

    // Log warning se nessun webhook configurato
    if (!webhookUrl && !this.customWebhookUrl) {
      console.log(`[WEBHOOK] No URL configured for event: ${event}`);
      return {
        event,
        timestamp: new Date().toISOString(),
        success: false,
        error: 'No webhook URL configured',
        results: []
      };
    }

    const allSuccess = results.every(r => r.success);

    return {
      event,
      timestamp: new Date().toISOString(),
      success: allSuccess,
      results
    };
  }

  /**
   * Invia richiesta HTTP con retry e exponential backoff
   */
  async sendWithRetry(url, event, payload, maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-DOID-Event': event,
            'X-DOID-Timestamp': payload.timestamp,
            'X-Webhook-Source': 'doid-suite',
            // Header di autenticazione opzionale
            ...(process.env.GHL_WEBHOOK_SECRET && {
              'X-Webhook-Secret': process.env.GHL_WEBHOOK_SECRET
            })
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log(`[WEBHOOK] ${event} sent successfully to ${url}`);
        return {
          success: true,
          status: response.status,
          attempt
        };

      } catch (error) {
        console.error(`[WEBHOOK] ${event} attempt ${attempt}/${maxRetries} failed:`, error.message);

        if (attempt === maxRetries) {
          return {
            success: false,
            error: error.message,
            attempts: attempt
          };
        }

        // Exponential backoff: 1s, 2s, 4s, 8s...
        const delay = 1000 * Math.pow(2, attempt - 1);
        console.log(`[WEBHOOK] Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
  }

  /**
   * Formatta il payload per GHL
   */
  formatPayload(event, data) {
    const basePayload = {
      event,
      timestamp: new Date().toISOString(),
      source: 'doid-suite',
      // Info supporto sempre incluse
      ...this.supportInfo,
      // URL dashboard basato sul servizio
      dashboard_url: this.getDashboardUrl(data.requestedService || data.service)
    };

    switch (event) {
      // user.registered: Crea contatto in GHL e invia email di conferma
      // L'utente si è appena registrato, email NON ancora confermata
      // Include link di conferma email per il workflow GHL
      case 'user.registered':
        return {
          ...basePayload,
          // Campi standard GHL per contatti
          email: data.email,
          contact_email: data.email,
          firstName: data.firstName || this.extractFirstName(data.fullName),
          first_name: data.firstName || this.extractFirstName(data.fullName),
          lastName: data.lastName || this.extractLastName(data.fullName),
          last_name: data.lastName || this.extractLastName(data.fullName),
          name: data.fullName,
          full_name: data.fullName,
          phone: data.phone || '',
          // Campi per abilitare invio email in GHL (ma email non verificata nel nostro sistema)
          emailVerified: true, // Per GHL - permette invio email
          email_verified: true,
          dnd: false, // Do Not Disturb = false (permetti comunicazioni)
          dndSettings: {
            email: { status: 'active' },
            sms: { status: 'active' }
          },
          // URL di conferma email (da includere nell'email GHL)
          confirmation_url: data.confirmationUrl,
          confirmationUrl: data.confirmationUrl,
          // Custom fields
          customField: {
            activity_name: data.activityName,
            confirmation_url: data.confirmationUrl,
            email_pending_verification: 'true'
          },
          // Tags
          tags: ['user_registered', 'new_lead', 'email_pending']
        };

      // user.email_confirmed: Dopo che l'utente ha cliccato sul link di conferma
      case 'user.email_confirmed':
        return {
          ...basePayload,
          email: data.email,
          contact_email: data.email,
          firstName: data.firstName || this.extractFirstName(data.fullName),
          first_name: data.firstName || this.extractFirstName(data.fullName),
          lastName: data.lastName || this.extractLastName(data.fullName),
          last_name: data.lastName || this.extractLastName(data.fullName),
          name: data.fullName,
          full_name: data.fullName,
          customField: {
            user_id: data.userId,
            email_verified: 'true',
            email_pending_verification: 'false'
          },
          tags: ['email_confirmed', 'email_verified']
        };

      // user.resend_verification: Utente richiede nuovo link di conferma
      case 'user.resend_verification':
        return {
          ...basePayload,
          email: data.email,
          contact_email: data.email,
          firstName: data.firstName || this.extractFirstName(data.fullName),
          first_name: data.firstName || this.extractFirstName(data.fullName),
          lastName: data.lastName || this.extractLastName(data.fullName),
          last_name: data.lastName || this.extractLastName(data.fullName),
          name: data.fullName,
          full_name: data.fullName,
          confirmation_url: data.confirmationUrl,
          confirmationUrl: data.confirmationUrl,
          customField: {
            confirmation_url: data.confirmationUrl
          },
          tags: ['resend_verification']
        };

      // user.verified: Dopo verifica email, l'utente ha org e activity
      case 'user.verified':
        return {
          ...basePayload,
          // Campi standard GHL
          email: data.email,
          contact_email: data.email,
          firstName: data.firstName || this.extractFirstName(data.fullName),
          first_name: data.firstName || this.extractFirstName(data.fullName),
          lastName: data.lastName || this.extractLastName(data.fullName),
          last_name: data.lastName || this.extractLastName(data.fullName),
          name: data.fullName,
          full_name: data.fullName,
          phone: data.phone || '',
          customField: {
            activity_name: data.activityName,
            organization_id: data.organizationId,
            activity_id: data.activityId
          },
          tags: ['user_verified', 'email_confirmed']
        };

      case 'service.trial_activated':
        return {
          ...basePayload,
          // Campi standard GHL
          email: data.email,
          contact_email: data.email,
          firstName: data.firstName || this.extractFirstName(data.fullName),
          first_name: data.firstName || this.extractFirstName(data.fullName),
          lastName: data.lastName || this.extractLastName(data.fullName),
          last_name: data.lastName || this.extractLastName(data.fullName),
          name: data.fullName,
          full_name: data.fullName,
          phone: data.phone || '',
          // Dati servizio arricchiti
          service: data.service,
          service_label: this.getServiceLabel(data.service),
          dashboard_url: this.getDashboardUrl(data.service),
          upgrade_url: `${this.getDashboardUrl(data.service)}/upgrade`,
          price: this.getServicePrice(data.service),
          has_free_plan: this.serviceHasFreePlan(data.service),
          customField: {
            user_id: data.userId,
            activity_id: data.activityId,
            activity_name: data.activityName,
            organization_id: data.organizationId,
            service: data.service,
            service_label: this.getServiceLabel(data.service),
            plan: data.plan || 'pro',
            trial_end_date: data.trialEndDate,
            trial_end_date_formatted: this.formatDateItalian(data.trialEndDate),
            days_remaining: data.daysRemaining || 30
          },
          tags: ['trial_activated', `service_${data.service}`, 'trial_active']
        };

      case 'admin.user_created':
        return {
          ...basePayload,
          email: data.email,
          firstName: data.firstName || this.extractFirstName(data.fullName),
          lastName: data.lastName || this.extractLastName(data.fullName),
          name: data.fullName,
          phone: data.phone || '',
          customField: {
            user_id: data.userId,
            reset_password_url: data.resetPasswordUrl,
            must_reset_password: data.mustResetPassword,
            created_by_admin: true
          },
          tags: ['admin_created', 'welcome_email', data.mustResetPassword ? 'needs_password_reset' : 'has_password']
        };

      case 'admin.setup_complete':
        return {
          ...basePayload,
          email: data.email,
          firstName: data.firstName || this.extractFirstName(data.fullName),
          lastName: data.lastName || this.extractLastName(data.fullName),
          name: data.fullName,
          customField: {
            user_id: data.userId,
            organization_id: data.organizationId,
            activity_id: data.activityId,
            activity_name: data.activityName,
            service: data.service,
            trial_end_date: data.trialEndDate
          },
          tags: ['setup_complete', `service_${data.service}`]
        };

      case 'trial.started':
        return {
          ...basePayload,
          email: data.email,
          name: data.fullName,
          customField: {
            service: data.service,
            service_name: data.serviceName,
            plan: data.plan,
            trial_end_date: data.trialEndDate,
            activity_id: data.activityId,
            activity_name: data.activityName,
            days_remaining: data.daysRemaining
          },
          tags: [`trial_${data.service}`, 'trial_active']
        };

      case 'trial.day_7':
      case 'trial.day_14':
      case 'trial.day_21':
      case 'trial.day_27':
      case 'trial.expiring':
        return {
          ...basePayload,
          email: data.email,
          name: data.fullName,
          customField: {
            service: data.service,
            service_name: data.serviceName,
            activity_name: data.activityName,
            trial_end_date: data.trialEndDate,
            days_remaining: data.daysRemaining,
            upgrade_url: `https://suite.doid.it/activities/${data.activityId}/upgrade`
          },
          tags: [`trial_reminder_${data.daysRemaining}d`, `service_${data.service}`]
        };

      case 'trial.expired':
        return {
          ...basePayload,
          email: data.email,
          name: data.fullName,
          customField: {
            service: data.service,
            service_name: data.serviceName,
            activity_name: data.activityName,
            has_free_access: data.hasFreeAccess,
            reactivate_url: `https://suite.doid.it/activities/${data.activityId}/reactivate`
          },
          tags: ['trial_expired', `service_${data.service}`, data.hasFreeAccess ? 'free_tier' : 'no_access']
        };

      case 'subscription.created':
      case 'subscription.activated':
      case 'subscription.renewed':
        return {
          ...basePayload,
          email: data.email,
          name: data.fullName,
          customField: {
            service: data.service,
            service_name: data.serviceName,
            plan: data.plan,
            plan_name: data.planName,
            billing_cycle: data.billingCycle,
            price: data.price,
            next_billing_date: data.nextBillingDate,
            activity_name: data.activityName
          },
          tags: [`paying_${data.service}`, `plan_${data.plan}`, `billing_${data.billingCycle}`]
        };

      case 'subscription.cancelled':
        return {
          ...basePayload,
          email: data.email,
          name: data.fullName,
          customField: {
            service: data.service,
            service_name: data.serviceName,
            cancellation_date: data.cancellationDate,
            access_until: data.accessUntil,
            reason: data.reason,
            feedback_url: 'https://suite.doid.it/feedback'
          },
          tags: ['subscription_cancelled', `service_${data.service}`]
        };

      case 'subscription.expired':
        return {
          ...basePayload,
          email: data.email,
          name: data.fullName,
          customField: {
            service: data.service,
            service_name: data.serviceName,
            reactivate_url: `https://suite.doid.it/activities/${data.activityId}/reactivate`
          },
          tags: ['subscription_expired', `service_${data.service}`]
        };

      case 'payment.failed':
        return {
          ...basePayload,
          email: data.email,
          name: data.fullName,
          customField: {
            service: data.service,
            service_name: data.serviceName,
            amount: data.amount,
            failure_reason: data.failureReason,
            retry_date: data.retryDate,
            update_payment_url: 'https://suite.doid.it/billing/payment-method'
          },
          tags: ['payment_failed', `service_${data.service}`]
        };

      case 'password.reset_requested':
        return {
          ...basePayload,
          email: data.email,
          name: data.fullName,
          customField: {
            reset_url: data.resetUrl,
            expires_at: data.expiresAt
          },
          tags: ['password_reset']
        };

      default:
        return {
          ...basePayload,
          ...data,
          tags: [event.replace('.', '_')]
        };
    }
  }

  /**
   * Genera tags per GHL basati sull'evento
   */
  generateTags(event, data) {
    const tags = [event.replace('.', '_')];

    if (data.requestedService) {
      tags.push(`service_${data.requestedService}`);
    }
    if (data.utmSource) {
      tags.push(`source_${data.utmSource}`);
    }
    if (data.utmCampaign) {
      tags.push(`campaign_${data.utmCampaign}`);
    }
    if (data.referralCode) {
      tags.push('referred', `ref_${data.referralCode}`);
    }

    return tags;
  }

  /**
   * Helper: estrae nome da fullName
   */
  extractFirstName(fullName) {
    if (!fullName) return '';
    return fullName.trim().split(' ')[0] || '';
  }

  /**
   * Helper: estrae cognome da fullName
   */
  extractLastName(fullName) {
    if (!fullName) return '';
    return fullName.trim().split(' ').slice(1).join(' ') || '';
  }

  /**
   * Helper: formatta data in italiano (es. "4 febbraio 2025")
   */
  formatDateItalian(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = [
      'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
      'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  /**
   * Helper: ottieni label servizio
   */
  getServiceLabel(service) {
    return this.serviceLabels[service] || service;
  }

  /**
   * Helper: ottieni prezzo servizio
   */
  getServicePrice(service) {
    return this.servicePrices[service] || '9.90';
  }

  /**
   * Helper: servizio ha piano free?
   */
  serviceHasFreePlan(service) {
    return this.serviceHasFree[service] || false;
  }

  // ==================== METODI HELPER PER EVENTI SPECIFICI ====================

  /**
   * Invia webhook per utente verificato
   */
  async sendUserVerified(userData) {
    return this.send('user.verified', userData);
  }

  /**
   * Invia webhook per utente creato da admin
   */
  async sendAdminUserCreated(userData) {
    return this.send('admin.user_created', userData);
  }

  /**
   * Invia webhook per trial avviato
   */
  async sendTrialStarted(trialData) {
    return this.send('trial.started', trialData);
  }

  /**
   * Invia webhook per trial in scadenza
   */
  async sendTrialReminder(reminderData) {
    const days = reminderData.daysRemaining;
    let event = 'trial.expiring';

    // Usa evento specifico per i giorni chiave
    if (days === 7) event = 'trial.day_7';
    else if (days === 14) event = 'trial.day_14';
    else if (days === 21) event = 'trial.day_21';
    else if (days === 27 || days <= 3) event = 'trial.day_27';

    return this.send(event, reminderData);
  }

  /**
   * Invia webhook per trial scaduto
   */
  async sendTrialExpired(expiredData) {
    return this.send('trial.expired', expiredData);
  }

  /**
   * Invia webhook per abbonamento creato
   */
  async sendSubscriptionCreated(subscriptionData) {
    return this.send('subscription.created', subscriptionData);
  }

  /**
   * Invia webhook per abbonamento attivato (upgrade da trial)
   */
  async sendSubscriptionActivated(subscriptionData) {
    return this.send('subscription.activated', subscriptionData);
  }

  /**
   * Invia webhook per abbonamento rinnovato
   */
  async sendSubscriptionRenewed(subscriptionData) {
    return this.send('subscription.renewed', subscriptionData);
  }

  /**
   * Invia webhook per abbonamento cancellato
   */
  async sendSubscriptionCancelled(cancellationData) {
    return this.send('subscription.cancelled', cancellationData);
  }

  /**
   * Invia webhook per pagamento fallito
   */
  async sendPaymentFailed(paymentData) {
    return this.send('payment.failed', paymentData);
  }

  /**
   * Invia webhook per richiesta reset password
   */
  async sendPasswordResetRequested(resetData) {
    return this.send('password.reset_requested', resetData);
  }

  // ==================== NUOVI METODI PER FLUSSO SERVIZI ====================

  /**
   * Invia webhook quando utente attiva trial per un servizio specifico
   * Questo è il webhook SPECIFICO per servizio (dopo la scelta dell'utente)
   */
  async sendServiceTrialActivated(trialData) {
    // Arricchisci con dati calcolati
    const enrichedData = {
      ...trialData,
      service_label: this.getServiceLabel(trialData.service),
      dashboard_url: this.getDashboardUrl(trialData.service),
      upgrade_url: `${this.getDashboardUrl(trialData.service)}/upgrade`,
      price: this.getServicePrice(trialData.service),
      has_free_plan: this.serviceHasFreePlan(trialData.service),
      trial_end_date_formatted: this.formatDateItalian(trialData.trialEndDate)
    };
    return this.send('service.trial_activated', enrichedData);
  }

  /**
   * Invia webhook per admin setup complete
   */
  async sendAdminSetupComplete(setupData) {
    return this.send('admin.setup_complete', setupData);
  }

  // ==================== METODI AGENCY (opzionali) ====================

  /**
   * Invia webhook per upgrade organizzazione ad agency
   */
  async sendOrganizationUpgraded(data) {
    return this.send('organization.upgraded', {
      ...data,
      // Arricchisci con dati formattati
      previous_type_label: data.previousType === 'single' ? 'Account Singolo' : data.previousType,
      new_type_label: data.newType === 'agency' ? 'Agenzia' : data.newType
    });
  }

  /**
   * Invia webhook per nuova attività creata (agency)
   */
  async sendActivityCreated(data) {
    return this.send('activity.created', data);
  }

  /**
   * Invia webhook per membro invitato
   */
  async sendMemberInvited(data) {
    return this.send('member.invited', {
      ...data,
      expires_at_formatted: this.formatDateItalian(data.expiresAt)
    });
  }

  /**
   * Invia webhook per membro che ha accettato invito
   */
  async sendMemberJoined(data) {
    return this.send('member.joined', data);
  }

  // ==================== LICENSE SYNC VERSO APP DOID ====================

  /**
   * Genera firma HMAC per webhook license sync
   * @param {object} payload - Payload da firmare
   * @returns {string} Firma HMAC-SHA256
   */
  generateLicenseSyncSignature(payload) {
    const crypto = require('crypto');
    const dataString = JSON.stringify(payload);
    return crypto.createHmac('sha256', this.licenseSyncSecret).update(dataString).digest('hex');
  }

  /**
   * Invia webhook di sincronizzazione licenza verso app DOID (Review/Page)
   * Questo metodo notifica le app esterne quando una subscription cambia
   *
   * @param {object} params
   * @param {string} params.serviceCode - Codice servizio (smart_review, smart_page, etc.)
   * @param {string} params.action - Azione (trial_activated, activated, renewed, cancelled, expired, payment_failed)
   * @param {object} params.user - Dati utente {id, email}
   * @param {object} params.activity - Dati attività {id, name}
   * @param {object} params.subscription - Dati subscription {status, planCode, billingCycle, expiresAt, trialEndsAt}
   * @returns {Promise<object>} Risultato invio
   */
  async sendLicenseSync({ serviceCode, action, user, activity, subscription }) {
    const webhookUrl = this.licenseSyncUrls[serviceCode];

    if (!webhookUrl) {
      console.log(`[LICENSE_SYNC] No webhook URL configured for service: ${serviceCode}`);
      return { success: false, error: 'No webhook URL configured', serviceCode };
    }

    const timestamp = new Date().toISOString();

    // Costruisci payload nel formato atteso da syncLicenseFromSuite()
    const payload = {
      event: 'license.updated',
      timestamp,
      action,
      service: serviceCode,
      data: {
        user: {
          id: user.id,
          email: user.email
        },
        activity: {
          id: activity?.id,
          name: activity?.name
        },
        license: {
          isValid: ['trial', 'active'].includes(subscription.status),
          subscription: {
            status: subscription.status,
            planCode: subscription.planCode || 'pro',
            billingCycle: subscription.billingCycle || 'monthly',
            expiresAt: subscription.expiresAt || subscription.trialEndsAt || subscription.currentPeriodEnd,
            trialEndsAt: subscription.trialEndsAt
          }
        }
      }
    };

    // Genera firma HMAC
    const signature = this.generateLicenseSyncSignature(payload);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DOID-Event': 'license.updated',
          'X-DOID-Signature': signature,
          'X-DOID-Timestamp': timestamp,
          'X-Webhook-Source': 'doid-suite'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[LICENSE_SYNC] ${action} sent to ${serviceCode}: ${webhookUrl}`);

      // Log nel database
      await this.logWebhook('license.sync', payload, 'success', `${action} - ${serviceCode}`, webhookUrl);

      return {
        success: true,
        serviceCode,
        action,
        status: response.status
      };

    } catch (error) {
      console.error(`[LICENSE_SYNC] Failed to sync ${serviceCode}:`, error.message);

      // Log errore nel database
      await this.logWebhook('license.sync', payload, 'failed', error.message, webhookUrl);

      return {
        success: false,
        serviceCode,
        action,
        error: error.message
      };
    }
  }

  /**
   * Helper: Sincronizza licenza dopo attivazione trial
   */
  async syncLicenseTrialActivated({ serviceCode, user, activity, subscription }) {
    return this.sendLicenseSync({
      serviceCode,
      action: 'trial_activated',
      user,
      activity,
      subscription: {
        status: 'trial',
        planCode: subscription.planCode || 'pro',
        trialEndsAt: subscription.trialEndsAt,
        expiresAt: subscription.trialEndsAt
      }
    });
  }

  /**
   * Helper: Sincronizza licenza dopo attivazione abbonamento
   */
  async syncLicenseActivated({ serviceCode, user, activity, subscription }) {
    return this.sendLicenseSync({
      serviceCode,
      action: 'activated',
      user,
      activity,
      subscription: {
        status: 'active',
        planCode: subscription.planCode || 'pro',
        billingCycle: subscription.billingCycle,
        expiresAt: subscription.currentPeriodEnd
      }
    });
  }

  /**
   * Helper: Sincronizza licenza dopo rinnovo
   */
  async syncLicenseRenewed({ serviceCode, user, activity, subscription }) {
    return this.sendLicenseSync({
      serviceCode,
      action: 'renewed',
      user,
      activity,
      subscription: {
        status: 'active',
        planCode: subscription.planCode || 'pro',
        billingCycle: subscription.billingCycle,
        expiresAt: subscription.currentPeriodEnd
      }
    });
  }

  /**
   * Helper: Sincronizza licenza dopo cancellazione
   */
  async syncLicenseCancelled({ serviceCode, user, activity, subscription }) {
    return this.sendLicenseSync({
      serviceCode,
      action: 'cancelled',
      user,
      activity,
      subscription: {
        status: 'cancelled',
        planCode: subscription.planCode,
        expiresAt: subscription.currentPeriodEnd // Accesso fino a fine periodo
      }
    });
  }

  /**
   * Helper: Sincronizza licenza dopo scadenza
   */
  async syncLicenseExpired({ serviceCode, user, activity, subscription }) {
    return this.sendLicenseSync({
      serviceCode,
      action: 'expired',
      user,
      activity,
      subscription: {
        status: 'expired',
        planCode: subscription.planCode
      }
    });
  }

  /**
   * Helper: Sincronizza licenza dopo pagamento fallito
   */
  async syncLicensePaymentFailed({ serviceCode, user, activity, subscription }) {
    return this.sendLicenseSync({
      serviceCode,
      action: 'payment_failed',
      user,
      activity,
      subscription: {
        status: 'past_due',
        planCode: subscription.planCode,
        expiresAt: subscription.currentPeriodEnd
      }
    });
  }

  /**
   * Notifica admin che un utente migrato ha completato il cambio password
   * Invia webhook a GHL per notifica email a info.doid@gmail.com
   * @param {object} userData - Dati utente
   * @param {string} userData.email - Email utente
   * @param {string} userData.userId - ID utente
   * @param {string} userData.migratedFrom - Servizio di provenienza
   * @param {Date} userData.firstLoginAt - Data primo login
   * @returns {Promise<boolean>}
   */
  async notifyMigrationPasswordChanged(userData) {
    const { email, userId, migratedFrom, firstLoginAt } = userData;

    console.log(`[WEBHOOK] Notifying migration password changed for ${email}`);

    return this.send('migration.password_changed', {
      event_type: 'migration_password_changed',
      admin_email: 'info.doid@gmail.com',
      user_email: email,
      user_id: userId,
      migrated_from: migratedFrom || 'unknown',
      migrated_from_label: this.serviceLabels[migratedFrom] || migratedFrom || 'Servizio sconosciuto',
      first_login_at: firstLoginAt ? new Date(firstLoginAt).toISOString() : null,
      password_changed_at: new Date().toISOString(),
      action_required: 'Aggiungi tag "migrazione-confermata" in GHL per questo contatto',
      dashboard_url: 'https://suite.doid.it/admin',
      supabase_url: 'https://supabase.com/dashboard/project/opmzzqfhxlrpjuzbwwep/editor'
    });
  }

  /**
   * Notifica admin di una nuova registrazione utente
   * Invia webhook a GHL per notifica email a info.doid@gmail.com
   * @param {object} userData - Dati utente
   * @param {string} userData.email - Email utente
   * @param {string} userData.userId - ID utente
   * @param {string} userData.firstName - Nome
   * @param {string} userData.lastName - Cognome
   * @param {string} userData.organizationName - Nome organizzazione
   * @returns {Promise<boolean>}
   */
  async notifyNewRegistration(userData) {
    const { email, userId, firstName, lastName, organizationName } = userData;

    console.log(`[WEBHOOK] Notifying new registration for ${email}`);

    return this.send('admin.new_registration', {
      event_type: 'new_registration',
      admin_email: 'info.doid@gmail.com',
      user_email: email,
      user_id: userId,
      first_name: firstName || '',
      last_name: lastName || '',
      full_name: [firstName, lastName].filter(Boolean).join(' ') || email,
      organization_name: organizationName || '',
      registered_at: new Date().toISOString(),
      dashboard_url: 'https://suite.doid.it/admin',
      supabase_url: 'https://supabase.com/dashboard/project/opmzzqfhxlrpjuzbwwep/editor'
    });
  }
}

export default new WebhookService();
