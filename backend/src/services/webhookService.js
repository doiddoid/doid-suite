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
      // Registrazione e verifica
      'user.registered': process.env.GHL_WEBHOOK_USER_REGISTERED,
      'user.verified': process.env.GHL_WEBHOOK_USER_VERIFIED,

      // Creazione da admin
      'admin.user_created': process.env.GHL_WEBHOOK_ADMIN_USER_CREATED,
      'admin.setup_complete': process.env.GHL_WEBHOOK_ADMIN_SETUP_COMPLETE,

      // Trial reminders
      'trial.started': process.env.GHL_WEBHOOK_TRIAL_STARTED,
      'trial.day_7': process.env.GHL_WEBHOOK_TRIAL_DAY_7,
      'trial.day_14': process.env.GHL_WEBHOOK_TRIAL_DAY_14,
      'trial.day_21': process.env.GHL_WEBHOOK_TRIAL_DAY_21,
      'trial.day_27': process.env.GHL_WEBHOOK_TRIAL_DAY_27,
      'trial.expiring': process.env.GHL_WEBHOOK_TRIAL_EXPIRING,
      'trial.expired': process.env.GHL_WEBHOOK_TRIAL_EXPIRED,

      // Subscription
      'subscription.created': process.env.GHL_WEBHOOK_SUBSCRIPTION_CREATED,
      'subscription.activated': process.env.GHL_WEBHOOK_SUBSCRIPTION_ACTIVATED,
      'subscription.renewed': process.env.GHL_WEBHOOK_SUBSCRIPTION_RENEWED,
      'subscription.cancelled': process.env.GHL_WEBHOOK_SUBSCRIPTION_CANCELLED,
      'subscription.expired': process.env.GHL_WEBHOOK_SUBSCRIPTION_EXPIRED,
      'payment.failed': process.env.GHL_WEBHOOK_PAYMENT_FAILED,

      // Password
      'password.reset_requested': process.env.GHL_WEBHOOK_PASSWORD_RESET
    };

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
      case 'user.verified':
      case 'user.registered':
        return {
          ...basePayload,
          email: data.email,
          firstName: data.firstName || this.extractFirstName(data.fullName),
          lastName: data.lastName || this.extractLastName(data.fullName),
          name: data.fullName,
          phone: data.phone || '',
          customField: {
            activity_name: data.activityName,
            requested_service: data.requestedService,
            organization_id: data.organizationId,
            activity_id: data.activityId,
            trial_end_date: data.trialEndDate,
            utm_source: data.utmSource,
            utm_medium: data.utmMedium,
            utm_campaign: data.utmCampaign,
            utm_content: data.utmContent,
            referral_code: data.referralCode
          },
          tags: this.generateTags(event, data)
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
}

export default new WebhookService();
