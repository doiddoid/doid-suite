import { supabaseAdmin } from '../config/supabase.js';
import { Errors } from '../middleware/errorHandler.js';
import serviceService from './serviceService.js';
import webhookService from './webhookService.js';

class SubscriptionService {
  // ==================== ACTIVITY-BASED SUBSCRIPTIONS ====================

  /**
   * Verifica se un'attività ha accesso a un servizio tramite pacchetto dell'organizzazione
   */
  async getActivityPackageSubscription(activityId, serviceCode) {
    // Ottieni organization_id dell'attività
    const { data: activity } = await supabaseAdmin
      .from('activities')
      .select('organization_id')
      .eq('id', activityId)
      .single();

    if (!activity?.organization_id) {
      return null;
    }

    // Verifica pacchetti attivi dell'organizzazione che includono il servizio
    const { data: orgPackages } = await supabaseAdmin
      .from('organization_packages')
      .select(`
        id,
        status,
        trial_ends_at,
        current_period_end,
        package:service_packages (
          id,
          name,
          max_activities,
          services:package_services (
            service:services (id, code),
            plan:plans (id, code, name, price_monthly, price_yearly, features)
          )
        )
      `)
      .eq('organization_id', activity.organization_id)
      .in('status', ['active', 'trial']);

    if (!orgPackages || orgPackages.length === 0) {
      return null;
    }

    // Cerca il servizio nei pacchetti
    for (const op of orgPackages) {
      const packageServices = op.package?.services || [];
      const matchingService = packageServices.find(ps => ps.service?.code === serviceCode);

      if (matchingService) {
        const now = new Date();
        let isActive = false;

        if (op.status === 'trial') {
          isActive = new Date(op.trial_ends_at) > now;
        } else if (op.status === 'active') {
          isActive = new Date(op.current_period_end) > now;
        }

        if (isActive) {
          return {
            id: op.id,
            status: op.status,
            inherited: true,
            inheritedFrom: 'organization_package',
            packageId: op.package.id,
            packageName: op.package.name,
            plan: matchingService.plan,
            trialEndsAt: op.trial_ends_at,
            currentPeriodEnd: op.current_period_end
          };
        }
      }
    }

    return null;
  }

  /**
   * Ottieni tutti gli abbonamenti di un'attività
   */
  async getActivitySubscriptions(activityId) {
    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        service:services (
          id,
          code,
          name,
          description,
          app_url,
          icon,
          color
        ),
        plan:plans (
          id,
          code,
          name,
          price_monthly,
          price_yearly,
          trial_days,
          features
        )
      `)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching activity subscriptions:', error);
      throw Errors.Internal('Errore nel recupero degli abbonamenti');
    }

    return subscriptions.map(sub => this.formatSubscription(sub));
  }

  /**
   * Ottieni abbonamento specifico per attività e servizio
   */
  async getSubscription(activityId, serviceCode) {
    const service = await serviceService.getServiceByCode(serviceCode);
    if (!service) {
      return null;
    }

    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        service:services (
          id,
          code,
          name,
          description,
          app_url,
          icon,
          color
        ),
        plan:plans (
          id,
          code,
          name,
          price_monthly,
          price_yearly,
          trial_days,
          features
        )
      `)
      .eq('activity_id', activityId)
      .eq('service_id', service.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching subscription:', error);
      throw Errors.Internal('Errore nel recupero dell\'abbonamento');
    }

