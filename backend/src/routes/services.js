import express from 'express';
import { param, validationResult } from 'express-validator';
import serviceService from '../services/serviceService.js';
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
