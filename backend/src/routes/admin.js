import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import adminService from '../services/adminService.js';
import packageService from '../services/packageService.js';
import { authenticate } from '../middleware/auth.js';
import { requireSuperAdmin, logAdminAction } from '../middleware/adminAuth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { supabaseAdmin } from '../config/supabase.js';

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

// Tutte le route admin richiedono autenticazione + super admin
router.use(authenticate);
router.use(requireSuperAdmin);

// ==================== STATS ====================

// GET /api/admin/stats
router.get('/stats',
  logAdminAction('view_global_stats'),
  asyncHandler(async (req, res) => {
    const stats = await adminService.getGlobalStats();

    res.json({
      success: true,
      data: stats
    });
  })
);

// GET /api/admin/activity
router.get('/activity',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit deve essere tra 1 e 100')
  ],
  validate,
  logAdminAction('view_recent_activity'),
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const activity = await adminService.getRecentActivity(limit);

    res.json({
      success: true,
      data: activity
    });
  })
);

// ==================== USERS ====================

// GET /api/admin/users
router.get('/users',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Pagina non valida'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit deve essere tra 1 e 100'),
    query('search').optional().trim()
  ],
  validate,
  logAdminAction('list_users'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = '' } = req.query;

    const result = await adminService.getAllUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search
    });

    res.json({
      success: true,
      data: result
    });
  })
);

// GET /api/admin/users/:id
router.get('/users/:id',
  [
    param('id').isUUID().withMessage('ID utente non valido')
  ],
  validate,
  logAdminAction('view_user'),
  asyncHandler(async (req, res) => {
    const user = await adminService.getUserById(req.params.id);

    res.json({
      success: true,
      data: user
    });
  })
);

// POST /api/admin/users
router.post('/users',
  [
    body('email').isEmail().withMessage('Email non valida'),
    body('password').optional().isLength({ min: 8 }).withMessage('Password deve essere almeno 8 caratteri'),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('fullName').optional().trim(),
    body('phone').optional().trim(),
    body('emailConfirm').optional().isBoolean().withMessage('emailConfirm deve essere boolean'),
    body('sendResetEmail').optional().isBoolean().withMessage('sendResetEmail deve essere boolean'),
    body('adminNotes').optional().trim()
  ],
  validate,
  logAdminAction('create_user'),
  asyncHandler(async (req, res) => {
    const {
      email,
      password,
      firstName,
      lastName,
      fullName,
      phone,
      emailConfirm = true,
      sendResetEmail = true,
      adminNotes
    } = req.body;

    // Determina il nome completo
    const resolvedFullName = fullName || (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || '');

    if (!resolvedFullName) {
      return res.status(400).json({
        success: false,
        error: 'Nome richiesto (fullName oppure firstName/lastName)'
      });
    }

    const user = await adminService.createUser({
      email,
      password, // Se non fornita, verrà generata automaticamente
      fullName: resolvedFullName,
      firstName,
      lastName,
      phone,
      emailConfirm,
      sendResetEmail,
      adminNotes,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'Utente creato con successo'
    });
  })
);

// PUT /api/admin/users/:id
router.put('/users/:id',
  [
    param('id').isUUID().withMessage('ID utente non valido'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email non valida'),
    body('password').optional({ checkFalsy: true }).isLength({ min: 8 }).withMessage('Password deve essere almeno 8 caratteri'),
    body('fullName').optional({ checkFalsy: true }).trim(),
    body('emailConfirm').optional().isBoolean().withMessage('emailConfirm deve essere boolean')
  ],
  validate,
  logAdminAction('update_user'),
  asyncHandler(async (req, res) => {
    const user = await adminService.updateUser(req.params.id, req.body);

    res.json({
      success: true,
      data: user,
      message: 'Utente aggiornato'
    });
  })
);

// DELETE /api/admin/users/:id
router.delete('/users/:id',
  [
    param('id').isUUID().withMessage('ID utente non valido')
  ],
  validate,
  logAdminAction('delete_user'),
  asyncHandler(async (req, res) => {
    // Previeni l'eliminazione di se stessi
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Non puoi eliminare il tuo stesso account'
      });
    }

    await adminService.deleteUser(req.params.id);

    res.json({
      success: true,
      message: 'Utente eliminato'
    });
  })
);

// ==================== ORGANIZATIONS ====================

// GET /api/admin/organizations
router.get('/organizations',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Pagina non valida'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit deve essere tra 1 e 100'),
    query('search').optional().trim(),
    query('status').optional().isIn(['active', 'suspended', 'cancelled']).withMessage('Status non valido'),
    query('accountType').optional().isIn(['single', 'agency']).withMessage('Tipo account non valido')
  ],
  validate,
  logAdminAction('list_organizations'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = '', status, accountType } = req.query;

    const result = await adminService.getAllOrganizations({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      accountType
    });

    res.json({
      success: true,
      data: result
    });
  })
);

// POST /api/admin/organizations
router.post('/organizations',
  [
    body('name').trim().notEmpty().withMessage('Nome richiesto'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email non valida'),
    body('phone').optional({ checkFalsy: true }).trim(),
    body('vatNumber').optional({ checkFalsy: true }).trim(),
    body('accountType').optional().isIn(['single', 'agency']).withMessage('Tipo account non valido'),
    body('maxActivities').optional().isInt({ min: -1 }).withMessage('Max attività deve essere >= -1'),
    body('ownerId').optional({ checkFalsy: true }).isUUID().withMessage('ID owner non valido'),
    body('ownerEmail').optional({ checkFalsy: true }).isEmail().withMessage('Email owner non valida'),
    body('createNewOwner').optional().isBoolean().withMessage('createNewOwner deve essere boolean'),
    body('newOwnerEmail').optional({ checkFalsy: true }).isEmail().withMessage('Email nuovo owner non valida'),
    body('newOwnerPassword').optional({ checkFalsy: true }).isLength({ min: 8 }).withMessage('Password deve essere almeno 8 caratteri'),
    body('newOwnerName').optional({ checkFalsy: true }).trim()
  ],
  validate,
  logAdminAction('create_organization'),
  asyncHandler(async (req, res) => {
    const organization = await adminService.createOrganization(req.body);

    res.status(201).json({
      success: true,
      data: organization,
      message: 'Organizzazione creata con successo'
    });
  })
);

// GET /api/admin/organizations/:id
router.get('/organizations/:id',
  [
    param('id').isUUID().withMessage('ID organizzazione non valido')
  ],
  validate,
  logAdminAction('view_organization'),
  asyncHandler(async (req, res) => {
    const organization = await adminService.getOrganizationById(req.params.id);

    res.json({
      success: true,
      data: organization
    });
  })
);

// PUT /api/admin/organizations/:id
router.put('/organizations/:id',
  [
    param('id').isUUID().withMessage('ID organizzazione non valido'),
    body('name').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Nome non può essere vuoto'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email non valida'),
    body('status').optional().isIn(['active', 'suspended', 'cancelled']).withMessage('Status non valido')
  ],
  validate,
  logAdminAction('update_organization'),
  asyncHandler(async (req, res) => {
    const organization = await adminService.updateOrganization(req.params.id, req.body);

    res.json({
      success: true,
      data: organization,
      message: 'Organizzazione aggiornata'
    });
  })
);

