import express from 'express';
import { body, param, validationResult } from 'express-validator';
import organizationService from '../services/organizationService.js';
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

// GET /api/organizations
router.get('/',
  asyncHandler(async (req, res) => {
    const organizations = await organizationService.listByUser(req.user.id);

    res.json({
      success: true,
      data: organizations
    });
  })
);

// POST /api/organizations
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Nome organizzazione richiesto'),
    body('email').optional().isEmail().withMessage('Email non valida'),
    body('phone').optional().trim(),
    body('vatNumber').optional().trim()
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, phone, vatNumber } = req.body;

    const organization = await organizationService.create({
      name,
      email,
      phone,
      vatNumber,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      data: organization,
      message: 'Organizzazione creata con successo'
    });
  })
);

// GET /api/organizations/:organizationId
router.get('/:organizationId',
  [
    param('organizationId').isUUID().withMessage('ID organizzazione non valido')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const organization = await organizationService.getById(
      req.params.organizationId,
      req.user.id
    );

    res.json({
      success: true,
      data: organization
    });
  })
);

// PUT /api/organizations/:organizationId
router.put('/:organizationId',
  [
    param('organizationId').isUUID().withMessage('ID organizzazione non valido'),
    body('name').optional().trim().notEmpty().withMessage('Nome non può essere vuoto'),
    body('email').optional().isEmail().withMessage('Email non valida'),
    body('phone').optional().trim(),
    body('vatNumber').optional().trim(),
    body('logoUrl').optional().isURL().withMessage('URL logo non valido')
  ],
  validate,
  requireOrganization('admin'),
  asyncHandler(async (req, res) => {
    const organization = await organizationService.update(
      req.params.organizationId,
      req.body
    );

    res.json({
      success: true,
      data: organization,
      message: 'Organizzazione aggiornata'
    });
  })
);

// DELETE /api/organizations/:organizationId
router.delete('/:organizationId',
  [
    param('organizationId').isUUID().withMessage('ID organizzazione non valido')
  ],
  validate,
  requireOrganization('owner'),
  asyncHandler(async (req, res) => {
    await organizationService.delete(req.params.organizationId);

    res.json({
      success: true,
      message: 'Organizzazione eliminata'
    });
  })
);

// GET /api/organizations/:organizationId/members
router.get('/:organizationId/members',
  [
    param('organizationId').isUUID().withMessage('ID organizzazione non valido')
  ],
  validate,
  requireOrganization('manager'),
  asyncHandler(async (req, res) => {
    const members = await organizationService.getMembers(req.params.organizationId);

    res.json({
      success: true,
      data: members
    });
  })
);

// POST /api/organizations/:organizationId/members
router.post('/:organizationId/members',
  [
    param('organizationId').isUUID().withMessage('ID organizzazione non valido'),
    body('email').isEmail().withMessage('Email non valida'),
    body('role').optional().isIn(['admin', 'manager', 'user']).withMessage('Ruolo non valido')
  ],
  validate,
  requireOrganization('admin'),
  asyncHandler(async (req, res) => {
    const { email, role } = req.body;

    const member = await organizationService.addMember(
      req.params.organizationId,
      { email, role }
    );

    res.status(201).json({
      success: true,
      data: member,
      message: 'Membro aggiunto'
    });
  })
);

// DELETE /api/organizations/:organizationId/members/:memberId
router.delete('/:organizationId/members/:memberId',
  [
    param('organizationId').isUUID().withMessage('ID organizzazione non valido'),
    param('memberId').isUUID().withMessage('ID membro non valido')
  ],
  validate,
  requireOrganization('owner'),
  asyncHandler(async (req, res) => {
    await organizationService.removeMember(
      req.params.organizationId,
      req.params.memberId
    );

    res.json({
      success: true,
      message: 'Membro rimosso'
    });
  })
);

export default router;
