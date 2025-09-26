import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { AppError } from '@shared';
import { config } from '../server.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

// JWT authentication removed - using Firebase authentication only
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // This middleware is deprecated - use Firebase authentication instead
  throw new AppError('JWT authentication deprecated - use Firebase authentication', 401, 'DEPRECATED_AUTH');
};

// JWT authentication removed - using Firebase authentication only
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // This middleware is deprecated - use Firebase authentication instead
  next();
};

export const requireRoomAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { roomId } = req.params;
    const userId = req.user!.id;

    // Check if user is in the room
    const result = await query(
      'SELECT 1 FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Not authorized to access this room', 403, 'ROOM_ACCESS_DENIED');
    }

    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Room access check error:', error);
    throw new AppError('Room access check failed', 500, 'ROOM_ACCESS_ERROR');
  }
};

export const requireRoomOwner = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { roomId } = req.params;
    const userId = req.user!.id;

    // Check if user owns the room
    const result = await query(
      'SELECT owner_id FROM rooms WHERE id = $1',
      [roomId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
    }

    if (result.rows[0].owner_id !== userId) {
      throw new AppError('Not authorized to perform this action', 403, 'ROOM_OWNER_REQUIRED');
    }

    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Room owner check error:', error);
    throw new AppError('Room owner check failed', 500, 'ROOM_OWNER_ERROR');
  }
};
