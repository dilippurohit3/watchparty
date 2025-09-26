import { Request, Response, NextFunction } from 'express';
import { AppError } from '@shared';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  // Check if user is admin
  const isAdmin = req.user.username === 'admin' || 
                  req.user.email?.includes('admin') ||
                  req.user.email?.includes('administrator');

  if (!isAdmin) {
    throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
  }

  next();
};