// DELETE /api/admin/organizations/:id
router.delete('/organizations/:id',
  [
    param('id').isUUID().withMessage('ID organizzazione non valido')
  ],
  validate,
  logAdminAction('delete_organization'),
  asyncHandler(async (req, res) => {
    await adminService.deleteOrganization(req.params.id);

    res.json({
      success: true,
      message: 'Organizzazione eliminata'
    });
  })
);

// ==================== PLANS SUMMARY ====================

// GET /api/admin/plans-summary
// Riepilogo piani attivi per cliente
router.get('/plans-summary',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Pagina non valida'),
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit deve essere tra 1 e 200'),
    query('status').optional().isIn(['trial', 'active', 'active_or_trial', 'expired', 'cancelled']).withMessage('Status non valido'),
    query('serviceCode').optional().trim(),
    query('search').optional().trim()
  ],
  validate,
  logAdminAction('view_plans_summary'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, status, serviceCode, search = '' } = req.query;

    const result = await adminService.getPlansSummary({
      page: parseInt(page),
      limit: parseInt(limit),
      status: status || 'active_or_trial',
      serviceCode,
      search
    });

    res.json({
      success: true,
      data: result
    });
  })
);

// ==================== SUBSCRIPTIONS ====================

// GET /api/admin/subscriptions
router.get('/subscriptions',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Pagina non valida'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit deve essere tra 1 e 100'),
    query('status').optional().isIn(['trial', 'active', 'past_due', 'cancelled', 'expired', 'suspended']).withMessage('Status non valido'),
    query('serviceCode').optional().trim()
  ],
  validate,
  logAdminAction('list_subscriptions'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, serviceCode } = req.query;

    const result = await adminService.getAllSubscriptions({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      serviceCode
    });

    res.json({
      success: true,
      data: result
    });
  })
);

// POST /api/admin/subscriptions
// Crea nuova subscription (per admin)
router.post('/subscriptions',
  [
    body('activityId').isUUID().withMessage('ID attività non valido'),
    body('serviceCode').isString().trim().notEmpty().withMessage('Codice servizio richiesto'),
    body('planCode').isString().trim().notEmpty().withMessage('Codice piano richiesto'),
    body('billingCycle').optional().isIn(['monthly', 'yearly']).withMessage('Ciclo fatturazione non valido'),
    body('status').optional().isIn(['trial', 'active']).withMessage('Status non valido')
  ],
  validate,
  logAdminAction('create_subscription'),
  asyncHandler(async (req, res) => {
    const { activityId, serviceCode, planCode, billingCycle = 'yearly', status = 'active' } = req.body;

    const subscription = await adminService.createSubscription({
      activityId,
      serviceCode,
      planCode,
      billingCycle,
      status
    });

    res.status(201).json({
      success: true,
      data: subscription,
      message: 'Abbonamento creato con successo'
    });
  })
);

// PUT /api/admin/subscriptions/:id
router.put('/subscriptions/:id',
  [
    param('id').isUUID().withMessage('ID abbonamento non valido'),
    body('status').optional().isIn(['trial', 'active', 'past_due', 'cancelled', 'expired', 'suspended']).withMessage('Status non valido'),
    body('billingCycle').optional().isIn(['monthly', 'yearly']).withMessage('Ciclo fatturazione non valido'),
    body('planId').optional().isUUID().withMessage('ID piano non valido')
  ],
  validate,
  logAdminAction('update_subscription'),
  asyncHandler(async (req, res) => {
    const subscription = await adminService.updateSubscription(req.params.id, req.body);

    res.json({
      success: true,
      data: subscription,
      message: 'Abbonamento aggiornato'
    });
  })
);

// ==================== ACTIVITIES ====================

// GET /api/admin/activities
router.get('/activities',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Pagina non valida'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit deve essere tra 1 e 100'),
    query('search').optional().trim(),
    query('status').optional().isIn(['active', 'suspended', 'cancelled']).withMessage('Status non valido'),
    query('organizationId').optional().isUUID().withMessage('ID organizzazione non valido')
  ],
  validate,
  logAdminAction('list_activities'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = '', status, organizationId } = req.query;

    const result = await adminService.getAllActivities({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      organizationId
    });

    res.json({
      success: true,
      data: result
    });
  })
);

// GET /api/admin/activities/:id
router.get('/activities/:id',
  [
    param('id').isUUID().withMessage('ID attività non valido')
  ],
  validate,
  logAdminAction('view_activity'),
  asyncHandler(async (req, res) => {
    const activity = await adminService.getActivityById(req.params.id);

    res.json({
      success: true,
      data: activity
    });
  })
);

// POST /api/admin/organizations/:organizationId/activities
router.post('/organizations/:organizationId/activities',
  [
    param('organizationId').isUUID().withMessage('ID organizzazione non valido'),
    body('name').trim().notEmpty().withMessage('Nome attività richiesto'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email non valida'),
    body('phone').optional({ checkFalsy: true }).trim(),
    body('ownerEmail').optional({ checkFalsy: true }).isEmail().withMessage('Email owner non valida')
  ],
  validate,
  logAdminAction('create_activity_for_org'),
  asyncHandler(async (req, res) => {
    const activity = await adminService.createActivityForOrganization(
      req.params.organizationId,
      req.body,
      req.body.ownerEmail
    );

    res.status(201).json({
      success: true,
      data: activity,
      message: 'Attività creata con successo'
    });
  })
);

// ==================== PACKAGES ====================

// GET /api/admin/packages
router.get('/packages',
  [
    query('includeInactive').optional().isBoolean().withMessage('includeInactive deve essere boolean')
  ],
  validate,
  logAdminAction('list_packages'),
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    const packages = await packageService.getAllPackages(includeInactive);

    res.json({
      success: true,
      data: { packages }
    });
  })
);

