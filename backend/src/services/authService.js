import { supabase, supabaseAdmin } from '../config/supabase.js';
import jwt from 'jsonwebtoken';
import { Errors } from '../middleware/errorHandler.js';
import { isSuperAdmin } from '../middleware/adminAuth.js';
import organizationService from './organizationService.js';
import activityService from './activityService.js';
import subscriptionService from './subscriptionService.js';
import webhookService from './webhookService.js';

class AuthService {
  // Registrazione nuovo utente
  async register({
    email,
    password,
    fullName,
    activityName = 'La mia attività',
    requestedService = 'smart_review',
    utmSource = null,
    utmMedium = null,
    utmCampaign = null,
    utmContent = null,
    referralCode = null
  }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw Errors.Conflict('Email già registrata');
      }
      throw Errors.BadRequest(error.message);
    }

    // Salva i dati in pending_registrations per processarli dopo verifica email
    if (data.user) {
      try {
        const { error: pendingError } = await supabaseAdmin
          .from('pending_registrations')
          .insert({
            user_id: data.user.id,
            activity_name: activityName,
            requested_service: requestedService,
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            utm_content: utmContent,
            referral_code: referralCode
          });

        if (pendingError) {
          console.error('Error saving pending registration:', pendingError);
          // Non blocchiamo la registrazione se fallisce il salvataggio pending
        }
      } catch (err) {
        console.error('Error in pending registration:', err);
      }
    }

    return {
      user: data.user,
      session: data.session
    };
  }

  // Ottieni pending registration per un utente
  async getPendingRegistration(userId) {
    const { data, error } = await supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('user_id', userId)
      .is('processed_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching pending registration:', error);
      return null;
    }

    return data;
  }

  // Segna pending registration come processata
  async markPendingRegistrationProcessed(userId) {
    const { error } = await supabaseAdmin
      .from('pending_registrations')
      .update({ processed_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      console.error('Error marking pending registration as processed:', error);
    }
  }

  /**
   * Processa la pending registration: crea organizzazione, attività e attiva trial
   * Viene chiamato al primo login dopo la verifica email
   * @param {string} userId - ID utente
   * @param {string} userEmail - Email utente
   * @param {string} fullName - Nome completo utente
   * @returns {object|null} - Oggetto con org, activity, subscription create o null
   */
  async processPendingRegistration(userId, userEmail, fullName) {
    try {
      // 1. Verifica se c'è una pending registration
      const pending = await this.getPendingRegistration(userId);
      if (!pending) {
        return null;
      }

      console.log(`[PENDING] Processing registration for user ${userId}:`, {
        activityName: pending.activity_name,
        requestedService: pending.requested_service
      });

      // 2. Verifica che l'utente non abbia già un'organizzazione
      const existingOrgs = await this.getUserOrganizations(userId);
      if (existingOrgs.length > 0) {
        console.log(`[PENDING] User ${userId} already has organizations, marking as processed`);
        await this.markPendingRegistrationProcessed(userId);
        return null;
      }

      // 3. Crea l'organizzazione (single account)
      const organization = await organizationService.create({
        name: fullName || pending.activity_name,
        email: userEmail,
        userId: userId
      });

      console.log(`[PENDING] Created organization ${organization.id} for user ${userId}`);

      // 4. Crea l'attività
      const activity = await activityService.createActivity(userId, {
        name: pending.activity_name,
        email: userEmail
      });

      console.log(`[PENDING] Created activity ${activity.id} for user ${userId}`);

      // 5. Attiva trial per il servizio richiesto
      let subscription = null;
      if (pending.requested_service) {
        try {
          subscription = await subscriptionService.activateTrial(
            activity.id,
            pending.requested_service
          );
          console.log(`[PENDING] Activated trial for ${pending.requested_service} on activity ${activity.id}`);
        } catch (trialError) {
          // Non bloccare se il trial fallisce (es. servizio non esiste)
          console.error(`[PENDING] Failed to activate trial:`, trialError.message);
        }
      }

      // 6. Segna la pending registration come processata
      await this.markPendingRegistrationProcessed(userId);

      console.log(`[PENDING] Successfully processed registration for user ${userId}`);

      // 7. Invia webhook a servizi esterni (GHL per email benvenuto)
      try {
        await webhookService.sendUserVerified({
          email: userEmail,
          fullName,
          activityName: pending.activity_name,
          requestedService: pending.requested_service,
          organizationId: organization.id,
          activityId: activity.id,
          trialEndDate: subscription?.trialEndsAt || null,
          utmSource: pending.utm_source,
          utmMedium: pending.utm_medium,
          utmCampaign: pending.utm_campaign,
          utmContent: pending.utm_content,
          referralCode: pending.referral_code
        });
        console.log(`[PENDING] Webhook sent for user ${userId}`);
      } catch (webhookError) {
        // Non bloccare se il webhook fallisce
        console.error(`[PENDING] Webhook failed for user ${userId}:`, webhookError.message);
      }

      return {
        organization,
        activity,
        subscription,
        pendingData: {
          activityName: pending.activity_name,
          requestedService: pending.requested_service,
          utmSource: pending.utm_source,
          utmCampaign: pending.utm_campaign
        }
      };
    } catch (error) {
      console.error(`[PENDING] Error processing registration for user ${userId}:`, error);
      // Non lanciare errore - il login deve comunque funzionare
      return null;
    }
  }

  // Login utente
  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw Errors.Unauthorized('Credenziali non valide');
      }
      throw Errors.BadRequest(error.message);
    }

    // Processa pending registration se esiste (primo login dopo verifica email)
    const pendingResult = await this.processPendingRegistration(
      data.user.id,
      data.user.email,
      data.user.user_metadata?.full_name
    );

    // Ottieni le organizzazioni dell'utente (aggiornate dopo eventuale processing)
    const organizations = await this.getUserOrganizations(data.user.id);

    const response = {
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name,
        createdAt: data.user.created_at,
        isSuperAdmin: isSuperAdmin(data.user.email)
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at
      },
      organizations
    };

    // Aggiungi info sul setup automatico se è stato processato
    if (pendingResult) {
      response.autoSetup = {
        completed: true,
        organization: pendingResult.organization,
        activity: pendingResult.activity,
        subscription: pendingResult.subscription,
        requestedService: pendingResult.pendingData?.requestedService
      };
    }

    return response;
  }

  // Logout utente
  async logout(token) {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
    }

    return { success: true };
  }

  // Ottieni utente corrente
  async getCurrentUser(userId) {
    const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error || !user) {
      throw Errors.NotFound('Utente non trovato');
    }

    const organizations = await this.getUserOrganizations(userId);

    return {
      id: user.user.id,
      email: user.user.email,
      fullName: user.user.user_metadata?.full_name,
      createdAt: user.user.created_at,
      isSuperAdmin: isSuperAdmin(user.user.email),
      organizations
    };
  }

  // Refresh token
  async refreshToken(refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      throw Errors.Unauthorized('Impossibile aggiornare la sessione');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at
    };
  }

  // Recupero password
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) {
      throw Errors.BadRequest(error.message);
    }

    return { success: true };
  }

  // Aggiorna password
  async updatePassword(token, newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw Errors.BadRequest(error.message);
    }

    return { success: true };
  }

  // Ottieni organizzazioni dell'utente
  async getUserOrganizations(userId) {
    const { data, error } = await supabaseAdmin
      .from('organization_users')
      .select(`
        role,
        organization:organizations (
          id,
          name,
          slug,
          logo_url,
          status
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user organizations:', error);
      return [];
    }

    return data
      .filter(item => item.organization && item.organization.status === 'active')
      .map(item => ({
        id: item.organization.id,
        name: item.organization.name,
        slug: item.organization.slug,
        logoUrl: item.organization.logo_url,
        role: item.role
      }));
  }

  // Genera token per impersonation (admin che accede come altro utente)
  generateImpersonationTokens({ userId, email, fullName, impersonatedBy, impersonatedByEmail }) {
    const accessPayload = {
      sub: userId,
      email,
      user_metadata: { full_name: fullName },
      type: 'impersonation',
      impersonatedBy,
      impersonatedByEmail,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 ore
    };

    const refreshPayload = {
      sub: userId,
      type: 'impersonation_refresh',
      impersonatedBy,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 giorni
    };

    return {
      accessToken: jwt.sign(accessPayload, process.env.JWT_SECRET),
      refreshToken: jwt.sign(refreshPayload, process.env.JWT_SECRET)
    };
  }

  // Genera token per app esterne
  generateExternalToken({ userId, organizationId, activityId, service, role }) {
    const payload = {
      userId,
      organizationId,
      service,
      role,
      type: 'external_access'
    };

    // Aggiungi activityId se presente (nuovo modello basato su attività)
    if (activityId) {
      payload.activityId = activityId;
    }

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXTERNAL_EXPIRES_IN || '5m'
    });
  }

  // Verifica token per app esterne
  verifyExternalToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.type !== 'external_access' && decoded.type !== 'sidebar_access') {
        throw Errors.Unauthorized('Tipo di token non valido');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw Errors.Unauthorized('Token scaduto');
      }
      throw Errors.Unauthorized('Token non valido');
    }
  }

  // Genera token per la sidebar DOID Suite (lunga durata, solo lettura)
  generateSidebarToken({ userId, organizationId, activityId, service, role }) {
    const payload = {
      userId,
      organizationId,
      service,
      role,
      type: 'sidebar_access'
    };

    if (activityId) {
      payload.activityId = activityId;
    }

    // Token della sidebar valido per 24 ore
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_SIDEBAR_EXPIRES_IN || '24h'
    });
  }

  // Verifica token della sidebar
  verifySidebarToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.type !== 'sidebar_access') {
        throw Errors.Unauthorized('Tipo di token non valido per sidebar');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw Errors.Unauthorized('Token sidebar scaduto');
      }
      throw Errors.Unauthorized('Token sidebar non valido');
    }
  }

  // Conferma email utente (solo per sviluppo/admin)
  async confirmUserEmail(userId) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true
    });

    if (error) {
      throw Errors.BadRequest(error.message);
    }

    return { success: true, user: data.user };
  }

  // Ottieni utente per email
  async getUserByEmail(email) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      throw Errors.Internal('Errore nel recupero utenti');
    }

    const user = data.users.find(u => u.email === email);
    if (!user) {
      throw Errors.NotFound('Utente non trovato');
    }

    return user;
  }
}

export default new AuthService();
