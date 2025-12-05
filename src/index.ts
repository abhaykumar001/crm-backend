import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/error.middleware';
import { notFound } from './middleware/notFound.middleware';
import logger, { morganStream } from './utils/logger';
import { connectDatabase } from './config/database';
import jobScheduler from './jobs/scheduler';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import leadRoutes from './routes/lead.routes';
import projectRoutes from './routes/project.routes';
import developerRoutes from './routes/developer.routes';
import amenityRoutes from './routes/amenity.routes';
import dealRoutes from './routes/deal.routes';
import communicationRoutes from './routes/communication.routes';
import analyticsRoutes from './routes/analytics.routes';
import campaignRoutes from './routes/campaign.routes';
import sourceRoutes from './routes/source.routes';
import automationRoutes from './routes/automation.routes';
import debugRoutes from './routes/debug.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const API_PREFIX = process.env.API_PREFIX || '/api';
const API_VERSION = process.env.API_VERSION || 'v1';

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Allow requests with no origin (mobile apps, file:// protocol, etc.)
    if (!origin) return callback(null, true);
    
    // Allow file:// protocol for local testing
    if (origin.startsWith('file://')) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: morganStream
  }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Modern CRM API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
const apiRouter = express.Router();

// Mount route handlers
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/leads', leadRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/developers', developerRoutes);
apiRouter.use('/amenities', amenityRoutes);
apiRouter.use('/deals', dealRoutes);
apiRouter.use('/communication', communicationRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/campaigns', campaignRoutes);
apiRouter.use('/sources', sourceRoutes);
apiRouter.use('/automation', automationRoutes);
apiRouter.use('/debug', debugRoutes);

// Mount API router
app.use(`${API_PREFIX}/${API_VERSION}`, apiRouter);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  jobScheduler.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  jobScheduler.stop();
  process.exit(0);
});

// Start server
app.listen(PORT, 'localhost', async () => {
  // Connect to database
  await connectDatabase();
  
  // Start job scheduler for automation
  jobScheduler.start();
  
  logger.info(`🚀 Modern CRM API Server running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 API Base URL: http://localhost:${PORT}${API_PREFIX}/${API_VERSION}`);
  logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
});

export default app;
