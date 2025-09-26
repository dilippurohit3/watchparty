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

// Request control from a participant
export const requestControl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const userId = req.user!.id;

  try {
    // Check if user is in the room
    const participantResult = await query(
      'SELECT * FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );

    if (participantResult.rows.length === 0) {
      throw new AppError('User not in room', 403, 'NOT_IN_ROOM');
    }

    // Check if user is already host or co-host
    const participant = participantResult.rows[0];
    if (participant.is_host || participant.is_co_host) {
      throw new AppError('Already has control', 400, 'ALREADY_HAS_CONTROL');
    }

    // Check if there's already a pending request
    const existingRequest = await query(
      'SELECT * FROM control_requests WHERE room_id = $1 AND user_id = $2 AND status = $3',
      [roomId, userId, 'pending']
    );

    if (existingRequest.rows.length > 0) {
      throw new AppError('Request already pending', 409, 'REQUEST_PENDING');
    }

    // Create control request
    await query(
      `INSERT INTO control_requests (id, room_id, user_id, status, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [generateId(), roomId, userId, 'pending']
    );

    logger.info('Control request created', { roomId, userId });

    res.json({
      success: true,
      message: 'Control request sent successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Request control error:', error);
    throw new AppError('Failed to request control', 500, 'REQUEST_CONTROL_ERROR');
  }
};

// Approve control request (host only)
export const approveControlRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId, requestId } = req.params;
  const hostId = req.user!.id;

  try {
    // Verify host permissions
    const hostResult = await query(
      'SELECT * FROM room_participants WHERE room_id = $1 AND user_id = $2 AND is_host = true',
      [roomId, hostId]
    );

    if (hostResult.rows.length === 0) {
      throw new AppError('Not authorized to approve requests', 403, 'NOT_HOST');
    }

    // Get the control request
    const requestResult = await query(
      'SELECT * FROM control_requests WHERE id = $1 AND room_id = $2 AND status = $3',
      [requestId, roomId, 'pending']
    );

    if (requestResult.rows.length === 0) {
      throw new AppError('Request not found or already processed', 404, 'REQUEST_NOT_FOUND');
    }

    const request = requestResult.rows[0];

    // Start transaction
    await transaction(async (client) => {
      // Update request status
      await client.query(
        'UPDATE control_requests SET status = $1, approved_at = NOW() WHERE id = $2',
        ['approved', requestId]
      );

      // Make user co-host
      await client.query(
        'UPDATE room_participants SET is_co_host = true WHERE room_id = $1 AND user_id = $2',
        [roomId, request.user_id]
      );

      // Log the event
      await client.query(
        `INSERT INTO room_events (id, room_id, user_id, event_type, event_data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [generateId(), roomId, request.user_id, 'co_host_granted', JSON.stringify({
          granted_by: hostId,
          timestamp: new Date().toISOString()
        })]
      );
    });

    logger.info('Control request approved', { roomId, requestId, userId: request.user_id });

    res.json({
      success: true,
      message: 'Control request approved successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Approve control request error:', error);
    throw new AppError('Failed to approve control request', 500, 'APPROVE_REQUEST_ERROR');
  }
};

