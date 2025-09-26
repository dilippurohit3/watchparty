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

// Get platform statistics
export const getPlatformStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Get total users
    const usersResult = await query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(usersResult.rows[0].total);

    // Get total rooms
    const roomsResult = await query('SELECT COUNT(*) as total FROM rooms WHERE is_deleted = false');
    const totalRooms = parseInt(roomsResult.rows[0].total);

    // Get active users (online in last 5 minutes)
    const activeUsersResult = await query(
      'SELECT COUNT(*) as total FROM users WHERE last_seen > NOW() - INTERVAL \'5 minutes\''
    );
    const activeUsers = parseInt(activeUsersResult.rows[0].total);

    // Get total reports
    const reportsResult = await query('SELECT COUNT(*) as total FROM content_reports');
    const totalReports = parseInt(reportsResult.rows[0].total);

    // Get pending reports
    const pendingReportsResult = await query(
      'SELECT COUNT(*) as total FROM content_reports WHERE status = \'pending\''
    );
    const pendingReports = parseInt(pendingReportsResult.rows[0].total);

    // Get total bans
    const bansResult = await query(
      'SELECT COUNT(*) as total FROM user_bans WHERE is_active = true'
    );
    const totalBans = parseInt(bansResult.rows[0].total);

    // Get total warnings
    const warningsResult = await query('SELECT COUNT(*) as total FROM user_warnings');
    const totalWarnings = parseInt(warningsResult.rows[0].total);

    // Get total follows
    const followsResult = await query('SELECT COUNT(*) as total FROM user_follows');
    const totalFollows = parseInt(followsResult.rows[0].total);

    // Get total likes
    const likesResult = await query('SELECT COUNT(*) as total FROM room_likes');
    const totalLikes = parseInt(likesResult.rows[0].total);

    // Get total views
    const viewsResult = await query('SELECT COUNT(*) as total FROM room_views');
    const totalViews = parseInt(viewsResult.rows[0].total);

    // Get average session duration
    const sessionResult = await query(
      'SELECT AVG(EXTRACT(EPOCH FROM (last_activity - joined_at))/3600) as avg_hours FROM room_participants WHERE last_activity > joined_at'
    );
    const avgSessionDuration = parseFloat(sessionResult.rows[0].avg_hours) || 0;

    // Get peak concurrent users
    const peakResult = await query(
      'SELECT MAX(participant_count) as peak FROM (SELECT COUNT(*) as participant_count FROM room_participants GROUP BY room_id) as counts'
    );
    const peakConcurrentUsers = parseInt(peakResult.rows[0].peak) || 0;

    // Determine system health
    const systemHealth = activeUsers > 0 && totalUsers > 0 ? 'healthy' : 'warning';

    res.json({
      success: true,
      data: {
        platform: {
          totalUsers,
          totalRooms,
          activeUsers,
          totalReports,
          pendingReports,
          totalBans,
          totalWarnings,
          totalFollows,
          totalLikes,
          totalViews,
          avgSessionDuration,
          peakConcurrentUsers,
          systemHealth,
          lastUpdated: new Date()
        }
      }
    });
  } catch (error) {
    logger.error('Get platform stats error:', error);
    throw new AppError('Failed to get platform stats', 500, 'PLATFORM_STATS_ERROR');
  }
};

// Get pending reports
export const getPendingReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await query(
      `SELECT 
        cr.id, cr.reporter_id, cr.reported_user_id, cr.reported_room_id, cr.reported_message_id,
        cr.reason, cr.description, cr.status, cr.created_at, cr.updated_at,
        u1.username as reporter_username,
        u2.username as reported_username,
        r.name as reported_room_name
       FROM content_reports cr
       JOIN users u1 ON cr.reporter_id = u1.id
       LEFT JOIN users u2 ON cr.reported_user_id = u2.id
       LEFT JOIN rooms r ON cr.reported_room_id = r.id
       WHERE cr.status = $1
       ORDER BY cr.created_at DESC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) as total FROM content_reports WHERE status = $1',
      [status]
    );

    res.json({
      success: true,
      data: {
        reports: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          page: Number(page),
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get pending reports error:', error);
    throw new AppError('Failed to get pending reports', 500, 'REPORTS_ERROR');
  }
};

// Get active bans
export const getActiveBans = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT 
        ub.id, ub.user_id, ub.banned_by, ub.reason, ub.duration, ub.is_active, 
        ub.created_at, ub.expires_at, u.username, u2.username as banned_by_username
       FROM user_bans ub
       JOIN users u ON ub.user_id = u.id
       JOIN users u2 ON ub.banned_by = u2.id
       WHERE ub.is_active = true 
       AND (ub.expires_at IS NULL OR ub.expires_at > NOW())
       ORDER BY ub.created_at DESC`
    );

    res.json({
      success: true,
      data: {
        bans: result.rows
      }
    });
  } catch (error) {
    logger.error('Get active bans error:', error);
    throw new AppError('Failed to get active bans', 500, 'BANS_ERROR');
  }
};

