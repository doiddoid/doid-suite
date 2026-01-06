import express from 'express';
import { body, validationResult } from 'express-validator';
import authService from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';
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

// POST /api/auth/register
router.post('/register',
  [
    body('email').isEmail().withMessage('Email non valida'),
    body('password').isLength({ min: 8 }).withMessage('Password deve essere almeno 8 caratteri'),
    body('fullName').trim().notEmpty().withMessage('Nome completo richiesto'),
    body('activityName')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Nome attività deve essere almeno 3 caratteri'),
    body('requestedService')
      .optional()
      .isIn(['smart_review', 'smart_page', 'menu_digitale', 'display_suite'])
      .withMessage('Servizio non valido'),
    body('utmSource').optional().trim(),
    body('utmMedium').optional().trim(),
    body('utmCampaign').optional().trim(),
    body('utmContent').optional().trim(),
    body('referralCode').optional().trim()
  ],
  validate,
  asyncHandler(async (req, res) => {
    const {
      email,
      password,
      fullName,
      activityName,
      requestedService,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      referralCode
    } = req.body;

    const result = await authService.register({
      email,
      password,
      fullName,
      activityName,
      requestedService,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      referralCode
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Registrazione completata. Controlla la tua email per confermare l\'account.'
    });
  })
);

// POST /api/auth/login
router.post('/login',
  [
    body('email').isEmail().withMessage('Email non valida'),
    body('password').notEmpty().withMessage('Password richiesta')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.json({
      success: true,
      data: result
    });
  })
);

// POST /api/auth/logout
router.post('/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    await authService.logout(req.token);

    res.json({
      success: true,
      message: 'Logout effettuato'
    });
  })
);

// GET /api/auth/me
router.get('/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user.id);

    res.json({
      success: true,
      data: user
    });
  })
);

// POST /api/auth/refresh
router.post('/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token richiesto')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: result
    });
  })
);

// POST /api/auth/forgot-password
router.post('/forgot-password',
  [
    body('email').isEmail().withMessage('Email non valida')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    await authService.resetPassword(email);

    res.json({
      success: true,
      message: 'Se l\'email esiste, riceverai le istruzioni per il reset'
    });
  })
);

// POST /api/auth/reset-password
router.post('/reset-password',
  [
    body('password').isLength({ min: 8 }).withMessage('Password deve essere almeno 8 caratteri')
  ],
  validate,
  authenticate,
  asyncHandler(async (req, res) => {
    const { password } = req.body;

    await authService.updatePassword(req.token, password);

    res.json({
      success: true,
      message: 'Password aggiornata con successo'
    });
  })
);

// GET /api/auth/verify-email/:token
// Conferma email tramite token (link inviato via GHL)
router.get('/verify-email/:token',
  asyncHandler(async (req, res) => {
    const { token } = req.params;

    const result = await authService.verifyEmailToken(token);

    // Redirect alla pagina di successo nel frontend
    const frontendUrl = process.env.FRONTEND_URL || 'https://suite.doid.it';
    res.redirect(`${frontendUrl}/email-verified?success=true`);
  })
);

// POST /api/auth/resend-verification
// Rinvia email di verifica
router.post('/resend-verification',
  [
    body('email').isEmail().withMessage('Email non valida')
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    await authService.resendVerificationEmail(email);

    res.json({
      success: true,
      message: 'Email di verifica inviata'
    });
  })
);

// POST /api/auth/confirm-email (solo sviluppo)
// Conferma manualmente l'email di un utente
if (process.env.NODE_ENV === 'development') {
  router.post('/confirm-email',
    [
      body('email').isEmail().withMessage('Email non valida')
    ],
    validate,
    asyncHandler(async (req, res) => {
      const { email } = req.body;

      // Trova l'utente per email
      const user = await authService.getUserByEmail(email);

      // Conferma l'email
      await authService.confirmUserEmail(user.id);

      res.json({
        success: true,
        message: 'Email confermata con successo'
      });
    })
  );
}

export default router;