// Reject control request (host only)
export const rejectControlRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId, requestId } = req.params;
  const hostId = req.user!.id;

  try {
    // Verify host permissions
    const hostResult = await query(
      'SELECT * FROM room_participants WHERE room_id = $1 AND user_id = $2 AND is_host = true',
      [roomId, hostId]
    );

    if (hostResult.rows.length === 0) {
      throw new AppError('Not authorized to reject requests', 403, 'NOT_HOST');
    }

    // Update request status
    await query(
      'UPDATE control_requests SET status = $1, rejected_at = NOW() WHERE id = $2 AND room_id = $3',
      ['rejected', requestId, roomId]
    );

    logger.info('Control request rejected', { roomId, requestId });

    res.json({
      success: true,
      message: 'Control request rejected'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Reject control request error:', error);
    throw new AppError('Failed to reject control request', 500, 'REJECT_REQUEST_ERROR');
  }
};

// Get pending control requests (host only)
export const getControlRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const hostId = req.user!.id;

  try {
    // Verify host permissions
    const hostResult = await query(
      'SELECT * FROM room_participants WHERE room_id = $1 AND user_id = $2 AND is_host = true',
      [roomId, hostId]
    );

    if (hostResult.rows.length === 0) {
      throw new AppError('Not authorized to view requests', 403, 'NOT_HOST');
    }

    // Get pending requests
    const requestsResult = await query(
      `SELECT 
        cr.id, cr.user_id, cr.status, cr.created_at,
        u.username, u.avatar_url, u.is_online
       FROM control_requests cr
       JOIN users u ON cr.user_id = u.id
       WHERE cr.room_id = $1 AND cr.status = $2
       ORDER BY cr.created_at ASC`,
      [roomId, 'pending']
    );

    res.json({
      success: true,
      data: {
        requests: requestsResult.rows.map(req => ({
          id: req.id,
          userId: req.user_id,
          username: req.username,
          avatar: req.avatar_url,
          isOnline: req.is_online,
          status: req.status,
          createdAt: req.created_at
        }))
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Get control requests error:', error);
    throw new AppError('Failed to get control requests', 500, 'GET_REQUESTS_ERROR');
  }
};

// Remove co-host privileges (host only)
export const removeCoHost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId, userId } = req.params;
  const hostId = req.user!.id;

  try {
    // Verify host permissions
    const hostResult = await query(
      'SELECT * FROM room_participants WHERE room_id = $1 AND user_id = $2 AND is_host = true',
      [roomId, hostId]
    );

    if (hostResult.rows.length === 0) {
      throw new AppError('Not authorized to remove co-hosts', 403, 'NOT_HOST');
    }

    // Remove co-host status
    await query(
      'UPDATE room_participants SET is_co_host = false WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );

    // Log the event
    await query(
      `INSERT INTO room_events (id, room_id, user_id, event_type, event_data, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [generateId(), roomId, userId, 'co_host_removed', JSON.stringify({
        removed_by: hostId,
        timestamp: new Date().toISOString()
      })]
    );

    logger.info('Co-host removed', { roomId, userId, removedBy: hostId });

    res.json({
      success: true,
      message: 'Co-host privileges removed'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Remove co-host error:', error);
    throw new AppError('Failed to remove co-host', 500, 'REMOVE_CO_HOST_ERROR');
  }
};

// Transfer host privileges (host only)
export const transferHost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId, newHostId } = req.body;
  const currentHostId = req.user!.id;

  try {
    // Verify current host permissions
    const hostResult = await query(
      'SELECT * FROM room_participants WHERE room_id = $1 AND user_id = $2 AND is_host = true',
      [roomId, currentHostId]
    );

    if (hostResult.rows.length === 0) {
      throw new AppError('Not authorized to transfer host', 403, 'NOT_HOST');
    }

    // Verify new host is in the room
    const newHostResult = await query(
      'SELECT * FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [roomId, newHostId]
    );

    if (newHostResult.rows.length === 0) {
      throw new AppError('New host not in room', 404, 'NEW_HOST_NOT_IN_ROOM');
    }

    // Start transaction
    await transaction(async (client) => {
      // Remove current host status
      await client.query(
        'UPDATE room_participants SET is_host = false WHERE room_id = $1 AND user_id = $2',
        [roomId, currentHostId]
      );

      // Make new user host
      await client.query(
        'UPDATE room_participants SET is_host = true, is_co_host = false WHERE room_id = $1 AND user_id = $2',
        [roomId, newHostId]
      );

      // Log the event
      await client.query(
        `INSERT INTO room_events (id, room_id, user_id, event_type, event_data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [generateId(), roomId, newHostId, 'host_transferred', JSON.stringify({
          from: currentHostId,
          to: newHostId,
          timestamp: new Date().toISOString()
        })]
      );
    });

    logger.info('Host transferred', { roomId, from: currentHostId, to: newHostId });

    res.json({
      success: true,
      message: 'Host privileges transferred successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Transfer host error:', error);
    throw new AppError('Failed to transfer host', 500, 'TRANSFER_HOST_ERROR');
  }
};