// GET /api/admin/packages/:id
router.get('/packages/:id',
  [
    param('id').isUUID().withMessage('ID pacchetto non valido')
  ],
  validate,
  logAdminAction('view_package'),
  asyncHandler(async (req, res) => {
    const pkg = await packageService.getPackageById(req.params.id);

    if (!pkg) {
      return res.status(404).json({
        success: false,
        error: 'Pacchetto non trovato'
      });
    }

    res.json({
      success: true,
      data: pkg
    });
  })
);

// POST /api/admin/packages
router.post('/packages',
  [
    body('code').trim().notEmpty().withMessage('Codice pacchetto richiesto'),
    body('name').trim().notEmpty().withMessage('Nome pacchetto richiesto'),
    body('description').optional().trim(),
    body('priceMonthly').isFloat({ min: 0 }).withMessage('Prezzo mensile non valido'),
    body('priceYearly').isFloat({ min: 0 }).withMessage('Prezzo annuale non valido'),
    body('maxActivities').optional().isInt({ min: -1 }).withMessage('Max attività non valido'),
    body('services').optional().isArray().withMessage('Services deve essere un array')
  ],
  validate,
  logAdminAction('create_package'),
  asyncHandler(async (req, res) => {
    const pkg = await packageService.createPackage(req.body);

    res.status(201).json({
      success: true,
      data: pkg,
      message: 'Pacchetto creato con successo'
    });
  })
);

// PUT /api/admin/packages/:id
router.put('/packages/:id',
  [
    param('id').isUUID().withMessage('ID pacchetto non valido'),
    body('name').optional().trim().notEmpty().withMessage('Nome non può essere vuoto'),
    body('description').optional().trim(),
    body('priceMonthly').optional().isFloat({ min: 0 }).withMessage('Prezzo mensile non valido'),
    body('priceYearly').optional().isFloat({ min: 0 }).withMessage('Prezzo annuale non valido'),
    body('maxActivities').optional().isInt({ min: -1 }).withMessage('Max attività non valido'),
    body('isActive').optional().isBoolean().withMessage('isActive deve essere boolean'),
    body('services').optional().isArray().withMessage('Services deve essere un array')
  ],
  validate,
  logAdminAction('update_package'),
  asyncHandler(async (req, res) => {
    const pkg = await packageService.updatePackage(req.params.id, req.body);

    res.json({
      success: true,
      data: pkg,
      message: 'Pacchetto aggiornato'
    });
  })
);

// DELETE /api/admin/packages/:id
router.delete('/packages/:id',
  [
    param('id').isUUID().withMessage('ID pacchetto non valido')
  ],
  validate,
  logAdminAction('delete_package'),
  asyncHandler(async (req, res) => {
    await packageService.deletePackage(req.params.id);

    res.json({
      success: true,
      message: 'Pacchetto disattivato'
    });
  })
);

// ==================== ORGANIZATION PACKAGES ====================

// GET /api/admin/organizations/:organizationId/packages
router.get('/organizations/:organizationId/packages',
  [
    param('organizationId').isUUID().withMessage('ID organizzazione non valido')
  ],
  validate,
  logAdminAction('list_org_packages'),
  asyncHandler(async (req, res) => {
    const packages = await packageService.getOrganizationPackages(req.params.organizationId);

    res.json({
      success: true,
      data: { packages }
    });
  })
);

// POST /api/admin/organizations/:organizationId/packages
router.post('/organizations/:organizationId/packages',
  [
    param('organizationId').isUUID().withMessage('ID organizzazione non valido'),
    body('packageCode').trim().notEmpty().withMessage('Codice pacchetto richiesto'),
    body('billingCycle').optional().isIn(['monthly', 'yearly']).withMessage('Ciclo fatturazione non valido')
  ],
  validate,
  logAdminAction('activate_org_package'),
  asyncHandler(async (req, res) => {
    const { packageCode, billingCycle } = req.body;

    const orgPackage = await packageService.activatePackageForOrganization(
      req.params.organizationId,
      packageCode,
      billingCycle || 'monthly'
    );

    res.status(201).json({
      success: true,
      data: orgPackage,
      message: 'Pacchetto attivato per l\'organizzazione'
    });
  })
);

// DELETE /api/admin/organizations/:organizationId/packages/:packageId
router.delete('/organizations/:organizationId/packages/:packageId',
  [
    param('organizationId').isUUID().withMessage('ID organizzazione non valido'),
    param('packageId').isUUID().withMessage('ID pacchetto non valido')
  ],
  validate,
  logAdminAction('cancel_org_package'),
  asyncHandler(async (req, res) => {
    await packageService.cancelOrganizationPackage(
      req.params.organizationId,
      req.params.packageId
    );

    res.json({
      success: true,
      message: 'Pacchetto cancellato per l\'organizzazione'
    });
  })
);

// ==================== SERVICES ====================

// GET /api/admin/services
router.get('/services',
  logAdminAction('list_services'),
  asyncHandler(async (req, res) => {
    const { data: services, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .order('sort_order');

    if (error) throw error;

    res.json({
      success: true,
      data: {
        services: services.map(s => ({
          id: s.id,
          code: s.code,
          name: s.name,
          description: s.description,
          appUrl: s.app_url,
          icon: s.icon,
          color: s.color,
          isActive: s.is_active,
          sortOrder: s.sort_order
        }))
      }
    });
  })
);

// PUT /api/admin/services/:id
router.put('/services/:id',
  [
    param('id').isUUID().withMessage('ID servizio non valido'),
    body('name').optional().trim().notEmpty().withMessage('Nome non può essere vuoto'),
    body('description').optional().trim(),
    body('appUrl').optional().isURL().withMessage('URL non valido'),
    body('icon').optional().trim(),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Colore deve essere esadecimale'),
    body('isActive').optional().isBoolean(),
    body('sortOrder').optional().isInt({ min: 0 })
  ],
  validate,
  logAdminAction('update_service'),
  asyncHandler(async (req, res) => {
    const { name, description, appUrl, icon, color, isActive, sortOrder } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (appUrl !== undefined) updateData.app_url = appUrl;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;

    const { data: service, error } = await supabaseAdmin
      .from('services')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: service,
      message: 'Servizio aggiornato'
    });
  })
);

// ==================== SERVICE PLANS ====================

