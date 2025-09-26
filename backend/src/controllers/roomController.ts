import { Request, Response } from 'express';
import { query, getPool } from '../config/database.js';
import { roomCache } from '../config/redis.js';
import { logger, logRoom } from '../utils/logger.js';
import { generateId } from '@shared';
import { AppError } from '@shared';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email?: string;
  };
}

export const createRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, description, isPublic = true, password, maxParticipants = 50 } = req.body;
  const userId = req.user!.id;

  try {
    const roomId = generateId();
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create room in database
    const result = await query(
      `INSERT INTO rooms (id, name, description, owner_id, is_public, password, max_participants, room_code, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [roomId, name, description, userId, isPublic, password, maxParticipants, roomCode]
    );

    const room = result.rows[0];

    // Cache room data
    await roomCache.setRoom(roomId, {
      ...room,
      participants: [userId],
      currentVideo: null,
      isPlaying: false,
      currentTime: 0,
      playbackRate: 1,
    });

    logRoom('create', roomId, userId, { name, isPublic });

    res.status(201).json({
      success: true,
      data: {
        room: {
          id: room.id,
          name: room.name,
          description: room.description,
          isPublic: room.is_public,
          maxParticipants: room.max_participants,
          roomCode: room.room_code,
          createdAt: room.created_at,
        },
        message: 'Room created successfully'
      }
    });
  } catch (error) {
    logger.error('Create room error:', error);
    throw new AppError('Failed to create room', 500, 'ROOM_CREATE_ERROR');
  }
};

export const getRoom = async (req: Request, res: Response): Promise<void> => {
  const { roomId } = req.params;

  try {
    // Try to get from cache first
    let room = await roomCache.getRoom(roomId);
    
    if (!room) {
      // Get from database
      const result = await query(
        'SELECT * FROM rooms WHERE id = $1',
        [roomId]
      );

      if (result.rows.length === 0) {
        throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
      }

      room = result.rows[0];
      
      // Cache the room
      await roomCache.setRoom(roomId, room);
    }

    // Get participants
    const participants = await roomCache.getParticipants(roomId);

    res.json({
      success: true,
      data: {
        room: {
          id: room.id,
          name: room.name,
          description: room.description,
          isPublic: room.is_public,
          maxParticipants: room.max_participants,
          roomCode: room.room_code,
          participantCount: participants.length,
          createdAt: room.created_at,
        },
        participants
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Get room error:', error);
    throw new AppError('Failed to get room', 500, 'ROOM_GET_ERROR');
  }
};

export const updateRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const { name, description, isPublic, password } = req.body;
  const userId = req.user!.id;

  try {
    // Check if user owns the room
    const roomResult = await query(
      'SELECT owner_id FROM rooms WHERE id = $1',
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
    }

    if (roomResult.rows[0].owner_id !== userId) {
      throw new AppError('Not authorized to update this room', 403, 'ROOM_UPDATE_UNAUTHORIZED');
    }

    // Update room
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (isPublic !== undefined) {
      updateFields.push(`is_public = $${paramCount++}`);
      values.push(isPublic);
    }
    if (password !== undefined) {
      updateFields.push(`password = $${paramCount++}`);
      values.push(password);
    }

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400, 'NO_UPDATE_FIELDS');
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(roomId);

    const result = await query(
      `UPDATE rooms SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    const room = result.rows[0];

    // Update cache
    await roomCache.setRoom(roomId, room);

    logRoom('update', roomId, userId, { name, isPublic });

    res.json({
      success: true,
      data: {
        room: {
          id: room.id,
          name: room.name,
          description: room.description,
          isPublic: room.is_public,
          maxParticipants: room.max_participants,
          roomCode: room.room_code,
          updatedAt: room.updated_at,
        }
      },
      message: 'Room updated successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Update room error:', error);
    throw new AppError('Failed to update room', 500, 'ROOM_UPDATE_ERROR');
  }
};

export const deleteRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const userId = req.user!.id;

  try {
    // Check if user owns the room
    const roomResult = await query(
      'SELECT owner_id FROM rooms WHERE id = $1',
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
    }

    if (roomResult.rows[0].owner_id !== userId) {
      throw new AppError('Not authorized to delete this room', 403, 'ROOM_DELETE_UNAUTHORIZED');
    }

    // Delete room
    await query('DELETE FROM rooms WHERE id = $1', [roomId]);

    // Remove from cache
    await roomCache.delRoom(roomId);

    logRoom('delete', roomId, userId);

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Delete room error:', error);
    throw new AppError('Failed to delete room', 500, 'ROOM_DELETE_ERROR');
  }
};

export const joinRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const { password } = req.body;
  const userId = req.user!.id;

  try {
    // Get room details
    const roomResult = await query(
      'SELECT * FROM rooms WHERE id = $1',
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
    }

    const room = roomResult.rows[0];

    // Check password if required
    if (room.password && room.password !== password) {
      throw new AppError('Invalid room password', 401, 'INVALID_ROOM_PASSWORD');
    }

    // Check if room is full
    const participants = await roomCache.getParticipants(roomId);
    if (participants.length >= room.max_participants) {
      throw new AppError('Room is full', 409, 'ROOM_FULL');
    }

    // Add user to room
    await roomCache.addParticipant(roomId, userId);

    logRoom('join', roomId, userId);

    res.json({
      success: true,
      data: {
        room: {
          id: room.id,
          name: room.name,
          description: room.description,
          isPublic: room.is_public,
          maxParticipants: room.max_participants,
          roomCode: room.room_code,
        }
      },
      message: 'Joined room successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Join room error:', error);
    throw new AppError('Failed to join room', 500, 'ROOM_JOIN_ERROR');
  }
};

export const leaveRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const userId = req.user!.id;

  try {
    // Remove user from room
    await roomCache.removeParticipant(roomId, userId);

    logRoom('leave', roomId, userId);

    res.json({
      success: true,
      message: 'Left room successfully'
    });
  } catch (error) {
    logger.error('Leave room error:', error);
    throw new AppError('Failed to leave room', 500, 'ROOM_LEAVE_ERROR');
  }
};

export const getRooms = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 20, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    let whereClause = 'WHERE is_public = true';
    const values = [];
    let paramCount = 1;

    if (search) {
      whereClause += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    // Get rooms
    const roomsResult = await query(
      `SELECT r.*, COUNT(p.user_id) as participant_count
       FROM rooms r
       LEFT JOIN room_participants p ON r.id = p.room_id
       ${whereClause}
       GROUP BY r.id
       ORDER BY r.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, Number(limit), offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM rooms ${whereClause}`,
      values
    );

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        rooms: roomsResult.rows.map(room => ({
          id: room.id,
          name: room.name,
          description: room.description,
          isPublic: room.is_public,
          maxParticipants: room.max_participants,
          participantCount: parseInt(room.participant_count),
          roomCode: room.room_code,
          createdAt: room.created_at,
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
    logger.error('Get rooms error:', error);
    throw new AppError('Failed to get rooms', 500, 'ROOMS_GET_ERROR');
  }
};
