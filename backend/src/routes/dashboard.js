import express from 'express';
import { query, validationResult } from 'express-validator';
import subscriptionService from '../services/subscriptionService.js';
import authService from '../services/authService.js';
import { authenticate, requireOrganization } from '../middleware/auth.js';
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

// GET /api/dashboard/services
router.get('/services',
  [
    query('organizationId').isUUID().withMessage('ID organizzazione richiesto')
  ],
  validate,
  requireOrganization(),
  asyncHandler(async (req, res) => {
    const services = await subscriptionService.getServicesWithStatus(
      req.query.organizationId
    );

    res.json({
      success: true,
      data: services
    });
  })
);

// GET /api/dashboard/stats
router.get('/stats',
  [
    query('organizationId').isUUID().withMessage('ID organizzazione richiesto')
  ],
  validate,
  requireOrganization(),
  asyncHandler(async (req, res) => {
    const stats = await subscriptionService.getDashboardStats(
      req.query.organizationId
    );

    res.json({
      success: true,
      data: stats
    });
  })
);

// POST /api/dashboard/generate-token
// Genera un token per accedere a un'app esterna
router.post('/generate-token',
  [
    query('organizationId').isUUID().withMessage('ID organizzazione richiesto')
  ],
  validate,
  requireOrganization(),
  asyncHandler(async (req, res) => {
    const { serviceCode } = req.body;

    if (!serviceCode || !SERVICES[serviceCode]) {
      return res.status(400).json({
        success: false,
        error: 'Codice servizio non valido'
      });
    }

    // Verifica che l'organizzazione abbia un abbonamento attivo per il servizio
    const services = await subscriptionService.getServicesWithStatus(
      req.query.organizationId
    );

    const service = services.find(s => s.code === serviceCode);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servizio non trovato'
      });
    }

    if (!service.subscription || !['active', 'trial'].includes(service.subscription.status)) {
      return res.status(403).json({
        success: false,
        error: 'Nessun abbonamento attivo per questo servizio'
      });
    }

    // Genera il token per l'app esterna
    const token = authService.generateExternalToken({
      userId: req.user.id,
      organizationId: req.query.organizationId,
      service: serviceCode,
      role: req.userRole
    });

    // URL di redirect con token (endpoint SSO)
    const redirectUrl = `${service.appUrl}/auth/sso?token=${token}`;

    res.json({
      success: true,
      data: {
        token,
        redirectUrl,
        expiresIn: 300 // 5 minuti
      }
    });
  })
);

// GET /api/dashboard/service/:code/plans
router.get('/service/:code/plans',
  asyncHandler(async (req, res) => {
    const { code } = req.params;

    if (!SERVICES[code]) {
      return res.status(404).json({
        success: false,
        error: 'Servizio non trovato'
      });
    }

    // Ottieni l'ID del servizio
    const services = await subscriptionService.getServicesWithStatus('00000000-0000-0000-0000-000000000000');
    const service = services.find(s => s.code === code);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servizio non trovato'
      });
    }

    const plans = await subscriptionService.getServicePlans(service.id);

    res.json({
      success: true,
      data: {
        service: {
          id: service.id,
          code: service.code,
          name: service.name,
          description: service.description
        },
        plans
      }
    });
  })
);

export default router;