// GET /api/admin/services/:serviceId/plans
router.get('/services/:serviceId/plans',
  [
    param('serviceId').isUUID().withMessage('ID servizio non valido')
  ],
  validate,
  logAdminAction('list_service_plans'),
  asyncHandler(async (req, res) => {
    const { data: plans, error } = await supabaseAdmin
      .from('plans')
      .select(`
        *,
        service:services(id, code, name)
      `)
      .eq('service_id', req.params.serviceId)
      .order('sort_order');

    if (error) throw error;

    res.json({
      success: true,
      data: {
        plans: plans.map(p => ({
          id: p.id,
          serviceId: p.service_id,
          service: p.service,
          code: p.code,
          name: p.name,
          priceMonthly: parseFloat(p.price_monthly || 0),
          priceYearly: parseFloat(p.price_yearly || 0),
          features: p.features || [],
          isActive: p.is_active,
          sortOrder: p.sort_order
        }))
      }
    });
  })
);

// GET /api/admin/plans (tutti i piani di tutti i servizi)
router.get('/plans',
  [
    query('includeInactive').optional().isBoolean()
  ],
  validate,
  logAdminAction('list_all_plans'),
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';

    let query = supabaseAdmin
      .from('plans')
      .select(`
        *,
        service:services(id, code, name, icon, color)
      `)
      .order('service_id')
      .order('sort_order');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: plans, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: {
        plans: plans.map(p => ({
          id: p.id,
          serviceId: p.service_id,
          service: p.service,
          code: p.code,
          name: p.name,
          priceMonthly: parseFloat(p.price_monthly || 0),
          priceYearly: parseFloat(p.price_yearly || 0),
          features: p.features || [],
          isActive: p.is_active,
          sortOrder: p.sort_order
        }))
      }
    });
  })
);

