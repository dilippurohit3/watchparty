/**
 * BOLTZY - PROPRIETARY SOFTWARE
 * Copyright (c) 2024 Boltzy. All rights reserved.
 * 
 * This software is proprietary and confidential. Unauthorized use, modification,
 * distribution, or commercial use is strictly prohibited and will be prosecuted
 * to the full extent of the law.
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { setupRoutes } from './routes/index.js';
import { setupSocketHandlers } from './socket/index.js';
import { AppConfig } from '@shared';
import { 
  sanitizeInput, 
  securityHeaders, 
  securityLogger, 
  secureCORS,
  createRateLimit,
  websocketRateLimit,
  protectWebRTCPaths,
  protectVirtualBrowser
} from './middleware/security.js';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Security Middleware
app.use(securityHeaders);
app.use(securityLogger);
app.use(sanitizeInput);
app.use(protectWebRTCPaths);
app.use(protectVirtualBrowser);

// Standard Middleware
app.use(cors(secureCORS));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced Rate limiting
const generalLimiter = createRateLimit(15 * 60 * 1000, 100, 'Too many requests from this IP, please try again later.');
const authLimiter = createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts, please try again later.');
const apiLimiter = createRateLimit(1 * 60 * 1000, 30, 'API rate limit exceeded, please slow down.');

app.use(generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Setup routes
setupRoutes(app);

// Socket.IO setup with security
const io = new SocketIOServer(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB
  allowEIO3: false, // Disable Engine.IO v3 for security
});

// WebSocket rate limiting
io.use(websocketRateLimit(parseInt(process.env.WEBSOCKET_RATE_LIMIT || '10')));

// Setup socket handlers
setupSocketHandlers(io);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Configuration
const config: AppConfig = {
  port: parseInt(process.env.PORT || '8080'),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'rave_watchparty',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  // JWT configuration removed - using Firebase authentication only
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '100000000'), // 100MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
    uploadPath: process.env.UPLOAD_PATH || path.join(__dirname, '../uploads'),
  },
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY || '',
  },
};

// Initialize database and Redis connections
async function initializeApp() {
  try {
    await connectDatabase(config.database);
    logger.info('Database connected successfully');
    
    await connectRedis(config.redis);
    logger.info('Redis connected successfully');
    
    // Start server
    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });
    
  } catch (error) {
    logger.error('Failed to initialize app:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Initialize the application
initializeApp();

export { app, server, io, config };
