import { Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import { AppError } from '@shared';
import { logger } from '../utils/logger.js';

// Input sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// Rate limiting for different endpoints
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// WebSocket rate limiting
export const websocketRateLimit = (maxConnections: number = 10) => {
  const connections = new Map<string, number>();
  
  return (socket: any, next: any): void => {
    const ip = socket.handshake.address || socket.conn.remoteAddress || 'unknown';
    const currentConnections = connections.get(ip) || 0;
    
    if (currentConnections >= maxConnections) {
      logger.warn('WebSocket rate limit exceeded', { ip, connections: currentConnections });
      return next(new Error('Too many WebSocket connections'));
    }
    
    connections.set(ip, currentConnections + 1);
    
    // Clean up after connection closes
    socket.on('disconnect', () => {
      const current = connections.get(ip) || 0;
      if (current <= 1) {
        connections.delete(ip);
      } else {
        connections.set(ip, current - 1);
      }
    });
    
    next();
  };
};

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:"],
      mediaSrc: ["'self'", "blob:", "https:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Message content validation
export const validateMessageContent = [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters')
    .custom((value) => {
      // Check for potentially harmful content
      const harmfulPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i
      ];
      
      for (const pattern of harmfulPatterns) {
        if (pattern.test(value)) {
          throw new Error('Message contains potentially harmful content');
        }
      }
      
      return true;
    }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message content',
        errors: errors.array()
      });
    }
    next();
  }
];

// Room name validation
export const validateRoomName = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Room name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Room name can only contain letters, numbers, spaces, hyphens, and underscores'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room name',
        errors: errors.array()
      });
    }
    next();
  }
];

// Username validation
export const validateUsername = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid username',
        errors: errors.array()
      });
    }
    next();
  }
];

// WebRTC path protection
export const protectWebRTCPaths = (req: Request, res: Response, next: NextFunction): void => {
  const webrtcPaths = ['/socket.io/', '/webrtc/', '/ice-servers'];
  
  if (webrtcPaths.some(path => req.path.startsWith(path))) {
    // Verify authentication token for WebRTC paths
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new AppError('Authentication required for WebRTC paths', 401, 'WEBRTC_AUTH_REQUIRED');
    }
  }
  
  next();
};

// Virtual browser security
export const protectVirtualBrowser = (req: Request, res: Response, next: NextFunction): void => {
  const vbPaths = ['/neko/', '/virtual-browser/'];
  
  if (vbPaths.some(path => req.path.startsWith(path))) {
    // Verify admin privileges for virtual browser access
    if (!req.user || !req.user.username?.includes('admin')) {
      throw new AppError('Admin privileges required for virtual browser access', 403, 'VB_ADMIN_REQUIRED');
    }
  }
  
  next();
};

// Request logging for security monitoring
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    };
    
    // Log suspicious activity
    if (res.statusCode >= 400) {
      logger.warn('HTTP Error', logData);
    }
    
    // Log slow requests
    if (duration > 5000) {
      logger.warn('Slow request', logData);
    }
    
    // Log security-related requests
    if (req.path.includes('/admin') || req.path.includes('/auth')) {
      logger.info('Security-related request', logData);
    }
  });
  
  next();
};

// CORS configuration for security
export const secureCORS = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://boltzy.app',
      'https://www.boltzy.app'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin', { origin });
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
