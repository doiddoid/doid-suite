import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import organizationsRoutes from './routes/organizations.js';
import dashboardRoutes from './routes/dashboard.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import externalApiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import servicesRoutes from './routes/services.js';
import activitiesRoutes from './routes/activities.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000',
      'https://suite.doid.it',
      'https://review.doid.it',
      'https://page.doid.it',
      'https://menu.doid.it',
      'https://display.doid.it',
      // DigitalOcean App Platform
      /\.ondigitalocean\.app$/
    ].filter(Boolean);

    // Check regex patterns
    const regexOrigins = allowedOrigins.filter(o => o instanceof RegExp);
    const stringOrigins = allowedOrigins.filter(o => typeof o === 'string');

    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Check string origins
    if (stringOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // Check regex origins
    if (regexOrigins.some(regex => regex.test(origin))) {
      callback(null, true);
      return;
    }

    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Troppe richieste, riprova tra poco'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per hour
  message: {
    success: false,
    error: 'Troppi tentativi di autenticazione, riprova tra un\'ora'
  }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check (both paths for compatibility)
const healthHandler = (_, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/external', externalApiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/activities', activitiesRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'DOID Suite API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 DOID Suite API Server                                ║
║                                                           ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(40)}║
║   Port: ${PORT.toString().padEnd(47)}║
║   URL: http://localhost:${PORT.toString().padEnd(35)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