// POST /api/admin/plans
router.post('/plans',
  [
    body('serviceId').isUUID().withMessage('ID servizio richiesto'),
    body('code').trim().notEmpty().withMessage('Codice piano richiesto'),
    body('name').trim().notEmpty().withMessage('Nome piano richiesto'),
    body('priceMonthly').isFloat({ min: 0 }).withMessage('Prezzo mensile non valido'),
    body('priceYearly').isFloat({ min: 0 }).withMessage('Prezzo annuale non valido'),
    body('features').optional().custom((value) => {
      // Accetta sia array che oggetto (per limiti/configurazioni servizi)
      if (value === null || value === undefined) return true;
      if (Array.isArray(value)) return true;
      if (typeof value === 'object') return true;
      throw new Error('Features deve essere un array o un oggetto');
    }),
    body('sortOrder').optional().isInt({ min: 0 })
  ],
  validate,
  logAdminAction('create_plan'),
  asyncHandler(async (req, res) => {
    const { serviceId, code, name, priceMonthly, priceYearly, features, sortOrder } = req.body;

    // Verifica che il servizio esista
    const { data: service } = await supabaseAdmin
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .single();

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servizio non trovato'
      });
    }

    const { data: plan, error } = await supabaseAdmin
      .from('plans')
      .insert({
        service_id: serviceId,
        code,
        name,
        price_monthly: priceMonthly,
        price_yearly: priceYearly,
        features: features || [],
        sort_order: sortOrder || 0,
        is_active: true
      })
      .select(`
        *,
        service:services(id, code, name)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          error: 'Esiste già un piano con questo codice per questo servizio'
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      data: plan,
      message: 'Piano creato con successo'
    });
  })
);

// PUT /api/admin/plans/:id
router.put('/plans/:id',
  [
    param('id').isUUID().withMessage('ID piano non valido'),
    body('name').optional().trim().notEmpty().withMessage('Nome non può essere vuoto'),
    body('priceMonthly').optional().isFloat({ min: 0 }).withMessage('Prezzo mensile non valido'),
    body('priceYearly').optional().isFloat({ min: 0 }).withMessage('Prezzo annuale non valido'),
    body('features').optional().custom((value) => {
      // Accetta sia array che oggetto (per limiti/configurazioni servizi)
      if (value === null || value === undefined) return true;
      if (Array.isArray(value)) return true;
      if (typeof value === 'object') return true;
      throw new Error('Features deve essere un array o un oggetto');
    }),
    body('isActive').optional().isBoolean(),
    body('sortOrder').optional().isInt({ min: 0 })
  ],
  validate,
  logAdminAction('update_plan'),
  asyncHandler(async (req, res) => {
    const { name, priceMonthly, priceYearly, features, isActive, sortOrder } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (priceMonthly !== undefined) updateData.price_monthly = priceMonthly;
    if (priceYearly !== undefined) updateData.price_yearly = priceYearly;
    if (features !== undefined) updateData.features = features;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;

    const { data: plan, error } = await supabaseAdmin
      .from('plans')
      .update(updateData)
      .eq('id', req.params.id)
      .select(`
        *,
        service:services(id, code, name)
      `)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: plan,
      message: 'Piano aggiornato'
    });
  })
);

// DELETE /api/admin/plans/:id (soft delete - disattiva)
router.delete('/plans/:id',
  [
    param('id').isUUID().withMessage('ID piano non valido')
  ],
  validate,
  logAdminAction('delete_plan'),
  asyncHandler(async (req, res) => {
    // Non eliminiamo ma disattiviamo
    const { error } = await supabaseAdmin
      .from('plans')
      .update({ is_active: false })
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Piano disattivato'
    });
  })
);

// ==================== ADMIN ACCESS TO SERVICES ====================

// POST /api/admin/access-service
// Genera token SSO per accedere al servizio di qualsiasi utente/attività
router.post('/access-service',
  [
    body('userId').isUUID().withMessage('ID utente richiesto'),
    body('activityId').isUUID().withMessage('ID attività richiesto'),
    body('serviceCode').trim().notEmpty().withMessage('Codice servizio richiesto')
  ],
  validate,
  logAdminAction('admin_access_service'),
  asyncHandler(async (req, res) => {
    const { userId, activityId, serviceCode } = req.body;

    // Verifica che il servizio esista
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('code', serviceCode)
      .eq('is_active', true)
      .single();

    if (serviceError || !service) {
      return res.status(404).json({
        success: false,
        error: 'Servizio non trovato'
      });
    }

    // Verifica che l'utente esista
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError || !authUser?.user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Verifica che l'attività esista
    const { data: activity, error: activityError } = await supabaseAdmin
      .from('activities')
      .select('*, organization:organizations(id, name)')
      .eq('id', activityId)
      .single();

    if (activityError || !activity) {
      return res.status(404).json({
        success: false,
        error: 'Attività non trovata'
      });
    }

    // Importa authService per generare il token
    const authService = (await import('../services/authService.js')).default;

    // Genera il token SSO con ruolo admin (super admin che accede)
    const token = authService.generateExternalToken({
      userId: userId,
      activityId: activityId,
      organizationId: activity.organization_id,
      service: serviceCode,
      role: 'owner', // Super admin ha accesso completo
      adminAccess: true, // Flag per indicare accesso admin
      adminEmail: req.user.email
    });

    // URL di redirect con token (senza .php - gestito da .htaccess dei servizi)
    const redirectUrl = `${service.app_url}/auth/sso?token=${token}`;

    res.json({
      success: true,
      data: {
        token,
        redirectUrl,
        expiresIn: 300, // 5 minuti
        targetUser: authUser.user.email,
        targetActivity: activity.name,
        service: service.name
      }
    });
  })
);

// GET /api/admin/users/:userId/subscriptions
// Ottieni tutte le sottoscrizioni di un utente
router.get('/users/:userId/subscriptions',
  [
    param('userId').isUUID().withMessage('ID utente non valido')
  ],
  validate,
  logAdminAction('view_user_subscriptions'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Ottieni le attività dell'utente
    const { data: activities, error: actError } = await supabaseAdmin
      .from('activity_users')
      .select(`
        role,
        activity:activities (
          id,
          name,
          status,
          organization_id
        )
      `)
      .eq('user_id', userId);

    if (actError) throw actError;

    // Per ogni attività, ottieni le sottoscrizioni
    const subscriptions = [];
    for (const au of activities || []) {
      const { data: subs, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select(`
          *,
          plan:plans (
            id,
            code,
            name,
            service:services (
              id,
              code,
              name,
              icon,
              color,
              app_url
            )
          )
        `)
        .eq('activity_id', au.activity.id)
        .in('status', ['active', 'trial']);

      if (!subError && subs) {
        for (const sub of subs) {
          subscriptions.push({
            id: sub.id,
            activityId: au.activity.id,
            activityName: au.activity.name,
            userRole: au.role,
            status: sub.status,
            billingCycle: sub.billing_cycle,
            currentPeriodEnd: sub.current_period_end,
            plan: sub.plan ? {
              id: sub.plan.id,
              code: sub.plan.code,
              name: sub.plan.name
            } : null,
            service: sub.plan?.service ? {
              id: sub.plan.service.id,
              code: sub.plan.service.code,
              name: sub.plan.service.name,
              icon: sub.plan.service.icon,
              color: sub.plan.service.color,
              appUrl: sub.plan.service.app_url
            } : null
          });
        }
      }
    }

    res.json({
      success: true,
      data: { subscriptions }
    });
  })
);

// ==================== IMPERSONATION ====================

// POST /api/admin/impersonate
// Genera token di sessione per accedere come un altro utente
router.post('/impersonate',
  [
    body('userId').isUUID().withMessage('ID utente richiesto')
  ],
  validate,
  logAdminAction('impersonate_user'),
  asyncHandler(async (req, res) => {
    const { userId } = req.body;

    // Verifica che l'utente esista
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError || !authUser?.user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Ottieni le organizzazioni dell'utente
    const { data: orgUsers } = await supabaseAdmin
      .from('organization_users')
      .select(`
        role,
        organization:organizations (
          id,
          name,
          account_type
        )
      `)
      .eq('user_id', userId);

    // Importa authService
    const authService = (await import('../services/authService.js')).default;

    // Genera token JWT per l'utente target
    const tokens = authService.generateImpersonationTokens({
      userId: userId,
      email: authUser.user.email,
      fullName: authUser.user.user_metadata?.full_name || authUser.user.email,
      impersonatedBy: req.user.id,
      impersonatedByEmail: req.user.email
    });

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: userId,
          email: authUser.user.email,
          fullName: authUser.user.user_metadata?.full_name || authUser.user.email,
          organizations: orgUsers?.map(ou => ({
            id: ou.organization.id,
            name: ou.organization.name,
            accountType: ou.organization.account_type,
            role: ou.role
          })) || []
        },
        impersonation: {
          active: true,
          adminId: req.user.id,
          adminEmail: req.user.email
        }
      }
    });
  })
);

// POST /api/admin/impersonate/organization
// Accedi direttamente alla dashboard di un'organizzazione specifica
router.post('/impersonate/organization',
  [
    body('organizationId').isUUID().withMessage('ID organizzazione richiesto')
  ],
  validate,
  logAdminAction('impersonate_organization'),
  asyncHandler(async (req, res) => {
    const { organizationId } = req.body;

    // Trova l'organizzazione
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return res.status(404).json({
        success: false,
        error: 'Organizzazione non trovata'
      });
    }

    // Trova l'owner dell'organizzazione
    const { data: orgOwner } = await supabaseAdmin
      .from('organization_users')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('role', 'owner')
      .single();

    if (!orgOwner) {
      return res.status(404).json({
        success: false,
        error: 'Owner dell\'organizzazione non trovato'
      });
    }

    // Ottieni i dati dell'owner
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(orgOwner.user_id);
    if (authError || !authUser?.user) {
      return res.status(404).json({
        success: false,
        error: 'Utente owner non trovato'
      });
    }

    // Importa authService
    const authService = (await import('../services/authService.js')).default;

    // Genera token JWT per l'owner
    const tokens = authService.generateImpersonationTokens({
      userId: orgOwner.user_id,
      email: authUser.user.email,
      fullName: authUser.user.user_metadata?.full_name || authUser.user.email,
      impersonatedBy: req.user.id,
      impersonatedByEmail: req.user.email
    });

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: orgOwner.user_id,
          email: authUser.user.email,
          fullName: authUser.user.user_metadata?.full_name || authUser.user.email
        },
        organization: {
          id: org.id,
          name: org.name,
          accountType: org.account_type
        },
        impersonation: {
          active: true,
          adminId: req.user.id,
          adminEmail: req.user.email
        }
      }
    });
  })
);

// ==================== CRON ENDPOINTS ====================

// POST /api/admin/cron/check-trials
// Controlla trial in scadenza e genera notifiche
router.post('/cron/check-trials',
  [
    body('daysBeforeExpiry').optional().isInt({ min: 1, max: 7 }).withMessage('Giorni deve essere tra 1 e 7')
  ],
  validate,
  logAdminAction('cron_check_trials'),
  asyncHandler(async (req, res) => {
    const daysBeforeExpiry = req.body.daysBeforeExpiry || 3;
    const result = await adminService.checkExpiringTrials(daysBeforeExpiry);

    res.json({
      success: true,
      data: result,
      message: `Controllati ${result.expiringCount} trial in scadenza`
    });
  })
);

// POST /api/admin/cron/check-subscriptions
// Controlla e aggiorna trial/abbonamenti scaduti
router.post('/cron/check-subscriptions',
  logAdminAction('cron_check_subscriptions'),
  asyncHandler(async (req, res) => {
    const result = await adminService.checkExpiringSubscriptions();

    res.json({
      success: true,
      data: result,
      message: `Aggiornati ${result.expiredTrials + result.expiredSubscriptions} abbonamenti`
    });
  })
);

// ==================== ACTIVITY SERVICES MANAGEMENT ====================

// GET /api/admin/activities/:activityId/services
// Ottieni tutti i servizi con stato per un'attività
router.get('/activities/:activityId/services',
  [
    param('activityId').isUUID().withMessage('ID attività non valido')
  ],
  validate,
  logAdminAction('view_activity_services'),
  asyncHandler(async (req, res) => {
    const services = await adminService.getActivityServicesWithStatus(req.params.activityId);

    res.json({
      success: true,
      data: { services }
    });
  })
);

// PUT /api/admin/activities/:activityId/services/:serviceCode
// Modifica stato servizio per un'attività
router.put('/activities/:activityId/services/:serviceCode',
  [
    param('activityId').isUUID().withMessage('ID attività non valido'),
    param('serviceCode').isString().trim().notEmpty().withMessage('Codice servizio richiesto'),
    body('status').isIn(['inactive', 'free', 'trial', 'pro', 'active', 'expired', 'cancelled', 'suspended']).withMessage('Status non valido'),
    body('billingCycle').optional().isIn(['monthly', 'yearly']).withMessage('Ciclo fatturazione non valido'),
    body('trialDays').optional().isInt({ min: 1, max: 90 }).withMessage('Giorni trial deve essere tra 1 e 90'),
    body('periodEndDate').optional().isISO8601().withMessage('Data fine periodo non valida'),
    body('cancelAtPeriodEnd').optional().isBoolean().withMessage('cancelAtPeriodEnd deve essere boolean'),
    body('isFreePromo').optional().isBoolean().withMessage('isFreePromo deve essere boolean')
  ],
  validate,
  logAdminAction('update_activity_service'),
  asyncHandler(async (req, res) => {
    const { activityId, serviceCode } = req.params;
    const result = await adminService.updateActivityServiceStatus(activityId, serviceCode, req.body);

    res.json({
      success: true,
      data: result,
      message: 'Stato servizio aggiornato'
    });
  })
);

// ==================== SERVICE ASSIGNMENT ====================

// POST /api/admin/service-assignment
// Assegna un servizio a un'attività (supporta due modalità)
router.post('/service-assignment',
  [
    body('mode').isIn(['by-activity', 'by-external']).withMessage('Mode deve essere by-activity o by-external'),
    body('activityId').optional().isUUID().withMessage('ID attività non valido'),
    body('serviceCode').isString().trim().notEmpty().withMessage('Codice servizio richiesto'),
    body('externalAccountId').optional().isString().trim(),
    body('status').optional().isIn(['trial', 'active', 'free']).withMessage('Status non valido'),
    body('billingCycle').optional().isIn(['monthly', 'yearly']).withMessage('Ciclo fatturazione non valido'),
    body('createActivityIfNotFound').optional().isBoolean().withMessage('createActivityIfNotFound deve essere boolean'),
    body('newActivityName').optional().trim()
  ],
  validate,
  logAdminAction('assign_service'),
  asyncHandler(async (req, res) => {
    const {
      mode,
      activityId,
      serviceCode,
      externalAccountId,
      status = 'active',
      billingCycle = 'yearly',
      createActivityIfNotFound = false,
      newActivityName
    } = req.body;

    // Validazioni specifiche per modalità
    if (mode === 'by-activity' && !activityId) {
      return res.status(400).json({
        success: false,
        error: 'activityId è richiesto per la modalità by-activity'
      });
    }

    if (mode === 'by-external' && !externalAccountId) {
      return res.status(400).json({
        success: false,
        error: 'externalAccountId è richiesto per la modalità by-external'
      });
    }

    const result = await adminService.assignService({
      mode,
      activityId,
      serviceCode,
      externalAccountId,
      status,
      billingCycle,
      createActivityIfNotFound,
      newActivityName,
      adminId: req.user.id
    });

    res.status(201).json({
      success: true,
      data: result,
      message: result.activity.wasCreated
        ? `Servizio ${serviceCode} assegnato. Nuova attività "${result.activity.name}" creata.`
        : `Servizio ${serviceCode} assegnato all'attività "${result.activity.name}"`
    });
  })
);

