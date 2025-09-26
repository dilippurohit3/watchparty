import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, transaction } from '../config/database.js';
import { logger, logAuth } from '../utils/logger.js';
import { generateId } from '@shared';
import { AppError } from '@shared';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('User already exists with this email or username', 409, 'USER_EXISTS');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user in transaction
    const result = await transaction(async (client) => {
      const userResult = await client.query(
        `INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id, username, email, avatar_url, created_at`,
        [generateId(), username, email, passwordHash]
      );

      const user = userResult.rows[0];

      // No JWT tokens needed - using Firebase authentication only
      return { user };
    });

    logAuth('register', result.user.id, true, req.ip);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          avatar: result.user.avatar_url,
          createdAt: result.user.created_at,
        },
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Register error:', error);
    throw new AppError('Failed to register user', 500, 'REGISTER_ERROR');
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const userResult = await query(
      'SELECT id, username, email, password_hash, avatar_url, is_online, last_seen FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Update user online status
    await query(
      'UPDATE users SET is_online = true, last_seen = NOW() WHERE id = $1',
      [user.id]
    );

    logAuth('login', user.id, true, req.ip);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar_url,
          isOnline: true,
          lastSeen: new Date().toISOString(),
        },
      },
      message: 'Login successful'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Login error:', error);
    throw new AppError('Failed to login', 500, 'LOGIN_ERROR');
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    // Update user online status
    await query(
      'UPDATE users SET is_online = false, last_seen = NOW() WHERE id = $1',
      [req.user.id]
    );

    logAuth('logout', req.user.id, true, req.ip);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Logout error:', error);
    throw new AppError('Failed to logout', 500, 'LOGOUT_ERROR');
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const userResult = await query(
      'SELECT id, username, email, avatar_url, is_online, last_seen, followers_count, following_count, rooms_created, total_views, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar_url,
          isOnline: user.is_online,
          lastSeen: user.last_seen,
          followersCount: user.followers_count,
          followingCount: user.following_count,
          roomsCreated: user.rooms_created,
          totalViews: user.total_views,
          createdAt: user.created_at,
        },
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Get profile error:', error);
    throw new AppError('Failed to get profile', 500, 'PROFILE_ERROR');
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { username, avatar_url } = req.body;

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, req.user.id]
      );

      if (existingUser.rows.length > 0) {
        throw new AppError('Username already taken', 409, 'USERNAME_TAKEN');
      }
    }

    // Update user profile
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (username) {
      updateFields.push(`username = $${paramCount++}`);
      updateValues.push(username);
    }

    if (avatar_url !== undefined) {
      updateFields.push(`avatar_url = $${paramCount++}`);
      updateValues.push(avatar_url);
    }

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400, 'NO_FIELDS_TO_UPDATE');
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(req.user.id);

    const queryText = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, avatar_url, updated_at`;
    
    const result = await query(queryText, [...updateValues]);

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar_url,
          updatedAt: user.updated_at,
        },
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Update profile error:', error);
    throw new AppError('Failed to update profile', 500, 'UPDATE_PROFILE_ERROR');
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const user = userResult.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 401, 'INVALID_CURRENT_PASSWORD');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    logAuth('password_change', req.user.id, true, req.ip);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Change password error:', error);
    throw new AppError('Failed to change password', 500, 'CHANGE_PASSWORD_ERROR');
  }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { password } = req.body;

    // Verify password before deletion
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const user = userResult.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AppError('Password is incorrect', 401, 'INVALID_PASSWORD');
    }

    // Delete user (cascade will handle related records)
    await query('DELETE FROM users WHERE id = $1', [req.user.id]);

    logAuth('account_deleted', req.user.id, true, req.ip);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Delete account error:', error);
    throw new AppError('Failed to delete account', 500, 'DELETE_ACCOUNT_ERROR');
  }
};