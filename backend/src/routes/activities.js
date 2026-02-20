import express from 'express';
import { body, param, validationResult } from 'express-validator';
import activityService from '../services/activityService.js';
import subscriptionService from '../services/subscriptionService.js';
import serviceService from '../services/serviceService.js';
import authService from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';
import { loadActivity, requireActivityAccess, requireActivityRole } from '../middleware/activity.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { SERVICES } from '../config/services.js';

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

// Tutte le route richiedono autenticazione
router.use(authenticate);

// ==================== ACTIVITY CRUD ====================

// GET /api/activities/limits
// Ottieni limiti creazione attività per utente corrente
router.get('/limits',
  asyncHandler(async (req, res) => {
    const limits = await activityService.getUserActivityLimits(req.user.id);

    res.json({
      success: true,
      data: { limits }
    });
  })
);

// GET /api/activities
// Lista attività dell'utente corrente
router.get('/',
  asyncHandler(async (req, res) => {
    const activities = await activityService.getUserActivities(req.user.id);

    res.json({
      success: true,
      data: { activities }
    });
  })
);

// POST /api/activities
// Crea nuova attività
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Nome attività richiesto'),
    body('email').optional().isEmail().withMessage('Email non valida'),
    body('phone').optional().trim(),
    body('vatNumber').optional().trim(),
    body('address').optional().trim(),
    body('city').optional().trim()
  ],
  validate,
  asyncHandler(async (req, res) => {
    const activity = await activityService.createActivity(req.user.id, req.body);

    res.status(201).json({
      success: true,
      data: { activity },
      message: 'Attività creata con successo'
    });
  })
);

// GET /api/activities/:activityId
// Dettaglio attività
router.get('/:activityId',
  [
    param('activityId').isUUID().withMessage('ID attività non valido')
  ],
  validate,
  loadActivity,
  requireActivityAccess,
  asyncHandler(async (req, res) => {
    const activity = activityService.formatActivity(req.activity, req.activityRole);

    res.json({
      success: true,
      data: { activity }
    });
  })
);

// PUT /api/activities/:activityId
// Aggiorna attività
router.put('/:activityId',
  [
    param('activityId').isUUID().withMessage('ID attività non valido'),
    body('name').optional().trim().notEmpty().withMessage('Nome non può essere vuoto'),
    body('email').optional().isEmail().withMessage('Email non valida'),
    body('phone').optional().trim(),
    body('vatNumber').optional().trim(),
    body('address').optional().trim(),
    body('city').optional().trim(),
    body('logoUrl').optional().trim()
  ],
  validate,
  loadActivity,
  requireActivityRole(['owner', 'admin']),
  asyncHandler(async (req, res) => {
    const activity = await activityService.updateActivity(
      req.params.activityId,
      req.user.id,
      req.body
    );

    res.json({
      success: true,
      data: { activity },
      message: 'Attività aggiornata con successo'
    });
  })
);

// DELETE /api/activities/:activityId
// Elimina (disattiva) attività
router.delete('/:activityId',
  [
    param('activityId').isUUID().withMessage('ID attività non valido')
  ],
  validate,
  loadActivity,
  requireActivityRole(['owner']),
  asyncHandler(async (req, res) => {
    await activityService.deleteActivity(req.params.activityId, req.user.id);

    res.json({
      success: true,
      message: 'Attività eliminata con successo'
    });
  })
);

// ==================== ACTIVITY MEMBERS ====================

// GET /api/activities/:activityId/members
// Lista membri dell'attività
router.get('/:activityId/members',
  [
    param('activityId').isUUID().withMessage('ID attività non valido')
  ],
  validate,
  loadActivity,
  requireActivityAccess,
  asyncHandler(async (req, res) => {
    const members = await activityService.getActivityMembers(req.params.activityId);

    res.json({
      success: true,
      data: { members }
    });
  })
);

// POST /api/activities/:activityId/members
// Aggiungi membro all'attività
router.post('/:activityId/members',
  [
    param('activityId').isUUID().withMessage('ID attività non valido'),
    body('email').isEmail().withMessage('Email non valida'),
    body('role').isIn(['admin', 'user']).withMessage('Ruolo non valido')
  ],
  validate,
  loadActivity,
  requireActivityRole(['owner', 'admin']),
  asyncHandler(async (req, res) => {
    const member = await activityService.addMember(
      req.params.activityId,
      req.body.email,
      req.body.role,
      req.user.id
    );

    res.status(201).json({
      success: true,
      data: { member },
      message: 'Membro aggiunto con successo'
    });
  })
);

