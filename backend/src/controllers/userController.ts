import { Request, Response } from 'express';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { AppError } from '@shared';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 20, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    let whereClause = '';
    const values = [];
    let paramCount = 1;

    if (search) {
      whereClause = `WHERE username ILIKE $${paramCount} OR email ILIKE $${paramCount}`;
      values.push(`%${search}%`);
      paramCount++;
    }

    // Get users
    const usersResult = await query(
      `SELECT id, username, email, avatar_url, is_online, last_seen, created_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, Number(limit), offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      values
    );

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        users: usersResult.rows.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar_url,
          isOnline: user.is_online,
          lastSeen: user.last_seen,
          createdAt: user.created_at,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    throw new AppError('Failed to get users', 500, 'USERS_GET_ERROR');
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    const result = await query(
      `SELECT id, username, email, avatar_url, is_online, last_seen, created_at
       FROM users WHERE id = $1`,
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
    logger.error('Get user error:', error);
    throw new AppError('Failed to get user', 500, 'USER_GET_ERROR');
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const currentUserId = req.user!.id;
  const { username, email, avatar } = req.body;

  try {
    // Check if user is updating their own profile or is admin
    if (userId !== currentUserId) {
      throw new AppError('Not authorized to update this user', 403, 'UPDATE_UNAUTHORIZED');
    }

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

    logger.info('User updated', { userId, updatedFields: Object.keys(req.body) });

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
      message: 'User updated successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Update user error:', error);
    throw new AppError('Failed to update user', 500, 'USER_UPDATE_ERROR');
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const currentUserId = req.user!.id;

  try {
    // Check if user is deleting their own account or is admin
    if (userId !== currentUserId) {
      throw new AppError('Not authorized to delete this user', 403, 'DELETE_UNAUTHORIZED');
    }

    // Check if user exists
    const userResult = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Delete user (cascade will handle related records)
    await query('DELETE FROM users WHERE id = $1', [userId]);

    logger.info('User deleted', { userId });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Delete user error:', error);
    throw new AppError('Failed to delete user', 500, 'USER_DELETE_ERROR');
  }
};
