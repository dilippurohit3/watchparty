import { Request, Response } from 'express';
import { query, transaction } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { generateId } from '@shared';
import { AppError } from '@shared';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export const followUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const followerId = req.user!.id;

  try {
    if (userId === followerId) {
      throw new AppError('Cannot follow yourself', 400, 'CANNOT_FOLLOW_SELF');
    }

    // Check if user exists
    const userResult = await query(
      'SELECT id, username FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if already following
    const existingFollow = await query(
      'SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, userId]
    );

    if (existingFollow.rows.length > 0) {
      throw new AppError('Already following this user', 409, 'ALREADY_FOLLOWING');
    }

    // Create follow relationship
    await query(
      `INSERT INTO user_follows (id, follower_id, following_id, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [generateId(), followerId, userId]
    );

    // Update follower counts
    await query(
      'UPDATE users SET followers_count = followers_count + 1 WHERE id = $1',
      [userId]
    );

    await query(
      'UPDATE users SET following_count = following_count + 1 WHERE id = $1',
      [followerId]
    );

    logger.info('User followed', { followerId, followingId: userId });

    res.status(201).json({
      success: true,
      message: 'User followed successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Follow user error:', error);
    throw new AppError('Failed to follow user', 500, 'FOLLOW_ERROR');
  }
};

export const unfollowUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const followerId = req.user!.id;

  try {
    // Check if following relationship exists
    const followResult = await query(
      'SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, userId]
    );

    if (followResult.rows.length === 0) {
      throw new AppError('Not following this user', 404, 'NOT_FOLLOWING');
    }

    // Remove follow relationship
    await query(
      'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, userId]
    );

    // Update follower counts
    await query(
      'UPDATE users SET followers_count = followers_count - 1 WHERE id = $1',
      [userId]
    );

    await query(
      'UPDATE users SET following_count = following_count - 1 WHERE id = $1',
      [followerId]
    );

    logger.info('User unfollowed', { followerId, followingId: userId });

    res.json({
      success: true,
      message: 'User unfollowed successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Unfollow user error:', error);
    throw new AppError('Failed to unfollow user', 500, 'UNFOLLOW_ERROR');
  }
};

export const getFollowers = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    // Get followers
    const followersResult = await query(
      `SELECT 
        u.id, u.username, u.avatar_url, u.is_online, u.last_seen,
        uf.created_at as followed_at
       FROM user_follows uf
       JOIN users u ON uf.follower_id = u.id
       WHERE uf.following_id = $1
       ORDER BY uf.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, Number(limit), offset]
    );

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM user_follows WHERE following_id = $1',
      [userId]
    );

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        followers: followersResult.rows.map(follower => ({
          id: follower.id,
          username: follower.username,
          avatar: follower.avatar_url,
          isOnline: follower.is_online,
          lastSeen: follower.last_seen,
          followedAt: follower.followed_at,
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
    logger.error('Get followers error:', error);
    throw new AppError('Failed to get followers', 500, 'FOLLOWERS_GET_ERROR');
  }
};

export const getFollowing = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    // Get following
    const followingResult = await query(
      `SELECT 
        u.id, u.username, u.avatar_url, u.is_online, u.last_seen,
        uf.created_at as followed_at
       FROM user_follows uf
       JOIN users u ON uf.following_id = u.id
       WHERE uf.follower_id = $1
       ORDER BY uf.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, Number(limit), offset]
    );

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM user_follows WHERE follower_id = $1',
      [userId]
    );

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        following: followingResult.rows.map(following => ({
          id: following.id,
          username: following.username,
          avatar: following.avatar_url,
          isOnline: following.is_online,
          lastSeen: following.last_seen,
          followedAt: following.followed_at,
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
    logger.error('Get following error:', error);
    throw new AppError('Failed to get following', 500, 'FOLLOWING_GET_ERROR');
  }
};

export const getFollowStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const currentUserId = req.user!.id;

  try {
    const result = await query(
      'SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [currentUserId, userId]
    );

    const isFollowing = result.rows.length > 0;

    res.json({
      success: true,
      data: {
        isFollowing,
        canFollow: userId !== currentUserId
      }
    });
  } catch (error) {
    logger.error('Get follow status error:', error);
    throw new AppError('Failed to get follow status', 500, 'FOLLOW_STATUS_ERROR');
  }
};