// GET /api/admin/activities/:activityId/external-accounts
// Ottieni i mapping esterni per un'attività
router.get('/activities/:activityId/external-accounts',
  [
    param('activityId').isUUID().withMessage('ID attività non valido')
  ],
  validate,
  logAdminAction('view_activity_external_accounts'),
  asyncHandler(async (req, res) => {
    const externalAccounts = await adminService.getActivityExternalAccounts(req.params.activityId);

    res.json({
      success: true,
      data: { externalAccounts }
    });
  })
);

// GET /api/admin/external-account/:serviceCode/:externalAccountId
// Cerca attività collegata a un account esterno
router.get('/external-account/:serviceCode/:externalAccountId',
  [
    param('serviceCode').isString().trim().notEmpty().withMessage('Codice servizio richiesto'),
    param('externalAccountId').isString().trim().notEmpty().withMessage('ID account esterno richiesto')
  ],
  validate,
  logAdminAction('lookup_external_account'),
  asyncHandler(async (req, res) => {
    const { serviceCode, externalAccountId } = req.params;

    const result = await adminService.findActivityByExternalAccount(serviceCode, externalAccountId);

    res.json({
      success: true,
      data: result,
      found: result !== null
    });
  })
);

// ==================== USER BILLING ====================

// GET /api/admin/users/:userId/billing
// Ottieni riepilogo fatturazione utente con sconti
router.get('/users/:userId/billing',
  [
    param('userId').isUUID().withMessage('ID utente non valido')
  ],
  validate,
  logAdminAction('view_user_billing'),
  asyncHandler(async (req, res) => {
    const billing = await adminService.getUserBillingSummary(req.params.userId);

    res.json({
      success: true,
      data: billing
    });
  })
);

