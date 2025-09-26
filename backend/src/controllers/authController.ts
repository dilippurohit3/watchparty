import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, transaction } from '../config/database.js';
import { logger, logAuth } from '../utils/logger.js';
import { generateId } from '@shared';
import { AppError } from '@shared';
import { config } from '../server.js';

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

      // Generate tokens
      const token = jwt.sign(
        { userId: user.id, username: user.username, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      // Store refresh token
      await client.query(
        `INSERT INTO user_sessions (id, user_id, refresh_token, expires_at, created_at, last_used)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [generateId(), user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
      );

      return { user, token, refreshToken };
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
        token: result.token,
        refreshToken: result.refreshToken,
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
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Update last seen
    await query(
      'UPDATE users SET last_seen = NOW() WHERE id = $1',
      [user.id]
    );

    // Firebase handles authentication - no JWT needed

    logAuth('login', user.id, true, req.ip);

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

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    const result = await query(
      'SELECT id, username, email, avatar_url, is_online, last_seen, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar_url,
        isOnline: user.is_online,
        lastSeen: user.last_seen,
        createdAt: user.created_at,
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Get profile error:', error);
    throw new AppError('Failed to get profile', 500, 'PROFILE_GET_ERROR');
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { username, email, avatar } = req.body;

  try {
    // Check if username/email is already taken by another user
    if (username || email) {
      const existingUser = await query(
        'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
        [username, email, userId]
      );

      if (existingUser.rows.length > 0) {
        throw new AppError('Username or email already taken', 409, 'USERNAME_EMAIL_TAKEN');
      }
    }

    // Update user
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (username !== undefined) {
      updateFields.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (avatar !== undefined) {
      updateFields.push(`avatar_url = $${paramCount++}`);
      values.push(avatar);
    }

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400, 'NO_UPDATE_FIELDS');
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    const user = result.rows[0];

    logAuth('update_profile', userId, true, req.ip);

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar_url,
        isOnline: user.is_online,
        lastSeen: user.last_seen,
        updatedAt: user.updated_at,
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Update profile error:', error);
    throw new AppError('Failed to update profile', 500, 'PROFILE_UPDATE_ERROR');
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  try {
    if (!refreshToken) {
      throw new AppError('Refresh token required', 400, 'REFRESH_TOKEN_REQUIRED');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.secret) as any;
    
    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
    }

    // Check if refresh token exists in database
    const sessionResult = await query(
      'SELECT user_id FROM user_sessions WHERE refresh_token = $1 AND expires_at > NOW()',
      [refreshToken]
    );

    if (sessionResult.rows.length === 0) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const userId = sessionResult.rows[0].user_id;

    // Get user info
    const userResult = await query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const user = userResult.rows[0];

    // Generate new tokens
    const newToken = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const newRefreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    // Update refresh token in database
    await query(
      'UPDATE user_sessions SET refresh_token = $1, expires_at = $2, last_used = NOW() WHERE refresh_token = $3',
      [newRefreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), refreshToken]
    );

    logAuth('refresh_token', userId, true, req.ip);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Refresh token error:', error);
    throw new AppError('Failed to refresh token', 500, 'REFRESH_TOKEN_ERROR');
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { refreshToken } = req.body;

  try {
    // Remove refresh token from database
    if (refreshToken) {
      await query(
        'DELETE FROM user_sessions WHERE refresh_token = $1',
        [refreshToken]
      );
    }

    // Update user online status
    await query(
      'UPDATE users SET is_online = FALSE, last_seen = NOW() WHERE id = $1',
      [userId]
    );

    logAuth('logout', userId, true, req.ip);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    throw new AppError('Failed to logout', 500, 'LOGOUT_ERROR');
  }
};
