import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import subscriptionService from '../services/subscriptionService.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

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

// ==================== DEPRECATED USER-BASED ROUTES ====================
// Queste route sono obsolete. Usare le route activity-based in /api/activities/:activityId/subscriptions/*

router.get('/dashboard', (req, res) => {
  res.status(410).json({
    success: false,
    error: 'Endpoint deprecato. Usa /api/activities/:activityId/subscriptions/dashboard'
  });
});

router.post('/trial', (req, res) => {
  res.status(410).json({
    success: false,
    error: 'Endpoint deprecato. Usa /api/activities/:activityId/subscriptions/trial'
  });
});

router.post('/activate', (req, res) => {
  res.status(410).json({
    success: false,
    error: 'Endpoint deprecato. Usa /api/activities/:activityId/subscriptions/activate'
  });
});

router.post('/cancel', (req, res) => {
  res.status(410).json({
    success: false,
    error: 'Endpoint deprecato. Usa /api/activities/:activityId/subscriptions/cancel'
  });
});

router.get('/check/:serviceCode', (req, res) => {
  res.status(410).json({
    success: false,
    error: 'Endpoint deprecato. Usa /api/activities/:activityId/subscriptions/check/:serviceCode'
  });
});

// GET /api/subscriptions - retrocompatibilità con organizationId
router.get('/',
  asyncHandler(async (req, res) => {
    if (!req.query.organizationId) {
      return res.status(410).json({
        success: false,
        error: 'Endpoint deprecato. Usa /api/activities/:activityId/subscriptions'
      });
    }

    // Legacy: organization-based
    const subscriptions = await subscriptionService.listByOrganization(
      req.query.organizationId
    );
    return res.json({
      success: true,
      data: subscriptions
    });
  })
);

// ==================== ORGANIZATION-BASED ROUTES (LEGACY) ====================

// POST /api/subscriptions
router.post('/',
  [
    body('organizationId').isUUID().withMessage('ID organizzazione richiesto'),
    body('planId').isUUID().withMessage('ID piano richiesto'),
    body('billingCycle').optional().isIn(['monthly', 'yearly']).withMessage('Ciclo fatturazione non valido')
  ],
  validate,
  requireOrganization('admin'),
  asyncHandler(async (req, res) => {
    const { organizationId, planId, billingCycle } = req.body;

    const subscription = await subscriptionService.create({
      organizationId,
      planId,
      billingCycle
    });

    res.status(201).json({
      success: true,
      data: subscription,
      message: 'Abbonamento attivato'
    });
  })
);

// PUT /api/subscriptions/:id
router.put('/:id',
  [
    param('id').isUUID().withMessage('ID abbonamento non valido'),
    query('organizationId').isUUID().withMessage('ID organizzazione richiesto'),
    body('planId').optional().isUUID().withMessage('ID piano non valido'),
    body('billingCycle').optional().isIn(['monthly', 'yearly']).withMessage('Ciclo fatturazione non valido')
  ],
  validate,
  requireOrganization('admin'),
  asyncHandler(async (req, res) => {
    const { planId, billingCycle } = req.body;

    const subscription = await subscriptionService.update(
      req.params.id,
      req.query.organizationId,
      { planId, billingCycle }
    );

    res.json({
      success: true,
      data: subscription,
      message: 'Abbonamento aggiornato'
    });
  })
);

// DELETE /api/subscriptions/:id
router.delete('/:id',
  [
    param('id').isUUID().withMessage('ID abbonamento non valido'),
    query('organizationId').isUUID().withMessage('ID organizzazione richiesto')
  ],
  validate,
  requireOrganization('owner'),
  asyncHandler(async (req, res) => {
    await subscriptionService.cancel(
      req.params.id,
      req.query.organizationId
    );

    res.json({
      success: true,
      message: 'Abbonamento cancellato'
    });
  })
);

export default router;