// DELETE /api/activities/:activityId/members/:memberId
// Rimuovi membro dall'attività
router.delete('/:activityId/members/:memberId',
  [
    param('activityId').isUUID().withMessage('ID attività non valido'),
    param('memberId').isUUID().withMessage('ID membro non valido')
  ],
  validate,
  loadActivity,
  requireActivityRole(['owner', 'admin']),
  asyncHandler(async (req, res) => {
    await activityService.removeMember(
      req.params.activityId,
      req.params.memberId,
      req.user.id
    );

    res.json({
      success: true,
      message: 'Membro rimosso con successo'
    });
  })
);

// ==================== ACTIVITY SUBSCRIPTIONS ====================

// GET /api/activities/:activityId/subscriptions
// Lista abbonamenti dell'attività
router.get('/:activityId/subscriptions',
  [
    param('activityId').isUUID().withMessage('ID attività non valido')
  ],
  validate,
  loadActivity,
  requireActivityAccess,
  asyncHandler(async (req, res) => {
    const subscriptions = await subscriptionService.getActivitySubscriptions(req.params.activityId);

    res.json({
      success: true,
      data: { subscriptions }
    });
  })
);

// GET /api/activities/:activityId/subscriptions/dashboard
// Dashboard con tutti i servizi e stato abbonamento
router.get('/:activityId/subscriptions/dashboard',
  [
    param('activityId').isUUID().withMessage('ID attività non valido')
  ],
  validate,
  loadActivity,
  requireActivityAccess,
  asyncHandler(async (req, res) => {
    const services = await subscriptionService.getActivityServicesWithStatus(req.params.activityId);

    // Super admin bypass: può accedere a tutti i servizi con subscription
    if (req.user?.isSuperAdmin) {
      services.forEach(s => {
        if (s.subscription) {
          s.canAccess = true;
        }
      });
    }

    res.json({
      success: true,
      data: { services }
    });
  })
);

// GET /api/activities/:activityId/subscriptions/stats
// Statistiche abbonamenti attività
router.get('/:activityId/subscriptions/stats',
  [
    param('activityId').isUUID().withMessage('ID attività non valido')
  ],
  validate,
  loadActivity,
  requireActivityAccess,
  asyncHandler(async (req, res) => {
    const stats = await subscriptionService.getActivityDashboardStats(req.params.activityId);

    res.json({
      success: true,
      data: { stats }
    });
  })
);

// POST /api/activities/:activityId/subscriptions/trial
// Attiva trial per un servizio
router.post('/:activityId/subscriptions/trial',
  [
    param('activityId').isUUID().withMessage('ID attività non valido'),
    body('serviceCode').isString().trim().notEmpty().withMessage('Codice servizio richiesto')
  ],
  validate,
  loadActivity,
  requireActivityRole(['owner', 'admin']),
  asyncHandler(async (req, res) => {
    const subscription = await subscriptionService.activateTrial(
      req.params.activityId,
      req.body.serviceCode,
      req.user.id // Passa userId per webhook service.trial_activated
    );

    res.status(201).json({
      success: true,
      data: { subscription },
      message: 'Trial attivato con successo'
    });
  })
);

// POST /api/activities/:activityId/subscriptions/activate
// Attiva abbonamento
router.post('/:activityId/subscriptions/activate',
  [
    param('activityId').isUUID().withMessage('ID attività non valido'),
    body('serviceCode').isString().trim().notEmpty().withMessage('Codice servizio richiesto'),
    body('planCode').isString().trim().notEmpty().withMessage('Codice piano richiesto'),
    body('billingCycle').optional().isIn(['monthly', 'yearly']).withMessage('Ciclo fatturazione non valido')
  ],
  validate,
  loadActivity,
  requireActivityRole(['owner', 'admin']),
  asyncHandler(async (req, res) => {
    const { serviceCode, planCode, billingCycle } = req.body;

    const subscription = await subscriptionService.activateSubscription(
      req.params.activityId,
      serviceCode,
      planCode,
      billingCycle || 'monthly'
    );

    res.status(201).json({
      success: true,
      data: { subscription },
      message: 'Abbonamento attivato con successo'
    });
  })
);

// POST /api/activities/:activityId/subscriptions/cancel
// Cancella abbonamento
router.post('/:activityId/subscriptions/cancel',
  [
    param('activityId').isUUID().withMessage('ID attività non valido'),
    body('serviceCode').isString().trim().notEmpty().withMessage('Codice servizio richiesto')
  ],
  validate,
  loadActivity,
  requireActivityRole(['owner', 'admin']),
  asyncHandler(async (req, res) => {
    await subscriptionService.cancelSubscription(
      req.params.activityId,
      req.body.serviceCode
    );

    res.json({
      success: true,
      message: 'Abbonamento cancellato con successo'
    });
  })
);

