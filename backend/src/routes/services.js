import express from 'express';
import jwt from 'jsonwebtoken';
import { param, query, validationResult } from 'express-validator';
import serviceService from '../services/serviceService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import activityService from '../services/activityService.js';
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

// GET /api/services/deep-link-token
// Genera JWT short-lived (60s) per navigazione diretta Suite → Servizio
router.get('/deep-link-token',
  [
    query('activity_id').isUUID().withMessage('ID attività non valido'),
    query('service').isIn(['page', 'review', 'menu', 'chat_ai']).withMessage('Servizio non valido'),
    query('return_to').optional().isString().withMessage('return_to non valido')
  ],
  validate,
  authenticate,
  asyncHandler(async (req, res) => {
    const { activity_id, service, return_to } = req.query;

    // Verifica che l'attività esista
    const activity = await activityService.getActivityById(activity_id);
    if (!activity || activity.status === 'cancelled') {
      return res.status(404).json({
        success: false,
        error: 'Attività non trovata'
      });
    }

    // Verifica che l'utente abbia accesso all'attività
    const isSuperAdmin = req.user.isSuperAdmin;
    if (!isSuperAdmin) {
      const roleInfo = await activityService.getUserActivityRoleInfo(activity_id, req.user.id);
      if (!roleInfo) {
        return res.status(403).json({
          success: false,
          error: 'Non hai accesso a questa attività'
        });
      }
    }

    // Genera JWT con scadenza 60 secondi
    const tokenPayload = {
      user_id: req.user.id,
      activity_id,
      service,
      type: 'deep_link'
    };
    if (return_to) {
      tokenPayload.return_to = return_to;
    }

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: 60 });

    const serviceConfig = SERVICES[service];
    const serviceUrl = serviceConfig?.appUrl;
    const ssoPath = serviceConfig?.ssoPath || '/auth/deep-link.php';
    const url = `${serviceUrl}${ssoPath}?token=${token}`;

    res.json({
      success: true,
      data: { token, url }
    });
  })
);

// GET /api/services
// Pubblico - ritorna lista servizi disponibili
router.get('/',
  asyncHandler(async (req, res) => {
    const services = await serviceService.getAllServices();

    res.json({
      success: true,
      data: { services }
    });
  })
);

// GET /api/services/:code
// Pubblico - ritorna dettaglio servizio con piani
router.get('/:code',
  [
    param('code').isString().trim().notEmpty().withMessage('Codice servizio richiesto')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { service, plans } = await serviceService.getServiceWithPlans(req.params.code);

    res.json({
      success: true,
      data: { service, plans }
    });
  })
);

export default router;
