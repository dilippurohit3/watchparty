import { Request, Response } from 'express';
import { query } from '../config/database.js';
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

export const getMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    // Check if user is in the room
    const roomCheck = await query(
      'SELECT 1 FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [roomId, req.user!.id]
    );

    if (roomCheck.rows.length === 0) {
      throw new AppError('Not authorized to view messages in this room', 403, 'ROOM_ACCESS_DENIED');
    }

    // Get messages with user info
    const result = await query(
      `SELECT 
        cm.id,
        cm.message,
        cm.message_type,
        cm.created_at,
        u.username,
        u.avatar_url,
        COALESCE(
          json_agg(
            json_build_object(
              'emoji', cr.emoji,
              'users', (
                SELECT json_agg(json_build_object('id', u2.id, 'username', u2.username))
                FROM chat_reactions cr2
                JOIN users u2 ON cr2.user_id = u2.id
                WHERE cr2.message_id = cm.id AND cr2.emoji = cr.emoji
              )
            )
          ) FILTER (WHERE cr.emoji IS NOT NULL),
          '[]'::json
        ) as reactions
       FROM chat_messages cm
       JOIN users u ON cm.user_id = u.id
       LEFT JOIN chat_reactions cr ON cm.id = cr.message_id
       WHERE cm.room_id = $1
       GROUP BY cm.id, cm.message, cm.message_type, cm.created_at, u.username, u.avatar_url
       ORDER BY cm.created_at DESC
       LIMIT $2 OFFSET $3`,
      [roomId, Number(limit), offset]
    );

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM chat_messages WHERE room_id = $1',
      [roomId]
    );

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        messages: result.rows.map(row => ({
          id: row.id,
          message: row.message,
          type: row.message_type,
          timestamp: row.created_at,
          username: row.username,
          avatar: row.avatar_url,
          reactions: row.reactions,
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
    if (error instanceof AppError) throw error;
    logger.error('Get messages error:', error);
    throw new AppError('Failed to get messages', 500, 'MESSAGES_GET_ERROR');
  }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const { message, type = 'text' } = req.body;
  const userId = req.user!.id;

  try {
    if (!message || message.trim().length === 0) {
      throw new AppError('Message cannot be empty', 400, 'EMPTY_MESSAGE');
    }

    if (message.length > 1000) {
      throw new AppError('Message too long', 400, 'MESSAGE_TOO_LONG');
    }

    // Check if user is in the room
    const roomCheck = await query(
      'SELECT 1 FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );

    if (roomCheck.rows.length === 0) {
      throw new AppError('Not authorized to send messages in this room', 403, 'ROOM_ACCESS_DENIED');
    }

    // Insert message
    const result = await query(
      `INSERT INTO chat_messages (id, room_id, user_id, message, message_type, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [generateId(), roomId, userId, message.trim(), type]
    );

    const newMessage = result.rows[0];

    // Get user info
    const userResult = await query(
      'SELECT username, avatar_url FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    logger.info('Message sent', {
      messageId: newMessage.id,
      roomId,
      userId,
      messageLength: message.length
    });

    res.status(201).json({
      success: true,
      data: {
        id: newMessage.id,
        message: newMessage.message,
        type: newMessage.message_type,
        timestamp: newMessage.created_at,
        username: user.username,
        avatar: user.avatar_url,
        reactions: [],
      },
      message: 'Message sent successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Send message error:', error);
    throw new AppError('Failed to send message', 500, 'MESSAGE_SEND_ERROR');
  }
};

export const addReaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user!.id;

  try {
    if (!emoji || emoji.length > 10) {
      throw new AppError('Invalid emoji', 400, 'INVALID_EMOJI');
    }

    // Check if message exists and user has access
    const messageCheck = await query(
      `SELECT cm.id, cm.room_id 
       FROM chat_messages cm
       JOIN room_participants rp ON cm.room_id = rp.room_id
       WHERE cm.id = $1 AND rp.user_id = $2`,
      [messageId, userId]
    );

    if (messageCheck.rows.length === 0) {
      throw new AppError('Message not found or access denied', 404, 'MESSAGE_NOT_FOUND');
    }

    // Add or update reaction
    await query(
      `INSERT INTO chat_reactions (id, message_id, user_id, emoji, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (message_id, user_id, emoji) DO NOTHING`,
      [generateId(), messageId, userId, emoji]
    );

    logger.info('Reaction added', { messageId, userId, emoji });

    res.json({
      success: true,
      message: 'Reaction added successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Add reaction error:', error);
    throw new AppError('Failed to add reaction', 500, 'REACTION_ADD_ERROR');
  }
};

export const removeReaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user!.id;

  try {
    if (!emoji) {
      throw new AppError('Emoji required', 400, 'EMOJI_REQUIRED');
    }

    // Remove reaction
    const result = await query(
      'DELETE FROM chat_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [messageId, userId, emoji]
    );

    if (result.rowCount === 0) {
      throw new AppError('Reaction not found', 404, 'REACTION_NOT_FOUND');
    }

    logger.info('Reaction removed', { messageId, userId, emoji });

    res.json({
      success: true,
      message: 'Reaction removed successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Remove reaction error:', error);
    throw new AppError('Failed to remove reaction', 500, 'REACTION_REMOVE_ERROR');
  }
};

export const getTypingUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId } = req.params;

  try {
    // This would typically be handled by Redis for real-time typing indicators
    // For now, return empty array
    res.json({
      success: true,
      data: {
        typingUsers: []
      }
    });
  } catch (error) {
    logger.error('Get typing users error:', error);
    throw new AppError('Failed to get typing users', 500, 'TYPING_USERS_ERROR');
  }
};
