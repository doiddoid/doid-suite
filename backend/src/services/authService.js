import { supabase, supabaseAdmin } from '../config/supabase.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Errors } from '../middleware/errorHandler.js';
import { isSuperAdmin } from '../middleware/adminAuth.js';
import organizationService from './organizationService.js';
import activityService from './activityService.js';
import subscriptionService from './subscriptionService.js';
import webhookService from './webhookService.js';

class AuthService {
  // Registrazione nuovo utente
  // Usa supabaseAdmin per creare l'utente senza inviare email di conferma Supabase
  // L'email di conferma viene gestita da GHL tramite webhook
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
    // Crea utente con Admin API (NON confermare email - sarà confermata via link GHL)
    const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Email NON confermata - richiede verifica via link
      user_metadata: {
        full_name: fullName
      }
    });

    if (adminError) {
      if (adminError.message.includes('already been registered') ||
          adminError.message.includes('already registered')) {
        throw Errors.Conflict('Email già registrata');
      }
      throw Errors.BadRequest(adminError.message);
    }

    const user = adminData.user;

    // Salva i dati in pending_registrations per processarli al primo login
    if (user) {
      try {
        const { error: pendingError } = await supabaseAdmin
          .from('pending_registrations')
          .insert({
            user_id: user.id,
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
        }
      } catch (err) {
        console.error('Error in pending registration:', err);
      }

      // Genera token di conferma email
      let confirmationUrl = null;
      try {
        const confirmationToken = await this.createEmailConfirmationToken(user.id, email);
        const backendUrl = process.env.BACKEND_URL || 'https://doid-suite-e9i5o.ondigitalocean.app';
        confirmationUrl = `${backendUrl}/api/auth/verify-email/${confirmationToken}`;
        console.log(`[AUTH] Token conferma email generato per ${email}`);
      } catch (tokenError) {
        console.error(`[AUTH] Errore generazione token conferma per ${email}:`, tokenError.message);
      }

      // Invia webhook user.registered per creare contatto in GHL (include link conferma)
      try {
        await webhookService.send('user.registered', {
          email,
          fullName,
          activityName,
          requestedService,
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          referralCode,
          confirmationUrl // URL per conferma email
        });
        console.log(`[AUTH] Webhook user.registered inviato per ${email}`);
      } catch (webhookError) {
        console.error(`[AUTH] Webhook user.registered fallito per ${email}:`, webhookError.message);
      }
    }

    return {
      user: user,
      session: null // Admin API non crea sessione, l'utente deve fare login
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
      // NOTA: Il webhook service.trial_activated viene inviato da subscriptionService.activateTrial
      let subscription = null;
      if (pending.requested_service) {
        try {
          subscription = await subscriptionService.activateTrial(
            activity.id,
            pending.requested_service,
            userId // Passa userId per webhook service.trial_activated
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

      // 7. Invia webhook user.verified (GENERICO, senza servizio)
      // NOTA: Questo webhook NON include il servizio perché l'utente potrebbe non averlo ancora scelto.
      // Il webhook service.trial_activated specifico per servizio viene inviato da subscriptionService.activateTrial
      try {
        await webhookService.sendUserVerified({
          email: userEmail,
          fullName,
          activityName: pending.activity_name,
          // NON includiamo requestedService qui - il webhook generico è per benvenuto senza servizio specifico
          // Se c'era un servizio richiesto, il webhook service.trial_activated è già stato inviato sopra
          organizationId: organization.id,
          activityId: activity.id,
          // Metadati UTM per tracking
          utmSource: pending.utm_source,
          utmMedium: pending.utm_medium,
          utmCampaign: pending.utm_campaign,
          utmContent: pending.utm_content,
          referralCode: pending.referral_code
        });
        console.log(`[PENDING] Webhook user.verified sent for user ${userId}`);
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

  /**
   * Verifica e aggiorna lo stato di migrazione al primo login
   * Se migration_status = 'pending', lo aggiorna a 'confirmed' e salva il timestamp
   * Verifica anche se password_changed = false per forzare il cambio password
   * @param {string} userId - ID utente
   * @returns {object|null} - { requirePasswordChange, migratedFrom } o null se non migrato
   */
  async checkAndUpdateMigrationStatus(userId) {
    try {
      // Verifica se esiste un profilo con dati di migrazione
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('migration_status, migrated_from, password_changed')
        .eq('id', userId)
        .single();

      // Se non esiste profilo o errore, l'utente non è migrato
      if (fetchError || !profile) {
        return null;
      }

      // Se non è un utente migrato (migration_status NULL), nessuna azione
      if (!profile.migration_status) {
        return null;
      }

      // Se migration_status = 'pending', è il primo login: aggiorna a 'confirmed'
      if (profile.migration_status === 'pending') {
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            migration_status: 'confirmed',
            first_login_after_migration: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error(`[MIGRATION] Errore aggiornamento stato per user ${userId}:`, updateError);
        } else {
          console.log(`[MIGRATION] Primo login confermato per user ${userId}, migrato da: ${profile.migrated_from}`);
        }
      }

      // Se password non ancora cambiata, forza il cambio
      if (profile.password_changed === false) {
        return {
          requirePasswordChange: true,
          migratedFrom: profile.migrated_from
        };
      }

      // Password già cambiata, login normale
      return null;
    } catch (error) {
      console.error(`[MIGRATION] Errore check migrazione per user ${userId}:`, error);
      // Non bloccare il login in caso di errore
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

    // Verifica stato migrazione
    const migrationResult = await this.checkAndUpdateMigrationStatus(data.user.id);

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

    // Aggiungi flag per cambio password obbligatorio (utenti migrati)
    if (migrationResult?.requirePasswordChange) {
      response.requirePasswordChange = true;
      response.migratedFrom = migrationResult.migratedFrom;
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

  // ============================================
  // PASSWORD RESET METHODS (Custom via GHL)
  // ============================================

  /**
   * Genera un token sicuro per il reset password
   * @returns {string} Token di 64 caratteri hex
   */
  generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Crea un token di reset password nel database
   * @param {string} userId - ID utente
   * @param {string} email - Email utente
   * @returns {string} Token generato
   */
  async createPasswordResetToken(userId, email) {
    const token = this.generatePasswordResetToken();

    // Elimina eventuali token precedenti per questo utente
    await supabaseAdmin
      .from('password_resets')
      .delete()
      .eq('user_id', userId);

    // Crea nuovo token (scade in 1 ora)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const { error } = await supabaseAdmin
      .from('password_resets')
      .insert({
        user_id: userId,
        token,
        email,
        expires_at: expiresAt.toISOString()
      });

    if (error) {
      console.error('Error creating password reset token:', error);
      throw Errors.Internal('Errore nella creazione del token di reset');
    }

    return { token, expiresAt };
  }

  /**
   * Richiesta recupero password - genera token e invia webhook a GHL
   * @param {string} email - Email dell'utente
   */
  async resetPassword(email) {
    try {
      // Trova l'utente
      const user = await this.getUserByEmail(email);

      // Genera token di reset
      const { token, expiresAt } = await this.createPasswordResetToken(user.id, email);
      const frontendUrl = process.env.FRONTEND_URL || 'https://suite.doid.it';
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

      console.log(`[AUTH] Token reset password generato per ${email}`);

      // Invia webhook per email reset password
      try {
        await webhookService.sendPasswordResetRequested({
          email,
          fullName: user.user_metadata?.full_name,
          resetUrl,
          expiresAt: expiresAt.toISOString()
        });
        console.log(`[AUTH] Webhook password.reset_requested inviato per ${email}`);
      } catch (webhookError) {
        console.error(`[AUTH] Webhook password.reset_requested fallito:`, webhookError.message);
        // Non bloccare - l'utente potrebbe non ricevere l'email ma non riveliamo l'esistenza dell'account
      }

      return { success: true };
    } catch (error) {
      // Non rivelare se l'email esiste o meno per sicurezza
      console.log(`[AUTH] Reset password request for ${email}: ${error.message}`);
      return { success: true };
    }
  }

  /**
   * Verifica token di reset password
   * @param {string} token - Token di reset
   * @returns {object} Dati del token se valido
   */
  async verifyPasswordResetToken(token) {
    const { data: resetData, error: findError } = await supabaseAdmin
      .from('password_resets')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (findError || !resetData) {
      throw Errors.BadRequest('Token non valido o già utilizzato');
    }

    // Verifica scadenza
    if (new Date(resetData.expires_at) < new Date()) {
      throw Errors.BadRequest('Token scaduto. Richiedi un nuovo link di reset.');
    }

    return resetData;
  }

  /**
   * Completa il reset password con il token
   * @param {string} token - Token di reset
   * @param {string} newPassword - Nuova password
   */
  async completePasswordReset(token, newPassword) {
    // Verifica token
    const resetData = await this.verifyPasswordResetToken(token);

    // Aggiorna password tramite Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      resetData.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      throw Errors.Internal('Errore nell\'aggiornamento della password');
    }

    // Segna token come utilizzato
    await supabaseAdmin
      .from('password_resets')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetData.id);

    console.log(`[AUTH] Password resettata per user ${resetData.user_id}`);

    return { success: true, email: resetData.email };
  }

  // Aggiorna password (utente autenticato)
  async updatePassword(token, newPassword, userId = null) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw Errors.BadRequest(error.message);
    }

    // Se userId fornito, aggiorna password_changed nel profilo (per utenti migrati)
    if (userId) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          password_changed: true,
          password_changed_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        console.error(`[MIGRATION] Errore aggiornamento password_changed per user ${userId}:`, profileError);
      } else {
        console.log(`[MIGRATION] Password cambiata per user ${userId}`);
      }
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

  // ============================================
  // EMAIL CONFIRMATION METHODS
  // ============================================

  /**
   * Genera un token sicuro per la conferma email
   * @returns {string} Token di 64 caratteri hex
   */
  generateConfirmationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Crea un token di conferma email nel database
   * @param {string} userId - ID utente
   * @param {string} email - Email da confermare
   * @returns {string} Token generato
   */
  async createEmailConfirmationToken(userId, email) {
    const token = this.generateConfirmationToken();

    // Elimina eventuali token precedenti per questo utente
    await supabaseAdmin
      .from('email_confirmations')
      .delete()
      .eq('user_id', userId);

    // Crea nuovo token
    const { error } = await supabaseAdmin
      .from('email_confirmations')
      .insert({
        user_id: userId,
        token,
        email,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 ore
      });

    if (error) {
      console.error('Error creating email confirmation token:', error);
      throw Errors.Internal('Errore nella creazione del token di conferma');
    }

    return token;
  }

  /**
   * Verifica un token di conferma email e conferma l'email dell'utente
   * @param {string} token - Token di conferma
   * @returns {object} Risultato della verifica
   */
  async verifyEmailToken(token) {
    // Cerca il token nel database
    const { data: confirmation, error: findError } = await supabaseAdmin
      .from('email_confirmations')
      .select('*')
      .eq('token', token)
      .is('confirmed_at', null)
      .single();

    if (findError || !confirmation) {
      throw Errors.BadRequest('Token non valido o già utilizzato');
    }

    // Verifica scadenza
    if (new Date(confirmation.expires_at) < new Date()) {
      throw Errors.BadRequest('Token scaduto. Richiedi un nuovo link di conferma.');
    }

    // Conferma l'email in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      confirmation.user_id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error('Error confirming email in Supabase:', updateError);
      throw Errors.Internal('Errore nella conferma email');
    }

    // Segna il token come utilizzato
    await supabaseAdmin
      .from('email_confirmations')
      .update({ confirmed_at: new Date().toISOString() })
      .eq('id', confirmation.id);

    console.log(`[AUTH] Email confermata per user ${confirmation.user_id}`);

    // Invia webhook user.email_confirmed
    try {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(confirmation.user_id);
      if (userData?.user) {
        await webhookService.send('user.email_confirmed', {
          email: confirmation.email,
          fullName: userData.user.user_metadata?.full_name,
          userId: confirmation.user_id
        });
        console.log(`[AUTH] Webhook user.email_confirmed inviato per ${confirmation.email}`);
      }
    } catch (webhookError) {
      console.error(`[AUTH] Webhook user.email_confirmed fallito:`, webhookError.message);
    }

    return {
      success: true,
      email: confirmation.email,
      userId: confirmation.user_id
    };
  }

  /**
   * Rinvia l'email di verifica generando un nuovo token
   * @param {string} email - Email dell'utente
   */
  async resendVerificationEmail(email) {
    // Trova l'utente
    const user = await this.getUserByEmail(email);

    // Verifica se l'email è già confermata
    if (user.email_confirmed_at) {
      throw Errors.BadRequest('Email già confermata');
    }

    // Genera nuovo token
    const token = await this.createEmailConfirmationToken(user.id, email);
    const backendUrl = process.env.BACKEND_URL || 'https://doid-suite-e9i5o.ondigitalocean.app';
    const confirmationUrl = `${backendUrl}/api/auth/verify-email/${token}`;

    // Invia webhook per reinviare email
    try {
      await webhookService.send('user.resend_verification', {
        email,
        fullName: user.user_metadata?.full_name,
        confirmationUrl
      });
      console.log(`[AUTH] Webhook user.resend_verification inviato per ${email}`);
    } catch (webhookError) {
      console.error(`[AUTH] Webhook user.resend_verification fallito:`, webhookError.message);
      throw Errors.Internal('Errore nell\'invio dell\'email di verifica');
    }

    return { success: true };
  }
}

export default new AuthService();
