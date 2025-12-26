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
      req.body.serviceCode
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

    // Verifica che l'attività abbia accesso al servizio (abbonamento diretto o ereditato)
    if (!service.canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Nessun abbonamento attivo per questo servizio'
      });
    }

    // Genera token per l'app esterna includendo activityId
    const token = authService.generateExternalToken({
      userId: req.user.id,
      organizationId: req.activity.organization_id,
      activityId: activityId,
      service: serviceCode,
      role: req.activityRole
    });

    // URL di redirect con token
    const appUrl = SERVICES[serviceCode].appUrl;
    const redirectUrl = `${appUrl}/auth/sso?token=${token}`;

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
