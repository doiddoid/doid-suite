import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import guideService from '../services/guideService.js';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { requireSuperAdmin, logAdminAction } from '../middleware/adminAuth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: 'Errore di validazione', details: errors.array() });
  }
  next();
};

// ==================== PUBLIC ====================

// GET /api/guides — Guide pubblicate
router.get('/',
  authenticate,
  [query('service').optional().isString().trim()],
  validate,
  asyncHandler(async (req, res) => {
    const service = req.query.service || null;
    const guides = await guideService.getPublishedGuides(service);
    res.json({ success: true, data: guides });
  })
);

// ==================== ADMIN ====================

// GET /api/guides/admin — Tutte le guide (admin)
router.get('/admin',
  authenticate,
  requireSuperAdmin,
  logAdminAction('list_guides'),
  [query('service').optional().isString().trim()],
  validate,
  asyncHandler(async (req, res) => {
    const service = req.query.service || null;
    const guides = await guideService.getAllGuides(service);
    res.json({ success: true, data: guides });
  })
);

// POST /api/guides/admin — Crea guida
router.post('/admin',
  authenticate,
  requireSuperAdmin,
  logAdminAction('create_guide'),
  [
    body('service_code').trim().notEmpty(),
    body('title').trim().notEmpty(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const guide = await guideService.createGuide(req.body);
    res.status(201).json({ success: true, data: guide });
  })
);

// PUT /api/guides/admin/:id — Aggiorna guida
router.put('/admin/:id',
  authenticate,
  requireSuperAdmin,
  logAdminAction('update_guide'),
  param('id').isUUID(),
  validate,
  asyncHandler(async (req, res) => {
    const guide = await guideService.updateGuide(req.params.id, req.body);
    res.json({ success: true, data: guide });
  })
);

// DELETE /api/guides/admin/:id — Elimina guida
router.delete('/admin/:id',
  authenticate,
  requireSuperAdmin,
  logAdminAction('delete_guide'),
  param('id').isUUID(),
  validate,
  asyncHandler(async (req, res) => {
    await guideService.deleteGuide(req.params.id);
    res.json({ success: true, message: 'Guida eliminata' });
  })
);

// POST /api/guides/admin/upload-screenshot — Upload screenshot
router.post('/admin/upload-screenshot',
  authenticate,
  requireSuperAdmin,
  express.raw({ type: 'image/*', limit: '5mb' }),
  asyncHandler(async (req, res) => {
    if (!req.body || req.body.length === 0) {
      return res.status(400).json({ success: false, error: 'Nessun file ricevuto' });
    }

    const contentType = req.headers['content-type'];
    const ext = contentType.split('/')[1].replace('jpeg', 'jpg');
    const fileName = `screenshots/${Date.now()}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from('guide-screenshots')
      .upload(fileName, req.body, { contentType, upsert: true });

    if (error) {
      return res.status(500).json({ success: false, error: 'Errore upload: ' + error.message });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('guide-screenshots')
      .getPublicUrl(fileName);

    res.json({ success: true, data: { url: urlData.publicUrl } });
  })
);

export default router;