// GET /api/activities/:activityId/subscriptions/check/:serviceCode
// Verifica stato abbonamento per servizio
router.get('/:activityId/subscriptions/check/:serviceCode',
  [
    param('activityId').isUUID().withMessage('ID attività non valido'),
    param('serviceCode').isString().trim().notEmpty().withMessage('Codice servizio richiesto')
  ],
  validate,
  loadActivity,
  requireActivityAccess,
  asyncHandler(async (req, res) => {
    const status = await subscriptionService.checkSubscriptionStatus(
      req.params.activityId,
      req.params.serviceCode
    );

    res.json({
      success: true,
      data: status
    });
  })
);

// ==================== EXTERNAL APP ACCESS ====================

// POST /api/activities/:activityId/generate-token
// Genera token JWT per accesso a app esterna (Smart Review, Menu Digitale, etc.)
router.post('/:activityId/generate-token',
  [
    param('activityId').isUUID().withMessage('ID attività non valido'),
    body('serviceCode').isString().trim().notEmpty().withMessage('Codice servizio richiesto')
  ],
  validate,
  loadActivity,
  requireActivityAccess,
  asyncHandler(async (req, res) => {
    const { serviceCode } = req.body;
    const activityId = req.params.activityId;

    // Verifica che il servizio esista
    if (!SERVICES[serviceCode]) {
      return res.status(400).json({
        success: false,
        error: 'Codice servizio non valido'
      });
    }

    // Verifica abbonamento attivo per il servizio
    const services = await subscriptionService.getActivityServicesWithStatus(activityId);
    const service = services.find(s => s.service.code === serviceCode);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servizio non trovato'
      });
    }

    // Verifica che l'attività abbia un abbonamento attivo per il servizio
    // Permette accesso sia se canAccess=true, sia se isActive=true (per configurare account non collegato)
    // Super admin bypass: può accedere anche senza abbonamento attivo
    const isSuperAdminUser = req.user.isSuperAdmin;
    const hasSubscription = service.subscription !== null;

    if (!service.canAccess && !service.isActive && !isSuperAdminUser) {
      return res.status(403).json({
        success: false,
        error: 'Nessun abbonamento attivo per questo servizio'
      });
    }

    // Per super admin senza subscription attiva, verifica almeno che esista una subscription
    if (isSuperAdminUser && !service.canAccess && !service.isActive && !hasSubscription) {
      return res.status(403).json({
        success: false,
        error: 'Nessuna subscription trovata per questo servizio'
      });
    }

    // Genera token per l'app esterna includendo activityId
    const token = authService.generateExternalToken({
      userId: req.user.id,
      organizationId: req.activity.organization_id,
      activityId: activityId,
      service: serviceCode,
      role: req.activityRole,
      adminAccess: isSuperAdminUser,
      adminEmail: isSuperAdminUser ? req.user.email : undefined
    });

    // URL di redirect con token
    const appUrl = SERVICES[serviceCode].appUrl;
    const redirectUrl = `${appUrl}/auth/sso.php?token=${token}`;

    res.json({
      success: true,
      data: {
        token,
        redirectUrl,
        expiresIn: 300, // 5 minuti
        service: {
          code: serviceCode,
          name: SERVICES[serviceCode].name,
          appUrl: appUrl
        }
      }
    });
  })
);

// ==================== CHECKOUT / PAYMENT ====================

