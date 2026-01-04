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
    body('password').isLength({ min: 8 }).withMessage('Password deve essere almeno 8 caratteri'),
    body('fullName').trim().notEmpty().withMessage('Nome completo richiesto'),
    body('emailConfirm').optional().isBoolean().withMessage('emailConfirm deve essere boolean')
  ],
  validate,
  logAdminAction('create_user'),
  asyncHandler(async (req, res) => {
    const { email, password, fullName, emailConfirm = true } = req.body;

    const user = await adminService.createUser({
      email,
      password,
      fullName,
      emailConfirm
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

// ==================== SUBSCRIPTIONS ====================

// GET /api/admin/subscriptions
router.get('/subscriptions',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Pagina non valida'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit deve essere tra 1 e 100'),
    query('status').optional().isIn(['trial', 'active', 'past_due', 'cancelled', 'expired']).withMessage('Status non valido'),
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
    body('status').optional().isIn(['trial', 'active', 'past_due', 'cancelled', 'expired']).withMessage('Status non valido'),
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
    body('features').optional().isArray().withMessage('Features deve essere un array'),
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
    body('features').optional().isArray().withMessage('Features deve essere un array'),
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

    // URL di redirect con token
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
    body('status').isIn(['inactive', 'free', 'trial', 'pro', 'active', 'expired', 'cancelled']).withMessage('Status non valido'),
    body('billingCycle').optional().isIn(['monthly', 'yearly']).withMessage('Ciclo fatturazione non valido'),
    body('trialDays').optional().isInt({ min: 1, max: 90 }).withMessage('Giorni trial deve essere tra 1 e 90'),
    body('periodEndDate').optional().isISO8601().withMessage('Data fine periodo non valida'),
    body('cancelAtPeriodEnd').optional().isBoolean().withMessage('cancelAtPeriodEnd deve essere boolean')
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

export default router;
