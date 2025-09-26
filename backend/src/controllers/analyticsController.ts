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

// Get user engagement metrics
export const getUserEngagement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { period = '30d' } = req.query;

  try {
    let dateFilter = '';
    const values = [userId];
    let paramCount = 1;

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
      case '1y':
        dateFilter = `AND created_at >= NOW() - INTERVAL '1 year'`;
        break;
    }

    // Get user stats
    const userStatsQuery = `
      SELECT 
        u.id,
        u.username,
        u.created_at as joined_at,
        u.followers_count,
        u.following_count,
        u.rooms_created,
        u.total_views,
        u.is_online,
        u.last_seen
      FROM users u
      WHERE u.id = $1
    `;

    const userStats = await query(userStatsQuery, [userId]);

    if (userStats.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Get room participation stats
    const roomStatsQuery = `
      SELECT 
        COUNT(DISTINCT rp.room_id) as rooms_joined,
        COUNT(DISTINCT CASE WHEN rp.is_host THEN rp.room_id END) as rooms_hosted,
        COUNT(DISTINCT CASE WHEN rp.is_co_host THEN rp.room_id END) as rooms_co_hosted,
        AVG(EXTRACT(EPOCH FROM (rp.last_activity - rp.joined_at))/3600) as avg_session_hours
      FROM room_participants rp
      WHERE rp.user_id = $1 ${dateFilter}
    `;

    const roomStats = await query(roomStatsQuery, [userId]);

    // Get social engagement
    const socialStatsQuery = `
      SELECT 
        COUNT(DISTINCT uf.follower_id) as new_followers,
        COUNT(DISTINCT uf2.following_id) as new_following,
        COUNT(DISTINCT rl.room_id) as rooms_liked,
        COUNT(DISTINCT rv.room_id) as rooms_viewed
      FROM users u
      LEFT JOIN user_follows uf ON uf.following_id = u.id ${dateFilter.replace('created_at', 'uf.created_at')}
      LEFT JOIN user_follows uf2 ON uf2.follower_id = u.id ${dateFilter.replace('created_at', 'uf2.created_at')}
      LEFT JOIN room_likes rl ON rl.user_id = u.id ${dateFilter.replace('created_at', 'rl.created_at')}
      LEFT JOIN room_views rv ON rv.user_id = u.id ${dateFilter.replace('created_at', 'rv.created_at')}
      WHERE u.id = $1
    `;

    const socialStats = await query(socialStatsQuery, [userId]);

    // Get activity timeline
    const activityQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as activity_count,
        'room_join' as activity_type
      FROM room_participants 
      WHERE user_id = $1 ${dateFilter}
      GROUP BY DATE(created_at)
      
      UNION ALL
      
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as activity_count,
        'follow' as activity_type
      FROM user_follows 
      WHERE follower_id = $1 ${dateFilter.replace('created_at', 'created_at')}
      GROUP BY DATE(created_at)
      
      ORDER BY date DESC
      LIMIT 30
    `;

    const activityTimeline = await query(activityQuery, [userId]);

    res.json({
      success: true,
      data: {
        user: userStats.rows[0],
        roomStats: roomStats.rows[0],
        socialStats: socialStats.rows[0],
        activityTimeline: activityTimeline.rows,
        period
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Get user engagement error:', error);
    throw new AppError('Failed to get user engagement', 500, 'ENGAGEMENT_ERROR');
  }
};

// Get room analytics
export const getRoomAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const { period = '30d' } = req.query;

  try {
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

    // Get room basic stats
    const roomStatsQuery = `
      SELECT 
        r.id,
        r.name,
        r.description,
        r.created_at,
        r.updated_at,
        u.username as owner_username,
        COUNT(DISTINCT rp.user_id) as total_participants,
        COUNT(DISTINCT rl.user_id) as total_likes,
        COUNT(DISTINCT rv.user_id) as total_views,
        AVG(EXTRACT(EPOCH FROM (rp.last_activity - rp.joined_at))/3600) as avg_session_hours
      FROM rooms r
      LEFT JOIN users u ON r.owner_id = u.id
      LEFT JOIN room_participants rp ON r.id = rp.room_id
      LEFT JOIN room_likes rl ON r.id = rl.room_id
      LEFT JOIN room_views rv ON r.id = rv.room_id
      WHERE r.id = $1
      GROUP BY r.id, u.username
    `;

    const roomStats = await query(roomStatsQuery, [roomId]);

    if (roomStats.rows.length === 0) {
      throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
    }

    // Get participant engagement
    const participantEngagementQuery = `
      SELECT 
        u.id,
        u.username,
        u.avatar_url,
        rp.joined_at,
        rp.last_activity,
        EXTRACT(EPOCH FROM (rp.last_activity - rp.joined_at))/3600 as session_hours,
        rp.is_host,
        rp.is_co_host
      FROM room_participants rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.room_id = $1
      ORDER BY rp.joined_at DESC
    `;

    const participantEngagement = await query(participantEngagementQuery, [roomId]);

    // Get room events timeline
    const eventsQuery = `
      SELECT 
        event_type,
        COUNT(*) as event_count,
        DATE(created_at) as date
      FROM room_events 
      WHERE room_id = $1 ${dateFilter}
      GROUP BY event_type, DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    const roomEvents = await query(eventsQuery, [roomId]);

    // Get peak hours
    const peakHoursQuery = `
      SELECT 
        EXTRACT(HOUR FROM joined_at) as hour,
        COUNT(*) as join_count
      FROM room_participants 
      WHERE room_id = $1 ${dateFilter}
      GROUP BY EXTRACT(HOUR FROM joined_at)
      ORDER BY join_count DESC
      LIMIT 10
    `;

    const peakHours = await query(peakHoursQuery, [roomId]);

    res.json({
      success: true,
      data: {
        room: roomStats.rows[0],
        participantEngagement: participantEngagement.rows,
        roomEvents: roomEvents.rows,
        peakHours: peakHours.rows,
        period
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Get room analytics error:', error);
    throw new AppError('Failed to get room analytics', 500, 'ROOM_ANALYTICS_ERROR');
  }
};

// Get platform analytics (admin only)
export const getPlatformAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { period = '30d' } = req.query;

  try {
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

    // Get platform overview
    const platformStatsQuery = `
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT r.id) as total_rooms,
        COUNT(DISTINCT rp.user_id) as active_users,
        COUNT(DISTINCT uf.id) as total_follows,
        COUNT(DISTINCT rl.id) as total_likes,
        COUNT(DISTINCT rv.id) as total_views
      FROM users u
      LEFT JOIN rooms r ON r.owner_id = u.id
      LEFT JOIN room_participants rp ON rp.user_id = u.id ${dateFilter.replace('created_at', 'rp.joined_at')}
      LEFT JOIN user_follows uf ON uf.follower_id = u.id OR uf.following_id = u.id ${dateFilter.replace('created_at', 'uf.created_at')}
      LEFT JOIN room_likes rl ON rl.user_id = u.id ${dateFilter.replace('created_at', 'rl.created_at')}
      LEFT JOIN room_views rv ON rv.user_id = u.id ${dateFilter.replace('created_at', 'rv.created_at')}
    `;

    const platformStats = await query(platformStatsQuery);

    // Get user growth
    const userGrowthQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '${period === '7d' ? '7' : period === '30d' ? '30' : '90'} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    const userGrowth = await query(userGrowthQuery);

    // Get room creation trends
    const roomTrendsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_rooms
      FROM rooms 
      WHERE created_at >= NOW() - INTERVAL '${period === '7d' ? '7' : period === '30d' ? '30' : '90'} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    const roomTrends = await query(roomTrendsQuery);

    // Get top rooms
    const topRoomsQuery = `
      SELECT 
        r.id,
        r.name,
        r.description,
        u.username as owner_username,
        COUNT(DISTINCT rp.user_id) as participant_count,
        COUNT(DISTINCT rl.user_id) as like_count,
        COUNT(DISTINCT rv.user_id) as view_count
      FROM rooms r
      JOIN users u ON r.owner_id = u.id
      LEFT JOIN room_participants rp ON r.id = rp.room_id
      LEFT JOIN room_likes rl ON r.id = rl.room_id
      LEFT JOIN room_views rv ON r.id = rv.room_id
      WHERE r.created_at >= NOW() - INTERVAL '${period === '7d' ? '7' : period === '30d' ? '30' : '90'} days'
      GROUP BY r.id, r.name, r.description, u.username
      ORDER BY participant_count DESC, like_count DESC
      LIMIT 10
    `;

    const topRooms = await query(topRoomsQuery);

    // Get user retention
    const retentionQuery = `
      SELECT 
        DATE(joined_at) as cohort_date,
        COUNT(DISTINCT user_id) as cohort_size,
        COUNT(DISTINCT CASE WHEN last_activity >= joined_at + INTERVAL '1 day' THEN user_id END) as day_1_retention,
        COUNT(DISTINCT CASE WHEN last_activity >= joined_at + INTERVAL '7 days' THEN user_id END) as day_7_retention,
        COUNT(DISTINCT CASE WHEN last_activity >= joined_at + INTERVAL '30 days' THEN user_id END) as day_30_retention
      FROM room_participants 
      WHERE joined_at >= NOW() - INTERVAL '${period === '7d' ? '7' : period === '30d' ? '30' : '90'} days'
      GROUP BY DATE(joined_at)
      ORDER BY cohort_date DESC
      LIMIT 30
    `;

    const retention = await query(retentionQuery);

    res.json({
      success: true,
      data: {
        platform: platformStats.rows[0],
        userGrowth: userGrowth.rows,
        roomTrends: roomTrends.rows,
        topRooms: topRooms.rows,
        retention: retention.rows,
        period
      }
    });
  } catch (error) {
    logger.error('Get platform analytics error:', error);
    throw new AppError('Failed to get platform analytics', 500, 'PLATFORM_ANALYTICS_ERROR');
  }
};

// Track user event
export const trackEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { eventType, eventData, roomId } = req.body;
  const userId = req.user!.id;

  try {
    // Insert event into analytics
    await query(
      `INSERT INTO user_events (id, user_id, event_type, event_data, room_id, created_at)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW())`,
      [userId, eventType, JSON.stringify(eventData), roomId]
    );

    logger.info('User event tracked', { userId, eventType, roomId });

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    logger.error('Track event error:', error);
    throw new AppError('Failed to track event', 500, 'EVENT_TRACKING_ERROR');
  }
};
