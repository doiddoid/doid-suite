import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { verifyExternalToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { supabaseAdmin } from '../config/supabase.js';
import authService from '../services/authService.js';

const router = express.Router();

// Validazione errori
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Errore di validazione',
      details: errors.array()
    });
  }
  next();
};

// POST /api/external/verify-token
// Verifica un token JWT per le app esterne
router.post('/verify-token',
  [
    body('token').notEmpty().withMessage('Token richiesto')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { token } = req.body;

    try {
      const decoded = authService.verifyExternalToken(token);

      // Ottieni i dettagli dell'organizzazione
      const { data: organization, error } = await supabaseAdmin
        .from('organizations')
        .select('id, name, slug, status')
        .eq('id', decoded.organizationId)
        .single();

      if (error || !organization || organization.status !== 'active') {
        return res.status(401).json({
          success: false,
          error: 'Organizzazione non valida o non attiva'
        });
      }

      // Ottieni i dettagli dell'utente
      const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(decoded.userId);

      if (userError || !user) {
        return res.status(401).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      res.json({
        success: true,
        data: {
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.user_metadata?.full_name
          },
          organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug
          },
          service: decoded.service,
          role: decoded.role
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message || 'Token non valido'
      });
    }
  })
);

// GET /api/external/organization/:uuid
// Ottieni informazioni sull'organizzazione per le app esterne
router.get('/organization/:uuid',
  [
    param('uuid').isUUID().withMessage('UUID organizzazione non valido')
  ],
  validate,
  verifyExternalToken,
  asyncHandler(async (req, res) => {
    const { uuid } = req.params;

    // Verifica che l'utente abbia accesso a questa organizzazione
    if (req.externalAuth.organizationId !== uuid) {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato a questa organizzazione'
      });
    }

    // Ottieni i dettagli completi dell'organizzazione
    const { data: organization, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', uuid)
      .single();

    if (error || !organization) {
      return res.status(404).json({
        success: false,
        error: 'Organizzazione non trovata'
      });
    }

    // Ottieni l'abbonamento attivo per il servizio richiesto
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        status,
        billing_cycle,
        trial_ends_at,
        current_period_end,
        plan:plans (
          id,
          code,
          name,
          features,
          service:services!inner (
            code
          )
        )
      `)
      .eq('organization_id', uuid)
      .eq('plan.service.code', req.externalAuth.service)
      .in('status', ['active', 'trial'])
      .single();

    res.json({
      success: true,
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          email: organization.email,
          phone: organization.phone,
          vatNumber: organization.vat_number,
          logoUrl: organization.logo_url
        },
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          planCode: subscription.plan?.code,
          planName: subscription.plan?.name,
          features: subscription.plan?.features,
          billingCycle: subscription.billing_cycle,
          trialEndsAt: subscription.trial_ends_at,
          currentPeriodEnd: subscription.current_period_end
        } : null,
        userRole: req.externalAuth.role
      }
    });
  })
);

// POST /api/external/webhook
// Webhook per ricevere eventi dalle app esterne
router.post('/webhook',
  verifyExternalToken,
  asyncHandler(async (req, res) => {
    const { event, data } = req.body;

    // Log dell'evento (in produzione salvare su tabella eventi)
    console.log('External webhook received:', {
      service: req.externalAuth.service,
      organizationId: req.externalAuth.organizationId,
      event,
      data
    });

    // Gestisci eventi specifici se necessario
    switch (event) {
      case 'subscription.usage':
        // Traccia l'utilizzo del servizio
        break;
      case 'user.action':
        // Traccia azioni utente
        break;
      default:
        // Evento generico
        break;
    }

    res.json({
      success: true,
      message: 'Evento ricevuto'
    });
  })
);

// POST /api/external/sso/authenticate
// SSO endpoint per app esterne - Valida token e restituisce dati completi per creare sessione
router.post('/sso/authenticate',
  [
    body('token').notEmpty().withMessage('Token richiesto'),
    body('service').notEmpty().withMessage('Codice servizio richiesto')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { token, service: requestedService } = req.body;

    try {
      // 1. Verifica il token JWT
      const decoded = authService.verifyExternalToken(token);

      // 2. Verifica che il servizio richiesto corrisponda
      if (decoded.service !== requestedService) {
        return res.status(403).json({
          success: false,
          error: 'Token non valido per questo servizio'
        });
      }

      // 3. Ottieni utente da Supabase Auth
      const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(decoded.userId);

      if (userError || !user) {
        return res.status(401).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      // 4. Ottieni attività (se presente nel token)
      let activity = null;
      if (decoded.activityId) {
        const { data: activityData } = await supabaseAdmin
          .from('activities')
          .select('id, name, slug, status, organization_id')
          .eq('id', decoded.activityId)
          .single();

        if (activityData && activityData.status === 'active') {
          activity = activityData;
        }
      }

      // 5. Ottieni organizzazione (opzionale - alcune attività non hanno organizzazione)
      let organization = null;
      if (decoded.organizationId) {
        const { data: orgData, error: orgError } = await supabaseAdmin
          .from('organizations')
          .select('id, name, slug, email, status, account_type')
          .eq('id', decoded.organizationId)
          .single();

        if (!orgError && orgData && orgData.status === 'active') {
          organization = orgData;
        }
      }

      // Se non c'è organizzazione ma c'è un'attività, usa i dati dell'attività
      if (!organization && !activity) {
        return res.status(401).json({
          success: false,
          error: 'Nessuna attività o organizzazione valida'
        });
      }

      // 6. Verifica abbonamento/licenza per il servizio
      let subscription = null;
      let licenseValid = false;
      let licenseExpiration = null;
      let planCode = null;
      let planFeatures = {};

      if (activity) {
        // Cerca abbonamento per attività
        const { data: sub } = await supabaseAdmin
          .from('subscriptions')
          .select(`
            id,
            status,
            trial_ends_at,
            current_period_end,
            plan:plans (
              id,
              code,
              name,
              features
            ),
            service:services!inner (
              code
            )
          `)
          .eq('activity_id', activity.id)
          .eq('service.code', requestedService)
          .in('status', ['active', 'trial'])
          .single();

        if (sub) {
          const now = new Date();
          const expiresAt = sub.status === 'trial'
            ? new Date(sub.trial_ends_at)
            : new Date(sub.current_period_end);

          licenseValid = expiresAt > now;
          licenseExpiration = expiresAt.toISOString();
          planCode = sub.plan?.code;
          planFeatures = sub.plan?.features || {};

          subscription = {
            id: sub.id,
            status: sub.status,
            planCode: sub.plan?.code,
            planName: sub.plan?.name,
            features: sub.plan?.features,
            expiresAt: licenseExpiration
          };
        }
      }

      // 7. Se non ha abbonamento diretto, verifica pacchetto organizzazione (solo se ha org)
      if (!subscription && activity && organization) {
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
                service:services (code),
                plan:plans (code, name, features)
              )
            )
          `)
          .eq('organization_id', organization.id)
          .in('status', ['active', 'trial']);

        if (orgPackages) {
          for (const pkg of orgPackages) {
            const matchingService = pkg.package?.services?.find(
              s => s.service?.code === requestedService
            );

            if (matchingService) {
              const now = new Date();
              const expiresAt = pkg.status === 'trial'
                ? new Date(pkg.trial_ends_at)
                : new Date(pkg.current_period_end);

              if (expiresAt > now) {
                licenseValid = true;
                licenseExpiration = expiresAt.toISOString();
                planCode = matchingService.plan?.code;
                planFeatures = matchingService.plan?.features || {};

                subscription = {
                  id: pkg.id,
                  status: pkg.status,
                  inherited: true,
                  packageName: pkg.package?.name,
                  planCode: matchingService.plan?.code,
                  planName: matchingService.plan?.name,
                  features: matchingService.plan?.features,
                  expiresAt: licenseExpiration
                };
                break;
              }
            }
          }
        }
      }

      // 8. Genera token sidebar per l'app esterna (lunga durata)
      const sidebarToken = authService.generateSidebarToken({
        userId: user.id,
        organizationId: organization?.id || null,
        activityId: activity?.id,
        service: requestedService,
        role: decoded.role
      });

      // 9. Ottieni tutte le attività dell'utente per la sidebar
      let userActivities = [];
      const { data: activityUsers } = await supabaseAdmin
        .from('activity_users')
        .select(`
          role,
          activity:activities (
            id,
            name,
            slug,
            status,
            organization_id
          )
        `)
        .eq('user_id', user.id);

      if (activityUsers) {
        userActivities = activityUsers
          .filter(au => au.activity && au.activity.status === 'active')
          .map(au => ({
            id: au.activity.id,
            name: au.activity.name,
            slug: au.activity.slug,
            role: au.role
          }));
      }

      // 10. Ottieni gli abbonamenti attivi dell'utente per tutti i servizi
      let userSubscriptions = [];
      if (activity) {
        const { data: subs } = await supabaseAdmin
          .from('subscriptions')
          .select(`
            id,
            status,
            service:services (
              code,
              name
            )
          `)
          .eq('activity_id', activity.id)
          .in('status', ['active', 'trial']);

        if (subs) {
          userSubscriptions = subs.map(s => ({
            serviceCode: s.service?.code,
            serviceName: s.service?.name,
            status: s.status
          }));
        }
      }

      // 11. Restituisci dati completi per SSO
      res.json({
        success: true,
        data: {
          // Dati utente per creare/aggiornare utente locale
          user: {
            id: user.id,                              // UUID Supabase - usare come chiave
            email: user.email,
            fullName: user.user_metadata?.full_name || null,
            avatarUrl: user.user_metadata?.avatar_url || null,
            emailVerified: user.email_confirmed_at !== null,
            createdAt: user.created_at
          },
          // Dati organizzazione (può essere null per attività standalone)
          organization: organization ? {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            accountType: organization.account_type
          } : null,
          // Dati attività (se presente)
          activity: activity ? {
            id: activity.id,
            name: activity.name,
            slug: activity.slug
          } : null,
          // Lista attività utente per sidebar
          activities: userActivities,
          // Dati licenza/abbonamento per il servizio richiesto
          license: {
            isValid: licenseValid,
            expiresAt: licenseExpiration,
            planCode: planCode,
            features: planFeatures,
            subscription: subscription,
            // Tutti gli abbonamenti attivi per la sidebar
            subscriptions: userSubscriptions
          },
          // Ruolo utente nell'organizzazione/attività
          role: decoded.role,
          // Servizio richiesto
          service: requestedService,
          // Token sidebar per l'app esterna (24h)
          sidebarToken: sidebarToken,
          // Timestamp per audit
          authenticatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('SSO authentication error:', error);
      res.status(401).json({
        success: false,
        error: error.message || 'Autenticazione SSO fallita'
      });
    }
  })
);

// POST /api/external/service-account/unlink
// Rimuove il collegamento tra un account servizio esterno e un'attività Suite
// Chiamato dai servizi esterni quando un account viene eliminato
router.post('/service-account/unlink',
  [
    body('service_code').notEmpty().withMessage('Codice servizio richiesto'),
    body('external_account_id').notEmpty().withMessage('ID account esterno richiesto')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { service_code, activity_id, external_account_id } = req.body;

    try {
      // Costruisci la query base
      let query = supabaseAdmin
        .from('activity_service_accounts')
        .delete()
        .eq('service_code', service_code)
        .eq('external_account_id', external_account_id);

      // Se è fornito anche l'activity_id, aggiungilo al filtro
      if (activity_id) {
        query = query.eq('activity_id', activity_id);
      }

      const { error } = await query;

      if (error) {
        console.error('Error unlinking service account:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore durante la rimozione del collegamento'
        });
      }

      console.log(`Service account unlinked: ${service_code} - ${external_account_id}`);

      res.json({
        success: true,
        message: 'Collegamento rimosso con successo'
      });

    } catch (error) {
      console.error('Service account unlink error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Errore durante la rimozione del collegamento'
      });
    }
  })
);

export default router;