// POST /api/activities/:activityId/checkout
// Genera URL per checkout GHL
router.post('/:activityId/checkout',
  [
    param('activityId').isUUID().withMessage('ID attività non valido'),
    body('serviceCode').isString().trim().notEmpty().withMessage('Codice servizio richiesto'),
    body('billingCycle').optional().isIn(['monthly', 'yearly']).withMessage('Ciclo fatturazione non valido')
  ],
  validate,
  loadActivity,
  requireActivityAccess,
  asyncHandler(async (req, res) => {
    const { serviceCode, billingCycle = 'monthly' } = req.body;
    const activityId = req.params.activityId;

    // Verifica che il servizio esista
    const service = await serviceService.getServiceByCode(serviceCode);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servizio non trovato'
      });
    }

    // Mappa servizio + ciclo → Payment Link GHL
    const paymentLinks = {
      smart_review: {
        monthly: process.env.GHL_PAYMENT_LINK_SMART_REVIEW_MONTHLY,
        yearly: process.env.GHL_PAYMENT_LINK_SMART_REVIEW_YEARLY
      },
      smart_page: {
        monthly: process.env.GHL_PAYMENT_LINK_SMART_PAGE_MONTHLY,
        yearly: process.env.GHL_PAYMENT_LINK_SMART_PAGE_YEARLY
      },
      menu_digitale: {
        monthly: process.env.GHL_PAYMENT_LINK_MENU_DIGITALE_MONTHLY,
        yearly: process.env.GHL_PAYMENT_LINK_MENU_DIGITALE_YEARLY
      },
      display_suite: {
        monthly: process.env.GHL_PAYMENT_LINK_DISPLAY_SUITE_MONTHLY,
        yearly: process.env.GHL_PAYMENT_LINK_DISPLAY_SUITE_YEARLY
      }
    };

    const paymentLink = paymentLinks[serviceCode]?.[billingCycle];

    if (!paymentLink) {
      return res.status(400).json({
        success: false,
        error: 'Link di pagamento non configurato per questo servizio',
        details: { serviceCode, billingCycle }
      });
    }

    // Costruisci URL con parametri pre-compilati
    // GHL accetta alcuni parametri via query string per pre-fill
    const checkoutUrl = new URL(paymentLink);

    // Pre-compila email (GHL usa 'email' come parametro)
    if (req.user.email) {
      checkoutUrl.searchParams.set('email', req.user.email);
    }

    // Pre-compila nome (se disponibile)
    const fullName = req.user.user_metadata?.full_name || '';
    if (fullName) {
      const [firstName, ...lastNameParts] = fullName.split(' ');
      if (firstName) {
        checkoutUrl.searchParams.set('first_name', firstName);
      }
      if (lastNameParts.length > 0) {
        checkoutUrl.searchParams.set('last_name', lastNameParts.join(' '));
      }
    }

    // Prezzi per riferimento
    const prices = {
      smart_review: { monthly: 9.90, yearly: 99.00 },
      smart_page: { monthly: 6.90, yearly: 69.00 },
      menu_digitale: { monthly: 9.90, yearly: 99.00 },
      display_suite: { monthly: 14.90, yearly: 149.00 }
    };

    res.json({
      success: true,
      data: {
        checkoutUrl: checkoutUrl.toString(),
        service: {
          code: serviceCode,
          name: service.name
        },
        billing: {
          cycle: billingCycle,
          price: prices[serviceCode]?.[billingCycle] || 0,
          currency: 'EUR'
        }
      }
    });
  })
);

// GET /api/activities/:activityId/checkout/status
// Verifica stato dopo checkout (chiamato dal frontend dopo redirect)
router.get('/:activityId/checkout/status',
  [
    param('activityId').isUUID().withMessage('ID attività non valido')
  ],
  validate,
  loadActivity,
  requireActivityAccess,
  asyncHandler(async (req, res) => {
    const activityId = req.params.activityId;

    // Ottieni tutti i servizi con stato
    const services = await subscriptionService.getActivityServicesWithStatus(activityId);

    // Trova servizi attivi (non in trial)
    const activeSubscriptions = services
      .filter(s => s.subscription?.status === 'active')
      .map(s => ({
        service: s.service.code,
        serviceName: s.service.name,
        status: s.subscription.status,
        billingCycle: s.subscription.billingCycle,
        currentPeriodEnd: s.subscription.currentPeriodEnd
      }));

    res.json({
      success: true,
      data: {
        activityId,
        activeSubscriptions,
        hasActiveSubscription: activeSubscriptions.length > 0
      }
    });
  })
);

// ==================== PAYMENTS / INVOICES ====================