// GET /api/admin/users/:userId/details
// Ottieni dettagli completi utente con attività e servizi
router.get('/users/:userId/details',
  [
    param('userId').isUUID().withMessage('ID utente non valido')
  ],
  validate,
  logAdminAction('view_user_details'),
  asyncHandler(async (req, res) => {
    const userDetails = await adminService.getUserWithActivitiesAndServices(req.params.userId);

    res.json({
      success: true,
      data: userDetails
    });
  })
);

// ==================== VOLUME DISCOUNTS ====================

// GET /api/admin/discounts
// Ottieni lista sconti volume
router.get('/discounts',
  logAdminAction('list_discounts'),
  asyncHandler(async (req, res) => {
    const discounts = await adminService.getVolumeDiscounts();

    res.json({
      success: true,
      data: { discounts }
    });
  })
);

// PUT /api/admin/discounts/:id
// Aggiorna sconto volume
router.put('/discounts/:id',
  [
    param('id').isUUID().withMessage('ID sconto non valido'),
    body('minActivities').optional().isInt({ min: 1 }).withMessage('Min attività non valido'),
    body('maxActivities').optional().custom((value) => {
      if (value === null || value === undefined) return true;
      const num = parseInt(value);
      if (isNaN(num) || num < 1) throw new Error('Max attività non valido');
      return true;
    }),
    body('discountPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Percentuale sconto deve essere tra 0 e 100'),
    body('isActive').optional().isBoolean().withMessage('isActive deve essere boolean')
  ],
  validate,
  logAdminAction('update_discount'),
  asyncHandler(async (req, res) => {
    const discount = await adminService.updateVolumeDiscount(req.params.id, req.body);

    res.json({
      success: true,
      data: discount,
      message: 'Sconto aggiornato'
    });
  })
);

// ==================== COMMUNICATION LOGS ====================

// GET /api/admin/communications
// Ottieni log comunicazioni con filtri
router.get('/communications',
  [
    query('activityId').optional().isUUID().withMessage('ID attività non valido'),
    query('userId').optional().isUUID().withMessage('ID utente non valido'),
    query('type').optional().isIn(['email', 'webhook', 'admin_action', 'system']).withMessage('Tipo non valido'),
    query('event').optional().trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit deve essere tra 1 e 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset non valido')
  ],
  validate,
  logAdminAction('list_communications'),
  asyncHandler(async (req, res) => {
    const { activityId, userId, type, event, limit = 50, offset = 0 } = req.query;

    const result = await adminService.getCommunicationLogs({
      activityId,
      userId,
      type,
      event,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: result
    });
  })
);

// ==================== WEBHOOKS QUEUE ====================

// GET /api/admin/webhooks/pending
// Ottieni webhook in coda
router.get('/webhooks/pending',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit deve essere tra 1 e 100')
  ],
  validate,
  logAdminAction('list_pending_webhooks'),
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const webhooks = await adminService.getPendingWebhooks(limit);

    res.json({
      success: true,
      data: { webhooks }
    });
  })
);

// POST /api/admin/webhooks/:id/complete
// Marca webhook come completato
router.post('/webhooks/:id/complete',
  [
    param('id').isUUID().withMessage('ID webhook non valido')
  ],
  validate,
  logAdminAction('complete_webhook'),
  asyncHandler(async (req, res) => {
    await adminService.markWebhookComplete(req.params.id);

    res.json({
      success: true,
      message: 'Webhook completato'
    });
  })
);

// POST /api/admin/webhooks/:id/retry
// Riprogramma webhook per retry
router.post('/webhooks/:id/retry',
  [
    param('id').isUUID().withMessage('ID webhook non valido')
  ],
  validate,
  logAdminAction('retry_webhook'),
  asyncHandler(async (req, res) => {
    const result = await adminService.retryWebhook(req.params.id);

    res.json({
      success: true,
      data: result,
      message: 'Webhook riprogrammato'
    });
  })
);

// ==================== TRIAL REMINDERS ====================

// Import trial reminder job
import { processTrialReminders } from '../jobs/trialReminderJob.js';

// POST /api/admin/jobs/trial-reminders/run
// Esegui manualmente il job dei trial reminders
router.post('/jobs/trial-reminders/run',
  logAdminAction('run_trial_reminders'),
  asyncHandler(async (req, res) => {
    console.log(`[ADMIN] Trial reminders job triggered manually by ${req.user.email}`);

    const result = await processTrialReminders();

    res.json({
      success: result.success,
      data: {
        processed: result.processed,
        sent: result.sent,
        expired: result.expired,
        errors: result.errors
      },
      message: result.success
        ? `Job completato: ${result.sent} reminder inviati, ${result.expired} trial scaduti`
        : `Job fallito: ${result.error}`
    });
  })
);

