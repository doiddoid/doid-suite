import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import faqService from '../services/faqService.js';
import { authenticate } from '../middleware/auth.js';
import { requireSuperAdmin, logAdminAction } from '../middleware/adminAuth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

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

// ==================== PUBLIC ====================

// GET /api/faq — FAQ pubblicate (opzionale filtro per servizio)
router.get('/',
  authenticate,
  [
    query('service').optional().isString().trim()
  ],
  validate,
  asyncHandler(async (req, res) => {
    const serviceCode = req.query.service || null;
    const faqs = await faqService.getPublishedFaqs(serviceCode);

    res.json({ success: true, data: faqs });
  })
);

// ==================== ADMIN ====================

// GET /api/faq/admin — tutte le FAQ (anche bozze)
router.get('/admin',
  authenticate,
  requireSuperAdmin,
  logAdminAction('view_faqs'),
  asyncHandler(async (req, res) => {
    const serviceCode = req.query.service || null;
    const faqs = await faqService.getAllFaqs(serviceCode);

    res.json({ success: true, data: faqs });
  })
);

// POST /api/faq/admin — crea FAQ
router.post('/admin',
  authenticate,
  requireSuperAdmin,
  [
    body('service_code').notEmpty().withMessage('Servizio obbligatorio'),
    body('question').notEmpty().withMessage('Domanda obbligatoria'),
    body('answer').notEmpty().withMessage('Risposta obbligatoria'),
    body('sort_order').optional().isInt(),
    body('is_published').optional().isBoolean()
  ],
  validate,
  logAdminAction('create_faq'),
  asyncHandler(async (req, res) => {
    const faq = await faqService.createFaq(req.body);

    res.status(201).json({ success: true, data: faq });
  })
);

// PUT /api/faq/admin/:id — aggiorna FAQ
router.put('/admin/:id',
  authenticate,
  requireSuperAdmin,
  [
    param('id').isUUID().withMessage('ID non valido'),
    body('service_code').optional().isString(),
    body('question').optional().isString(),
    body('answer').optional().isString(),
    body('sort_order').optional().isInt(),
    body('is_published').optional().isBoolean()
  ],
  validate,
  logAdminAction('update_faq'),
  asyncHandler(async (req, res) => {
    const faq = await faqService.updateFaq(req.params.id, req.body);

    res.json({ success: true, data: faq });
  })
);

// DELETE /api/faq/admin/:id — elimina FAQ
router.delete('/admin/:id',
  authenticate,
  requireSuperAdmin,
  [
    param('id').isUUID().withMessage('ID non valido')
  ],
  validate,
  logAdminAction('delete_faq'),
  asyncHandler(async (req, res) => {
    await faqService.deleteFaq(req.params.id);

    res.json({ success: true, message: 'FAQ eliminata' });
  })
);

// PUT /api/faq/admin/reorder/:serviceCode — riordina FAQ
router.put('/admin/reorder/:serviceCode',
  authenticate,
  requireSuperAdmin,
  [
    param('serviceCode').isString().notEmpty(),
    body('orderedIds').isArray({ min: 1 }).withMessage('Lista ID obbligatoria')
  ],
  validate,
  logAdminAction('reorder_faqs'),
  asyncHandler(async (req, res) => {
    await faqService.reorderFaqs(req.params.serviceCode, req.body.orderedIds);

    res.json({ success: true, message: 'Ordine aggiornato' });
  })
);

export default router;