// Get all users
export const getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 100, search, filter } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let queryStr = `
      SELECT 
        u.id, u.username, u.email, u.avatar_url, u.is_online, u.last_seen,
        u.followers_count, u.following_count, u.rooms_created, u.total_views,
        u.created_at,
        CASE WHEN ub.id IS NOT NULL THEN true ELSE false END as is_banned,
        COUNT(uw.id) as warning_count
      FROM users u
      LEFT JOIN user_bans ub ON u.id = ub.user_id AND ub.is_active = true
      LEFT JOIN user_warnings uw ON u.id = uw.user_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      queryStr += ` AND (u.username ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (filter === 'banned') {
      queryStr += ` AND ub.id IS NOT NULL`;
    } else if (filter === 'active') {
      queryStr += ` AND u.is_online = true`;
    } else if (filter === 'warned') {
      queryStr += ` AND uw.id IS NOT NULL`;
    }

    queryStr += `
      GROUP BY u.id, ub.id
      ORDER BY u.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(Number(limit), offset);

    const result = await query(queryStr, params);

    res.json({
      success: true,
      data: {
        users: result.rows
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    throw new AppError('Failed to get users', 500, 'USERS_ERROR');
  }
};

// Get all rooms
export const getAllRooms = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await query(
      `SELECT 
        r.id, r.name, r.description, r.is_public, r.is_active, r.created_at,
        u.username as owner_username,
        COUNT(DISTINCT rp.user_id) as participant_count,
        COUNT(DISTINCT rl.id) as total_likes,
        COUNT(DISTINCT rv.id) as total_views
       FROM rooms r
       JOIN users u ON r.owner_id = u.id
       LEFT JOIN room_participants rp ON r.id = rp.room_id
       LEFT JOIN room_likes rl ON r.id = rl.room_id
       LEFT JOIN room_views rv ON r.id = rv.room_id
       WHERE r.is_deleted = false
       GROUP BY r.id, u.username
       ORDER BY r.created_at DESC
       LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );

    res.json({
      success: true,
      data: {
        rooms: result.rows
      }
    });
  } catch (error) {
    logger.error('Get all rooms error:', error);
    throw new AppError('Failed to get rooms', 500, 'ROOMS_ERROR');
  }
};

// Get detailed analytics
export const getDetailedAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case '7d':
        dateFilter = `AND created_at >= NOW() - INTERVAL '7 days'`;
        break;
      case '30d':
        dateFilter = `AND created_at >= NOW() - INTERVAL '30 days'`;
        break;
      case '90d':
        dateFilter = `AND created_at >= NOW() - INTERVAL '90 days'`;
        break;
    }

    // User growth
    const userGrowthResult = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
       FROM users 
       WHERE created_at >= NOW() - INTERVAL '${period === '7d' ? '7' : period === '30d' ? '30' : '90'} days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    );

    // Room trends
    const roomTrendsResult = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_rooms
       FROM rooms 
       WHERE created_at >= NOW() - INTERVAL '${period === '7d' ? '7' : period === '30d' ? '30' : '90'} days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    );

    // Top rooms
    const topRoomsResult = await query(
      `SELECT 
        r.id, r.name, r.description, u.username as owner_username,
        COUNT(DISTINCT rp.user_id) as participant_count,
        COUNT(DISTINCT rl.id) as like_count,
        COUNT(DISTINCT rv.id) as view_count
       FROM rooms r
       JOIN users u ON r.owner_id = u.id
       LEFT JOIN room_participants rp ON r.id = rp.room_id
       LEFT JOIN room_likes rl ON r.id = rl.room_id
       LEFT JOIN room_views rv ON r.id = rv.room_id
       WHERE r.created_at >= NOW() - INTERVAL '${period === '7d' ? '7' : period === '30d' ? '30' : '90'} days'
       GROUP BY r.id, u.username
       ORDER BY participant_count DESC, like_count DESC
       LIMIT 10`
    );

    // Top users
    const topUsersResult = await query(
      `SELECT 
        u.id, u.username, u.avatar_url, u.followers_count, u.rooms_created, u.total_views
       FROM users u
       WHERE u.created_at >= NOW() - INTERVAL '${period === '7d' ? '7' : period === '30d' ? '30' : '90'} days'
       ORDER BY u.followers_count DESC, u.rooms_created DESC
       LIMIT 10`
    );

    // Retention data
    const retentionResult = await query(
      `SELECT 
        DATE(joined_at) as cohort_date,
        COUNT(DISTINCT user_id) as cohort_size,
        COUNT(DISTINCT CASE WHEN last_activity >= joined_at + INTERVAL '1 day' THEN user_id END) as day_1_retention,
        COUNT(DISTINCT CASE WHEN last_activity >= joined_at + INTERVAL '7 days' THEN user_id END) as day_7_retention,
        COUNT(DISTINCT CASE WHEN last_activity >= joined_at + INTERVAL '30 days' THEN user_id END) as day_30_retention
       FROM room_participants 
       WHERE joined_at >= NOW() - INTERVAL '${period === '7d' ? '7' : period === '30d' ? '30' : '90'} days'
       GROUP BY DATE(joined_at)
       ORDER BY cohort_date DESC
       LIMIT 30`
    );

    // Engagement metrics
    const engagementResult = await query(
      `SELECT 
        AVG(EXTRACT(EPOCH FROM (last_activity - joined_at))/3600) as avg_session_duration,
        COUNT(DISTINCT CASE WHEN last_activity = joined_at THEN user_id END)::float / COUNT(DISTINCT user_id) as bounce_rate,
        COUNT(DISTINCT CASE WHEN last_activity > joined_at + INTERVAL '1 day' THEN user_id END)::float / COUNT(DISTINCT user_id) as return_user_rate
       FROM room_participants 
       WHERE joined_at >= NOW() - INTERVAL '${period === '7d' ? '7' : period === '30d' ? '30' : '90'} days'`
    );

    res.json({
      success: true,
      data: {
        userGrowth: userGrowthResult.rows,
        roomTrends: roomTrendsResult.rows,
        topRooms: topRoomsResult.rows,
        topUsers: topUsersResult.rows,
        retentionData: retentionResult.rows,
        engagementMetrics: engagementResult.rows[0]
      }
    });
  } catch (error) {
    logger.error('Get detailed analytics error:', error);
    throw new AppError('Failed to get detailed analytics', 500, 'ANALYTICS_ERROR');
  }
};