// GET /api/admin/jobs/trial-reminders/stats
// Statistiche reminder inviati
router.get('/jobs/trial-reminders/stats',
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days deve essere tra 1 e 365')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days) || 30;

    // Statistiche reminder
    const { data: reminderStats, error: reminderError } = await supabaseAdmin
      .rpc('get_reminder_stats', { p_days: days });

    // Statistiche trial attivi
    const { data: activeTrials, error: trialError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, trial_ends_at', { count: 'exact' })
      .eq('status', 'trial')
      .not('trial_ends_at', 'is', null);

    // Prossimi trial in scadenza
    const today = new Date();
    const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: expiringTrials } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        trial_ends_at,
        activities (name)
      `)
      .eq('status', 'trial')
      .gte('trial_ends_at', today.toISOString())
      .lte('trial_ends_at', next7Days.toISOString())
      .order('trial_ends_at', { ascending: true })
      .limit(10);

    res.json({
      success: true,
      data: {
        period: `${days} giorni`,
        remindersSent: reminderStats || [],
        activeTrials: activeTrials?.length || 0,
        expiringIn7Days: expiringTrials || []
      }
    });
  })
);

// ==================== WEBHOOK DEBUG (DEVELOPMENT ONLY) ====================

// GET /api/admin/webhook/test/:activityId
// Forza l'invio di un webhook di test per una specifica activity
// Solo in development o con flag esplicito
router.get('/webhook/test/:activityId',
  [
    param('activityId').isUUID().withMessage('ID attività non valido'),
    query('service').optional().isIn(['smart_review', 'smart_page', 'menu_digitale', 'display_suite'])
      .withMessage('Servizio non valido'),
    query('action').optional().isIn(['trial_activated', 'activated', 'renewed', 'cancelled', 'expired', 'payment_failed'])
      .withMessage('Azione non valida')
  ],
  validate,
  logAdminAction('test_webhook'),
  asyncHandler(async (req, res) => {
    // Blocca in produzione se non esplicitamente abilitato
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_WEBHOOK_DEBUG !== 'true') {
      return res.status(403).json({
        success: false,
        error: 'Endpoint disabilitato in produzione. Imposta ENABLE_WEBHOOK_DEBUG=true per abilitare.'
      });
    }

    const { activityId } = req.params;
    const serviceCode = req.query.service || 'smart_review';
    const action = req.query.action || 'trial_activated';

    // Ottieni dati attività
    const { data: activity, error: actError } = await supabaseAdmin
      .from('activities')
      .select(`
        id, name, organization_id,
        activity_users!inner(user_id, role)
      `)
      .eq('id', activityId)
      .single();

    if (actError || !activity) {
      return res.status(404).json({
        success: false,
        error: 'Attività non trovata'
      });
    }

    // Trova owner
    const ownerRelation = activity.activity_users.find(au => au.role === 'owner');
    const userId = ownerRelation?.user_id || activity.activity_users[0]?.user_id;

    if (!userId) {
      return res.status(404).json({
        success: false,
        error: 'Nessun utente associato all\'attività'
      });
    }

    // Ottieni email utente
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const userEmail = authData?.user?.email || 'unknown@example.com';

    // Ottieni subscription se esiste
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        plan:plans(code, name),
        service:services(code)
      `)
      .eq('activity_id', activityId)
      .eq('service:services.code', serviceCode)
      .single();

    // Import webhook service
    const webhookService = (await import('../services/webhookService.js')).default;

    // Costruisci dati subscription (usa esistente o mock)
    const subscriptionData = {
      status: subscription?.status || 'trial',
      planCode: subscription?.plan?.code || 'pro',
      billingCycle: subscription?.billing_cycle || 'monthly',
      trialEndsAt: subscription?.trial_ends_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: subscription?.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    // Aggiusta status in base all'action
    if (action === 'activated' || action === 'renewed') {
      subscriptionData.status = 'active';
    } else if (action === 'cancelled') {
      subscriptionData.status = 'cancelled';
    } else if (action === 'expired') {
      subscriptionData.status = 'expired';
    } else if (action === 'payment_failed') {
      subscriptionData.status = 'past_due';
    }

    // Invia webhook
    const result = await webhookService.sendLicenseSync({
      serviceCode,
      action,
      user: { id: userId, email: userEmail },
      activity: { id: activity.id, name: activity.name },
      subscription: subscriptionData
    });

    res.json({
      success: result.success,
      data: {
        action,
        serviceCode,
        activity: {
          id: activity.id,
          name: activity.name
        },
        user: {
          id: userId,
          email: userEmail
        },
        subscription: subscriptionData,
        webhookResult: result
      },
      message: result.success
        ? `Webhook ${action} inviato a ${serviceCode}`
        : `Errore invio webhook: ${result.error}`
    });
  })
);

// GET /api/admin/webhook/logs
// Visualizza ultimi log webhook
router.get('/webhook/logs',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit deve essere tra 1 e 100'),
    query('eventType').optional().trim()
  ],
  validate,
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const eventType = req.query.eventType;

    let query = supabaseAdmin
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data: logs, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: {
        count: logs?.length || 0,
        logs: logs?.map(log => ({
          id: log.id,
          eventType: log.event_type,
          status: log.status,
          response: log.response,
          webhookUrl: log.webhook_url,
          createdAt: log.created_at
        })) || []
      }
    });
  })
);

// GET /api/admin/webhook/health
// Verifica stato endpoint webhook delle app esterne
router.get('/webhook/health',
  asyncHandler(async (req, res) => {
    const services = ['smart_review', 'smart_page'];
    const results = {};

    for (const service of services) {
      const webhookUrl = process.env[`DOID_WEBHOOK_${service.toUpperCase().replace('_', '_')}`]
        || `https://${service.replace('_', '.')}.doid.it/api/webhook/sync-license`;

      const healthUrl = webhookUrl.replace('/sync-license', '/health');

      try {
        const startTime = Date.now();
        const response = await fetch(healthUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        });

        const elapsed = Date.now() - startTime;
        let data;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        results[service] = {
          status: response.ok ? 'ok' : 'error',
          httpStatus: response.status,
          responseTime: elapsed,
          url: healthUrl,
          data
        };
      } catch (error) {
        results[service] = {
          status: 'unreachable',
          error: error.message,
          url: healthUrl
        };
      }
    }

    const allOk = Object.values(results).every(r => r.status === 'ok');

    res.json({
      success: true,
      data: {
        overall: allOk ? 'healthy' : 'degraded',
        services: results
      }
    });
  })
);

// ==================== DELETED ACTIVITIES ====================

// GET /api/admin/activities/deleted
// Ottieni tutte le attività cancellate (soft deleted)
router.get('/activities-deleted',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Pagina non valida'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit deve essere tra 1 e 100'),
    query('search').optional().trim()
  ],
  validate,
  logAdminAction('list_deleted_activities'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = '' } = req.query;

    const result = await adminService.getDeletedActivities({
      page: parseInt(page),
      limit: parseInt(limit),
      search
    });

    res.json({
      success: true,
      data: result
    });
  })
);

// DELETE /api/admin/activities/:id/permanent
// Elimina definitivamente un'attività (hard delete)
router.delete('/activities/:id/permanent',
  [
    param('id').isUUID().withMessage('ID attività non valido')
  ],
  validate,
  logAdminAction('permanent_delete_activity'),
  asyncHandler(async (req, res) => {
    await adminService.permanentDeleteActivity(req.params.id);

    res.json({
      success: true,
      message: 'Attività eliminata definitivamente'
    });
  })
);

// DELETE /api/admin/activities-deleted/all
// Elimina definitivamente tutte le attività cancellate
router.delete('/activities-deleted/all',
  logAdminAction('permanent_delete_all_activities'),
  asyncHandler(async (req, res) => {
    const result = await adminService.permanentDeleteAllCancelledActivities();

    res.json({
      success: true,
      data: result,
      message: `${result.deletedCount} attività eliminate definitivamente`
    });
  })
);

// POST /api/admin/activities/:id/restore
// Ripristina un'attività cancellata
router.post('/activities/:id/restore',
  [
    param('id').isUUID().withMessage('ID attività non valido')
  ],
  validate,
  logAdminAction('restore_activity'),
  asyncHandler(async (req, res) => {
    const activity = await adminService.restoreActivity(req.params.id);

    res.json({
      success: true,
      data: activity,
      message: 'Attività ripristinata con successo'
    });
  })
);

export default router;