// GET /api/activities/:activityId/payments
// Lista pagamenti/fatture per attività
router.get('/:activityId/payments',
  [
    param('activityId').isUUID().withMessage('ID attività non valido')
  ],
  validate,
  loadActivity,
  requireActivityAccess,
  asyncHandler(async (req, res) => {
    const activityId = req.params.activityId;
    const { limit = 20, offset = 0 } = req.query;

    const { data: payments, error, count } = await req.supabase
      .from('payment_transactions')
      .select('*', { count: 'exact' })
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error('Error fetching payments:', error);
      return res.status(500).json({
        success: false,
        error: 'Errore nel recupero dei pagamenti'
      });
    }

    // Format payments for frontend
    const formattedPayments = (payments || []).map(p => ({
      id: p.id,
      date: p.created_at,
      description: `${p.service_code?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${p.billing_cycle === 'yearly' ? 'Annuale' : 'Mensile'}`,
      amount: p.amount,
      currency: p.currency || 'EUR',
      status: p.status,
      transactionId: p.transaction_id,
      paymentMethod: p.payment_method,
      source: p.source
    }));

    res.json({
      success: true,
      data: {
        payments: formattedPayments,
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  })
);

// ==================== BILLING PROFILE ====================

// GET /api/activities/billing-profile
// Ottieni profilo fatturazione utente
router.get('/billing-profile/me',
  asyncHandler(async (req, res) => {
    const { data: profile, error } = await req.supabase
      .from('billing_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching billing profile:', error);
      return res.status(500).json({
        success: false,
        error: 'Errore nel recupero del profilo fatturazione'
      });
    }

    // Format for frontend
    const formattedProfile = profile ? {
      id: profile.id,
      billingType: profile.billing_type,
      companyName: profile.company_name,
      vatNumber: profile.vat_number,
      fiscalCode: profile.fiscal_code,
      addressLine1: profile.address_line1,
      addressLine2: profile.address_line2,
      city: profile.city,
      province: profile.province,
      postalCode: profile.postal_code,
      country: profile.country,
      billingEmail: profile.billing_email,
      phone: profile.phone,
      pecEmail: profile.pec_email,
      sdiCode: profile.sdi_code,
      useOrganizationData: false
    } : null;

    res.json({
      success: true,
      data: { billingProfile: formattedProfile }
    });
  })
);

// PUT /api/activities/billing-profile
// Aggiorna/crea profilo fatturazione utente
router.put('/billing-profile/me',
  [
    body('billingType').optional().isIn(['personal', 'business']),
    body('companyName').optional().trim(),
    body('vatNumber').optional({ values: 'falsy' }).trim()
      .matches(/^\d{11}$/).withMessage('Partita IVA deve essere di 11 cifre'),
    body('fiscalCode').optional({ values: 'falsy' }).trim()
      .matches(/^[A-Z0-9]{16}$/i).withMessage('Codice fiscale deve essere di 16 caratteri'),
    body('addressLine1').optional().trim(),
    body('addressLine2').optional().trim(),
    body('city').optional().trim(),
    body('province').optional({ values: 'falsy' }).trim().toUpperCase()
      .isLength({ min: 2, max: 2 }).withMessage('Provincia deve essere di 2 lettere'),
    body('postalCode').optional({ values: 'falsy' }).trim()
      .matches(/^\d{5}$/).withMessage('CAP deve essere di 5 cifre'),
    body('country').optional().trim(),
    body('billingEmail').optional({ values: 'falsy' }).isEmail(),
    body('phone').optional().trim(),
    body('pecEmail').optional({ values: 'falsy' }).isEmail(),
    body('sdiCode').optional({ values: 'falsy' }).trim()
      .matches(/^[A-Z0-9]{7}$/i).withMessage('Codice SDI deve essere di 7 caratteri')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Map camelCase to snake_case
    const profileData = {
      user_id: userId,
      billing_type: req.body.billingType || 'personal',
      company_name: req.body.companyName || null,
      vat_number: req.body.vatNumber || null,
      fiscal_code: req.body.fiscalCode || null,
      address_line1: req.body.addressLine1 || null,
      address_line2: req.body.addressLine2 || null,
      city: req.body.city || null,
      province: req.body.province || null,
      postal_code: req.body.postalCode || null,
      country: req.body.country || 'IT',
      billing_email: req.body.billingEmail || null,
      phone: req.body.phone || null,
      pec_email: req.body.pecEmail || null,
      sdi_code: req.body.sdiCode || null,
      is_default: true
    };

    // Upsert: insert or update if exists
    const { data: profile, error } = await req.supabase
      .from('billing_profiles')
      .upsert(profileData, {
        onConflict: 'user_id,is_default',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving billing profile:', error);
      return res.status(500).json({
        success: false,
        error: 'Errore nel salvataggio del profilo fatturazione'
      });
    }

    res.json({
      success: true,
      data: { billingProfile: profile },
      message: 'Profilo fatturazione aggiornato'
    });
  })
);

// ==================== SERVICES (public, no activity needed) ====================

// GET /api/activities/services/all
// Lista tutti i servizi disponibili (con piani)
router.get('/services/all',
  asyncHandler(async (req, res) => {
    const services = await serviceService.getAllServicesWithPlans();

    res.json({
      success: true,
      data: { services }
    });
  })
);

export default router;