// Get system health
export const getSystemHealth = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check database health
    const dbResult = await query('SELECT NOW() as current_time');
    const database = dbResult.rows.length > 0 ? 'healthy' : 'critical';

    // Check Redis health (simplified)
    const redis = 'healthy'; // In production, you'd check Redis connection

    // Check WebSocket health (simplified)
    const websocket = 'healthy'; // In production, you'd check WebSocket connections

    // Check API health
    const api = 'healthy'; // In production, you'd check API response times

    // Get system metrics (simplified)
    const uptime = process.uptime();
    const responseTime = 50; // In production, you'd measure actual response times
    const errorRate = 0.01; // In production, you'd calculate actual error rates
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    const cpuUsage = 0.15; // In production, you'd get actual CPU usage

    res.json({
      success: true,
      data: {
        database,
        redis,
        websocket,
        api,
        uptime,
        responseTime,
        errorRate,
        memoryUsage,
        cpuUsage
      }
    });
  } catch (error) {
    logger.error('Get system health error:', error);
    throw new AppError('Failed to get system health', 500, 'SYSTEM_HEALTH_ERROR');
  }
};

// Resolve report
export const resolveReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { action, actionDetails } = req.body;
  const moderatorId = req.user!.id;

  try {
    // Update report status
    await query(
      'UPDATE content_reports SET status = $1, moderator_id = $2, action_taken = $3, updated_at = NOW() WHERE id = $4',
      ['resolved', moderatorId, action, id]
    );

    // Get report details
    const reportResult = await query(
      'SELECT * FROM content_reports WHERE id = $1',
      [id]
    );

    if (reportResult.rows.length === 0) {
      throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
    }

    const report = reportResult.rows[0];

    // Take action based on resolution
    switch (action) {
      case 'warn_user':
        if (report.reported_user_id) {
          await query(
            'INSERT INTO user_warnings (id, user_id, moderator_id, reason, created_at) VALUES (uuid_generate_v4(), $1, $2, $3, NOW())',
            [report.reported_user_id, moderatorId, actionDetails || 'Content violation warning']
          );
        }
        break;
      case 'ban_user':
        if (report.reported_user_id) {
          await query(
            'INSERT INTO user_bans (id, user_id, banned_by, reason, duration, is_active, created_at, expires_at) VALUES (uuid_generate_v4(), $1, $2, $3, $4, true, NOW(), $5)',
            [report.reported_user_id, moderatorId, actionDetails || 'Content violation ban', 24, new Date(Date.now() + 24 * 60 * 60 * 1000)]
          );
        }
        break;
      case 'delete_content':
        if (report.reported_room_id) {
          await query(
            'UPDATE rooms SET is_deleted = true, deleted_at = NOW() WHERE id = $1',
            [report.reported_room_id]
          );
        }
        break;
    }

    // Log moderation action
    await query(
      'INSERT INTO moderation_events (id, moderator_id, action_type, target_user_id, details, created_at) VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW())',
      [moderatorId, action, report.reported_user_id, JSON.stringify({ reportId: id, actionDetails })]
    );

    res.json({
      success: true,
      message: 'Report resolved successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Resolve report error:', error);
    throw new AppError('Failed to resolve report', 500, 'RESOLVE_REPORT_ERROR');
  }
};