    return this.formatSubscription(subscription);
  }

  /**
   * Attiva trial per un servizio
   * @param {string} activityId - ID dell'attività
   * @param {string} serviceCode - Codice del servizio
   * @param {string} userId - ID dell'utente (opzionale, per webhook)
   */
  async activateTrial(activityId, serviceCode, userId = null) {
    const service = await serviceService.getServiceByCode(serviceCode);
    if (!service) {
      throw Errors.NotFound('Servizio non trovato');
    }

    // Verifica se esiste già un abbonamento
    const existingSub = await this.getSubscription(activityId, serviceCode);
    if (existingSub) {
      throw Errors.Conflict('Esiste già un abbonamento per questo servizio');
    }

    // Ottieni dati completi dell'attività (per backwards compatibility e webhook)
    const { data: activity } = await supabaseAdmin
      .from('activities')
      .select('id, name, email, organization_id')
      .eq('id', activityId)
      .single();

    // Trova il piano con trial (pro o quello con trial_days > 0)
    const plans = await serviceService.getServicePlans(service.id);
    const trialPlan = plans.find(p => p.trialDays > 0) || plans.find(p => p.code === 'pro') || plans[0];

    if (!trialPlan) {
      throw Errors.NotFound('Nessun piano disponibile per questo servizio');
    }

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + (trialPlan.trialDays || 30) * 24 * 60 * 60 * 1000);

    const insertData = {
      activity_id: activityId,
      service_id: service.id,
      plan_id: trialPlan.id,
      status: 'trial',
      trial_ends_at: trialEndsAt.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: trialEndsAt.toISOString()
    };

    // Aggiungi organization_id se disponibile (per backwards compatibility)
    if (activity?.organization_id) {
      insertData.organization_id = activity.organization_id;
    }

    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .insert(insertData)
      .select(`
        *,
        service:services (
          id, code, name, description, app_url, icon, color
        ),
        plan:plans (
          id, code, name, price_monthly, price_yearly, trial_days, features
        )
      `)
      .single();

    if (error) {
      console.error('Error creating trial:', error);
      throw Errors.Internal('Errore nell\'attivazione del trial');
    }

    // Invia webhook per attivazione trial servizio specifico
    // Questo viene chiamato quando l'utente SCEGLIE il servizio dalla dashboard
    if (userId) {
      try {
        // Recupera dati utente per il webhook
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        const user = userData?.user;

        if (user) {
          await webhookService.sendServiceTrialActivated({
            userId: user.id,
            email: user.email,
            fullName: user.user_metadata?.full_name || 'Utente',
            firstName: user.user_metadata?.first_name,
            lastName: user.user_metadata?.last_name,
            activityId: activityId,
            activityName: activity?.name || 'La mia attività',
            organizationId: activity?.organization_id,
            service: serviceCode,
            plan: trialPlan.code,
            trialEndDate: trialEndsAt.toISOString(),
            daysRemaining: trialPlan.trialDays || 30
          });
          console.log(`[SUBSCRIPTION] Webhook service.trial_activated inviato per ${serviceCode}`);
        }
      } catch (webhookError) {
        // Non bloccare se il webhook fallisce
        console.error('[SUBSCRIPTION] Errore invio webhook trial activated:', webhookError.message);
      }
    }

    return this.formatSubscription(subscription);
  }

  /**
   * Attiva abbonamento
   */
  async activateSubscription(activityId, serviceCode, planCode, billingCycle = 'monthly') {
    const service = await serviceService.getServiceByCode(serviceCode);
    if (!service) {
      throw Errors.NotFound('Servizio non trovato');
    }

    const plans = await serviceService.getServicePlans(service.id);
    const plan = plans.find(p => p.code === planCode);
    if (!plan) {
      throw Errors.NotFound('Piano non trovato');
    }

    const now = new Date();
    const periodEnd = billingCycle === 'yearly'
      ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const existingSub = await this.getSubscription(activityId, serviceCode);

    let subscription;
    if (existingSub) {
      // Aggiorna esistente
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan_id: plan.id,
          status: 'active',
          billing_cycle: billingCycle,
          trial_ends_at: null,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancelled_at: null,
          updated_at: now.toISOString()
        })
        .eq('id', existingSub.id)
        .select(`
          *,
          service:services (id, code, name, description, app_url, icon, color),
          plan:plans (id, code, name, price_monthly, price_yearly, trial_days, features)
        `)
        .single();

      if (error) {
        console.error('Error updating subscription:', error);
        throw Errors.Internal('Errore nell\'attivazione dell\'abbonamento');
      }
      subscription = data;
    } else {
      // Crea nuovo
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          activity_id: activityId,
          service_id: service.id,
          plan_id: plan.id,
          status: 'active',
          billing_cycle: billingCycle,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString()
        })
        .select(`
          *,
          service:services (id, code, name, description, app_url, icon, color),
          plan:plans (id, code, name, price_monthly, price_yearly, trial_days, features)
        `)
        .single();

      if (error) {
        console.error('Error creating subscription:', error);
        throw Errors.Internal('Errore nell\'attivazione dell\'abbonamento');
      }
      subscription = data;
    }

    return this.formatSubscription(subscription);
  }

  /**
   * Cancella abbonamento
   */
  async cancelSubscription(activityId, serviceCode) {
    const existingSub = await this.getSubscription(activityId, serviceCode);
    if (!existingSub) {
      throw Errors.NotFound('Abbonamento non trovato');
    }

    const now = new Date();
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', existingSub.id);

    if (error) {
      console.error('Error cancelling subscription:', error);
      throw Errors.Internal('Errore nella cancellazione dell\'abbonamento');
    }

    return { success: true, message: 'Abbonamento cancellato' };
  }

  /**
   * Verifica stato abbonamento
   */
  async checkSubscriptionStatus(activityId, serviceCode) {
    const subscription = await this.getSubscription(activityId, serviceCode);

    if (!subscription) {
      return {
        isActive: false,
        canAccess: false,
        status: null,
        expiresAt: null,
        plan: null
      };
    }

    const now = new Date();
    let isActive = false;
    let canAccess = false;
    let newStatus = subscription.status;

    if (subscription.status === 'trial') {
      const trialEnd = new Date(subscription.trialEndsAt);
      if (now > trialEnd) {
        newStatus = 'expired';
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'expired', updated_at: now.toISOString() })
          .eq('id', subscription.id);
      } else {
        isActive = true;
        canAccess = true;
      }
    } else if (subscription.status === 'active') {
      const periodEnd = new Date(subscription.currentPeriodEnd);
      if (now > periodEnd) {
        newStatus = 'expired';
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'expired', updated_at: now.toISOString() })
          .eq('id', subscription.id);
      } else {
        isActive = true;
        canAccess = true;
      }
    }

    // Piano free è sempre attivo
    if (subscription.plan?.code === 'free') {
      isActive = true;
      canAccess = true;
    }

    return {
      isActive,
      canAccess,
      status: newStatus,
      expiresAt: subscription.trialEndsAt || subscription.currentPeriodEnd,
      plan: subscription.plan
    };
  }

  /**
   * Dashboard: tutti i servizi con stato per l'attività
   * Include sia abbonamenti diretti che ereditati da pacchetti organizzazione
   */
  async getActivityServicesWithStatus(activityId) {
    const services = await serviceService.getAllServices();

    // Abbonamenti diretti dell'attività
    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        plan:plans (
          id, code, name, price_monthly, price_yearly, trial_days, features
        )
      `)
      .eq('activity_id', activityId);

    if (error) {
      console.error('Error fetching subscriptions:', error);
    }

    const subscriptionMap = new Map();
    (subscriptions || []).forEach(sub => {
      subscriptionMap.set(sub.service_id, sub);
    });

    // Ottieni abbonamenti da pacchetti organizzazione
    const packageSubscriptions = await this.getActivityPackageSubscriptions(activityId);

    const now = new Date();

    return services.map(service => {
      const sub = subscriptionMap.get(service.id);
      const packageSub = packageSubscriptions.get(service.code);
      let subscription = null;
      let isActive = false;
      let canAccess = false;
      let inherited = false;

      // Prima verifica abbonamento diretto
      if (sub) {
        const plan = sub.plan;

        if (sub.status === 'trial') {
          const trialEnd = new Date(sub.trial_ends_at);
          isActive = now <= trialEnd;
          canAccess = isActive;
        } else if (sub.status === 'active') {
          const periodEnd = new Date(sub.current_period_end);
          isActive = now <= periodEnd;
          canAccess = isActive;
        }

        if (plan?.code === 'free') {
          isActive = true;
          canAccess = true;
        }

        subscription = {
          id: sub.id,
          status: sub.status,
          inherited: false,
          plan: plan ? {
            id: plan.id,
            code: plan.code,
            name: plan.name,
            priceMonthly: parseFloat(plan.price_monthly || 0),
            priceYearly: parseFloat(plan.price_yearly || 0),
            features: plan.features
          } : null,
          trialEndsAt: sub.trial_ends_at,
          currentPeriodEnd: sub.current_period_end,
          expiresAt: sub.trial_ends_at || sub.current_period_end
        };
      }
      // Se non ha abbonamento diretto, verifica pacchetto
      else if (packageSub) {
        isActive = true;
        canAccess = true;
        inherited = true;

        subscription = {
          id: packageSub.id,
          status: packageSub.status,
          inherited: true,
          inheritedFrom: 'organization_package',
          packageId: packageSub.packageId,
          packageName: packageSub.packageName,
          plan: packageSub.plan ? {
            id: packageSub.plan.id,
            code: packageSub.plan.code,
            name: packageSub.plan.name,
            priceMonthly: parseFloat(packageSub.plan.price_monthly || 0),
            priceYearly: parseFloat(packageSub.plan.price_yearly || 0),
            features: packageSub.plan.features
          } : null,
          trialEndsAt: packageSub.trialEndsAt,
          currentPeriodEnd: packageSub.currentPeriodEnd,
          expiresAt: packageSub.trialEndsAt || packageSub.currentPeriodEnd
        };
      }

      return {
        service,
        subscription,
        isActive,
        canAccess,
        inherited
      };
    });
  }

  /**
   * Ottieni tutti i servizi disponibili tramite pacchetti dell'organizzazione
   */
  async getActivityPackageSubscriptions(activityId) {
    const packageSubs = new Map();

    // Ottieni organization_id dell'attività
    const { data: activity } = await supabaseAdmin
      .from('activities')
      .select('organization_id')
      .eq('id', activityId)
      .single();

    if (!activity?.organization_id) {
      return packageSubs;
    }

    // Ottieni pacchetti attivi dell'organizzazione
    const { data: orgPackages } = await supabaseAdmin
      .from('organization_packages')
      .select(`
        id,
        status,
        trial_ends_at,
        current_period_end,
        package:service_packages (
          id,
          name,
          services:package_services (
            service:services (id, code),
            plan:plans (id, code, name, price_monthly, price_yearly, features)
          )
        )
      `)
      .eq('organization_id', activity.organization_id)
      .in('status', ['active', 'trial']);

    if (!orgPackages) return packageSubs;

    const now = new Date();

    for (const op of orgPackages) {
      let isActive = false;
      if (op.status === 'trial') {
        isActive = new Date(op.trial_ends_at) > now;
      } else if (op.status === 'active') {
        isActive = new Date(op.current_period_end) > now;
      }

      if (!isActive) continue;

      const packageServices = op.package?.services || [];
      for (const ps of packageServices) {
        if (ps.service?.code && !packageSubs.has(ps.service.code)) {
          packageSubs.set(ps.service.code, {
            id: op.id,
            status: op.status,
            packageId: op.package.id,
            packageName: op.package.name,
            plan: ps.plan,
            trialEndsAt: op.trial_ends_at,
            currentPeriodEnd: op.current_period_end
          });
        }
      }
    }

    return packageSubs;
  }

  /**
   * Statistiche dashboard per attività
   */
  async getActivityDashboardStats(activityId) {
    const { data: activeSubscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('id, status')
      .eq('activity_id', activityId)
      .in('status', ['active', 'trial']);

    const { data: allServices } = await supabaseAdmin
      .from('services')
      .select('id')
      .eq('is_active', true);

    const { data: subscriptionsWithPlans } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        billing_cycle,
        plan:plans (price_monthly, price_yearly)
      `)
      .eq('activity_id', activityId)
      .eq('status', 'active');

    let monthlySpend = 0;
    (subscriptionsWithPlans || []).forEach(sub => {
      if (sub.plan) {
        if (sub.billing_cycle === 'yearly') {
          monthlySpend += parseFloat(sub.plan.price_yearly) / 12;
        } else {
          monthlySpend += parseFloat(sub.plan.price_monthly);
        }
      }
    });

    return {
      activeServices: activeSubscriptions?.length || 0,
      totalServices: allServices?.length || 0,
      trialServices: activeSubscriptions?.filter(s => s.status === 'trial').length || 0,
      monthlySpend: Math.round(monthlySpend * 100) / 100
    };
  }

  /**
   * Formatta abbonamento per risposta API
   */
  formatSubscription(sub) {
    return {
      id: sub.id,
      status: sub.status,
      billingCycle: sub.billing_cycle,
      trialEndsAt: sub.trial_ends_at,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      cancelledAt: sub.cancelled_at,
      createdAt: sub.created_at,
      updatedAt: sub.updated_at,
      service: sub.service ? {
        id: sub.service.id,
        code: sub.service.code,
        name: sub.service.name,
        description: sub.service.description,
        appUrl: sub.service.app_url,
        icon: sub.service.icon,
        color: sub.service.color
      } : null,
      plan: sub.plan ? {
        id: sub.plan.id,
        code: sub.plan.code,
        name: sub.plan.name,
        priceMonthly: parseFloat(sub.plan.price_monthly || 0),
        priceYearly: parseFloat(sub.plan.price_yearly || 0),
        trialDays: sub.plan.trial_days || 0,
        features: sub.plan.features || {}
      } : null
    };
  }

  // ==================== PAYMENT-BASED SUBSCRIPTIONS ====================

  /**
   * Attiva abbonamento da pagamento esterno (GHL/Stripe)
   * @param {Object} params
   * @param {string} params.activityId - ID attività
   * @param {string} params.serviceCode - Codice servizio
   * @param {string} params.planCode - Codice piano (default: 'pro')
   * @param {string} params.billingCycle - 'monthly' o 'yearly'
   * @param {string} params.externalSubscriptionId - ID abbonamento esterno
   * @param {string} params.transactionId - ID transazione
   * @param {number} params.paidAmount - Importo pagato
   */
  async activateFromPayment({
    activityId,
    serviceCode,
    planCode = 'pro',
    billingCycle = 'monthly',
    externalSubscriptionId,
    transactionId,
    paidAmount
  }) {
    const service = await serviceService.getServiceByCode(serviceCode);
    if (!service) {
      throw Errors.NotFound('Servizio non trovato');
    }

    const plans = await serviceService.getServicePlans(service.id);
    const plan = plans.find(p => p.code === planCode) || plans.find(p => p.code === 'pro');
    if (!plan) {
      throw Errors.NotFound('Piano non trovato');
    }

    const now = new Date();
    const periodEnd = billingCycle === 'yearly'
      ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    // Cerca abbonamento esistente
    const existingSub = await this.getSubscription(activityId, serviceCode);

    let subscription;

    if (existingSub) {
      // Aggiorna abbonamento esistente (upgrade da trial o rinnovo)
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan_id: plan.id,
          status: 'active',
          billing_cycle: billingCycle,
          trial_ends_at: null,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancelled_at: null,
          external_subscription_id: externalSubscriptionId,
          payment_source: 'gohighlevel',
          upgraded_at: existingSub.status === 'trial' ? now.toISOString() : existingSub.upgradedAt,
          updated_at: now.toISOString()
        })
        .eq('id', existingSub.id)
        .select(`
          *,
          service:services (id, code, name, description, app_url, icon, color),
          plan:plans (id, code, name, price_monthly, price_yearly, trial_days, features)
        `)
        .single();

      if (error) {
        console.error('Error updating subscription from payment:', error);
        throw Errors.Internal('Errore nell\'attivazione dell\'abbonamento');
      }
      subscription = data;
      console.log(`[SUBSCRIPTION] Upgraded from ${existingSub.status} to active: ${activityId}/${serviceCode}`);

    } else {
      // Crea nuovo abbonamento
      const { data: activity } = await supabaseAdmin
        .from('activities')
        .select('organization_id')
        .eq('id', activityId)
        .single();

      const insertData = {
        activity_id: activityId,
        service_id: service.id,
        plan_id: plan.id,
        status: 'active',
        billing_cycle: billingCycle,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        external_subscription_id: externalSubscriptionId,
        payment_source: 'gohighlevel',
        upgraded_at: now.toISOString()
      };

      if (activity?.organization_id) {
        insertData.organization_id = activity.organization_id;
      }

      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .insert(insertData)
        .select(`
          *,
          service:services (id, code, name, description, app_url, icon, color),
          plan:plans (id, code, name, price_monthly, price_yearly, trial_days, features)
        `)
        .single();

      if (error) {
        console.error('Error creating subscription from payment:', error);
        throw Errors.Internal('Errore nella creazione dell\'abbonamento');
      }
      subscription = data;
      console.log(`[SUBSCRIPTION] Created new active subscription: ${activityId}/${serviceCode}`);
    }

    return this.formatSubscription(subscription);
  }

  /**
   * Rinnova abbonamento (estende periodo)
   */
  async renewSubscription(activityId, serviceCode) {
    const existingSub = await this.getSubscription(activityId, serviceCode);
    if (!existingSub) {
      throw Errors.NotFound('Abbonamento non trovato');
    }

    const now = new Date();
    const currentEnd = new Date(existingSub.currentPeriodEnd);
    const baseDate = currentEnd > now ? currentEnd : now;

    const newPeriodEnd = existingSub.billingCycle === 'yearly'
      ? new Date(baseDate.getFullYear() + 1, baseDate.getMonth(), baseDate.getDate())
      : new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, baseDate.getDate());

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: newPeriodEnd.toISOString(),
        last_renewed_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', existingSub.id);

    if (error) {
      console.error('Error renewing subscription:', error);
      throw Errors.Internal('Errore nel rinnovo dell\'abbonamento');
    }

    console.log(`[SUBSCRIPTION] Renewed: ${activityId}/${serviceCode} until ${newPeriodEnd.toISOString()}`);
    return { success: true, newPeriodEnd: newPeriodEnd.toISOString() };
  }

  /**
   * Segna pagamento fallito (past_due)
   */
  async markPaymentFailed(activityId, serviceCode) {
    const existingSub = await this.getSubscription(activityId, serviceCode);
    if (!existingSub) {
      throw Errors.NotFound('Abbonamento non trovato');
    }

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSub.id);

    if (error) {
      console.error('Error marking payment failed:', error);
      throw Errors.Internal('Errore nell\'aggiornamento dello stato');
    }

    console.log(`[SUBSCRIPTION] Marked as past_due: ${activityId}/${serviceCode}`);
    return { success: true };
  }
}

export default new SubscriptionService();