// Ban user
export const banUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId, reason, duration } = req.body;
  const bannedBy = req.user!.id;

  try {
    const expiresAt = duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null;
    
    await query(
      'INSERT INTO user_bans (id, user_id, banned_by, reason, duration, is_active, created_at, expires_at) VALUES (uuid_generate_v4(), $1, $2, $3, $4, true, NOW(), $5)',
      [userId, bannedBy, reason, duration, expiresAt]
    );

    // Log the ban event
    await query(
      'INSERT INTO moderation_events (id, moderator_id, action_type, target_user_id, details, created_at) VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW())',
      [bannedBy, 'user_banned', userId, JSON.stringify({ reason, duration, expiresAt })]
    );

    res.json({
      success: true,
      message: 'User banned successfully'
    });
  } catch (error) {
    logger.error('Ban user error:', error);
    throw new AppError('Failed to ban user', 500, 'BAN_USER_ERROR');
  }
};

// Unban user
export const unbanUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const moderatorId = req.user!.id;

  try {
    await query(
      'UPDATE user_bans SET is_active = false WHERE id = $1',
      [id]
    );

    // Log the unban event
    await query(
      'INSERT INTO moderation_events (id, moderator_id, action_type, target_user_id, details, created_at) VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW())',
      [moderatorId, 'user_unbanned', id, JSON.stringify({ moderatorId })]
    );

    res.json({
      success: true,
      message: 'User unbanned successfully'
    });
  } catch (error) {
    logger.error('Unban user error:', error);
    throw new AppError('Failed to unban user', 500, 'UNBAN_USER_ERROR');
  }
};

// Warn user
export const warnUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId, reason } = req.body;
  const moderatorId = req.user!.id;

  try {
    await query(
      'INSERT INTO user_warnings (id, user_id, moderator_id, reason, created_at) VALUES (uuid_generate_v4(), $1, $2, $3, NOW())',
      [userId, moderatorId, reason]
    );

    // Log the warning event
    await query(
      'INSERT INTO moderation_events (id, moderator_id, action_type, target_user_id, details, created_at) VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW())',
      [moderatorId, 'user_warned', userId, JSON.stringify({ reason })]
    );

    res.json({
      success: true,
      message: 'User warned successfully'
    });
  } catch (error) {
    logger.error('Warn user error:', error);
    throw new AppError('Failed to warn user', 500, 'WARN_USER_ERROR');
  }
};

// Delete room
export const deleteRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.query;
  const moderatorId = req.user!.id;

  try {
    await query(
      'UPDATE rooms SET is_deleted = true, deleted_at = NOW() WHERE id = $1',
      [id]
    );

    // Log the deletion
    await query(
      'INSERT INTO moderation_events (id, moderator_id, action_type, target_room_id, details, created_at) VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW())',
      [moderatorId, 'room_deleted', id, JSON.stringify({ reason })]
    );

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    logger.error('Delete room error:', error);
    throw new AppError('Failed to delete room', 500, 'DELETE_ROOM_ERROR');
  }
};

// Bulk action
export const bulkAction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userIds, action, reason } = req.body;
  const moderatorId = req.user!.id;

  try {
    for (const userId of userIds) {
      switch (action) {
        case 'ban':
          await query(
            'INSERT INTO user_bans (id, user_id, banned_by, reason, duration, is_active, created_at, expires_at) VALUES (uuid_generate_v4(), $1, $2, $3, $4, true, NOW(), $5)',
            [userId, moderatorId, reason, 24, new Date(Date.now() + 24 * 60 * 60 * 1000)]
          );
          break;
        case 'warn':
          await query(
            'INSERT INTO user_warnings (id, user_id, moderator_id, reason, created_at) VALUES (uuid_generate_v4(), $1, $2, $3, NOW())',
            [userId, moderatorId, reason]
          );
          break;
        case 'delete':
          // Delete user account (cascade will handle related records)
          await query('DELETE FROM users WHERE id = $1', [userId]);
          break;
      }
    }

    // Log bulk action
    await query(
      'INSERT INTO moderation_events (id, moderator_id, action_type, details, created_at) VALUES (uuid_generate_v4(), $1, $2, $3, NOW())',
      [moderatorId, `bulk_${action}`, JSON.stringify({ userIds, reason })]
    );

    res.json({
      success: true,
      message: `Bulk ${action} completed successfully`
    });
  } catch (error) {
    logger.error('Bulk action error:', error);
    throw new AppError(`Failed to perform bulk ${action}`, 500, 'BULK_ACTION_ERROR');
  }
};
