import { Request, Response } from 'express';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { AppError } from '@shared';

export const getTrendingRooms = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 20, category = 'all' } = req.query;

  try {
    const offset = (Number(page) - 1) * Number(limit);

    // Build trending query with weighted scoring
    let whereClause = '';
    const values = [];
    let paramCount = 1;

    if (category !== 'all') {
      whereClause = `AND r.category = $${paramCount}`;
      values.push(category);
      paramCount++;
    }

    const trendingQuery = `
      SELECT 
        r.id,
        r.name,
        r.description,
        r.thumbnail_url,
        r.is_public,
        r.room_code,
        r.max_participants,
        r.current_video_id,
        r.is_playing,
        r.current_time,
        r.created_at,
        r.updated_at,
        u.id as owner_id,
        u.username as owner_username,
        u.avatar_url as owner_avatar,
        COUNT(DISTINCT rp.user_id) as participant_count,
        COUNT(DISTINCT rl.id) as likes_count,
        COUNT(DISTINCT rv.id) as views_count,
        -- Trending score calculation
        (
          COUNT(DISTINCT rp.user_id) * 2 +  -- Active participants
          COUNT(DISTINCT rl.id) * 3 +       -- Likes
          COUNT(DISTINCT rv.id) * 1 +       -- Views
          CASE 
            WHEN r.is_playing THEN 5        -- Currently playing bonus
            ELSE 0 
          END +
          CASE 
            WHEN r.created_at > NOW() - INTERVAL '1 hour' THEN 3  -- Recent room bonus
            WHEN r.created_at > NOW() - INTERVAL '24 hours' THEN 1
            ELSE 0 
          END
        ) as trending_score
      FROM rooms r
      JOIN users u ON r.owner_id = u.id
      LEFT JOIN room_participants rp ON r.id = rp.room_id
      LEFT JOIN room_likes rl ON r.id = rl.room_id
      LEFT JOIN room_views rv ON r.id = rv.room_id
      WHERE r.is_public = true ${whereClause}
      GROUP BY r.id, u.id, u.username, u.avatar_url
      HAVING COUNT(DISTINCT rp.user_id) > 0  -- Only rooms with participants
      ORDER BY trending_score DESC, r.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(Number(limit), offset);

    const result = await query(trendingQuery, values);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM rooms r
      LEFT JOIN room_participants rp ON r.id = rp.room_id
      WHERE r.is_public = true ${whereClause}
      HAVING COUNT(DISTINCT rp.user_id) > 0
    `;

    const countResult = await query(countQuery, values.slice(0, -2));
    const total = parseInt(countResult.rows[0]?.total || '0');

    res.json({
      success: true,
      data: {
        rooms: result.rows.map(room => ({
          id: room.id,
          name: room.name,
          description: room.description,
          thumbnail: room.thumbnail_url,
          isPublic: room.is_public,
          roomCode: room.room_code,
          maxParticipants: room.max_participants,
          currentVideoId: room.current_video_id,
          isPlaying: room.is_playing,
          currentTime: room.current_time,
          createdAt: room.created_at,
          updatedAt: room.updated_at,
          owner: {
            id: room.owner_id,
            username: room.owner_username,
            avatar: room.owner_avatar,
          },
          stats: {
            participantCount: parseInt(room.participant_count),
            likesCount: parseInt(room.likes_count),
            viewsCount: parseInt(room.views_count),
            trendingScore: parseFloat(room.trending_score),
          }
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
    logger.error('Get trending rooms error:', error);
    throw new AppError('Failed to get trending rooms', 500, 'TRENDING_ROOMS_ERROR');
  }
};

export const getTrendingUsers = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 20 } = req.query;

  try {
    const offset = (Number(page) - 1) * Number(limit);

    const trendingQuery = `
      SELECT 
        u.id,
        u.username,
        u.avatar_url,
        u.is_online,
        u.last_seen,
        u.followers_count,
        u.following_count,
        u.rooms_created,
        u.total_views,
        u.created_at,
        -- Trending score for users
        (
          u.followers_count * 2 +           -- Followers
          u.rooms_created * 3 +            -- Rooms created
          u.total_views * 0.1 +            -- Total views
          CASE 
            WHEN u.is_online THEN 5        -- Online bonus
            ELSE 0 
          END +
          CASE 
            WHEN u.created_at > NOW() - INTERVAL '7 days' THEN 2  -- New user bonus
            ELSE 0 
          END
        ) as trending_score,
        -- Current room info
        r.id as current_room_id,
        r.name as current_room_name,
        COUNT(DISTINCT rp2.user_id) as current_room_participants
      FROM users u
      LEFT JOIN rooms r ON u.id = r.owner_id AND r.is_playing = true
      LEFT JOIN room_participants rp2 ON r.id = rp2.room_id
      WHERE u.followers_count > 0 OR u.rooms_created > 0  -- Only users with activity
      GROUP BY u.id, r.id, r.name
      ORDER BY trending_score DESC, u.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await query(trendingQuery, [Number(limit), offset]);

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM users WHERE followers_count > 0 OR rooms_created > 0'
    );
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        users: result.rows.map(user => ({
          id: user.id,
          username: user.username,
          avatar: user.avatar_url,
          isOnline: user.is_online,
          lastSeen: user.last_seen,
          stats: {
            followersCount: user.followers_count,
            followingCount: user.following_count,
            roomsCreated: user.rooms_created,
            totalViews: user.total_views,
            trendingScore: parseFloat(user.trending_score),
          },
          currentRoom: user.current_room_id ? {
            id: user.current_room_id,
            name: user.current_room_name,
            participantCount: parseInt(user.current_room_participants),
          } : null,
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
    logger.error('Get trending users error:', error);
    throw new AppError('Failed to get trending users', 500, 'TRENDING_USERS_ERROR');
  }
};

export const getRoomCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = [
      { id: 'all', name: 'All', icon: '🎵', count: 0 },
      { id: 'hip-hop', name: 'Hip Hop', icon: '🎤', count: 0 },
      { id: 'electronic', name: 'Electronic', icon: '🎧', count: 0 },
      { id: 'pop', name: 'Pop', icon: '🎶', count: 0 },
      { id: 'rock', name: 'Rock', icon: '🎸', count: 0 },
      { id: 'jazz', name: 'Jazz', icon: '🎷', count: 0 },
      { id: 'classical', name: 'Classical', icon: '🎼', count: 0 },
      { id: 'reggae', name: 'Reggae', icon: '🌴', count: 0 },
      { id: 'country', name: 'Country', icon: '🤠', count: 0 },
      { id: 'indie', name: 'Indie', icon: '🎨', count: 0 }
    ];

    // Get room counts for each category
    for (const category of categories) {
      if (category.id === 'all') {
        const result = await query(
          'SELECT COUNT(*) as count FROM rooms WHERE is_public = true'
        );
        category.count = parseInt(result.rows[0].count);
      } else {
        const result = await query(
          'SELECT COUNT(*) as count FROM rooms WHERE is_public = true AND category = $1',
          [category.id]
        );
        category.count = parseInt(result.rows[0].count);
      }
    }

    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    logger.error('Get room categories error:', error);
    throw new AppError('Failed to get room categories', 500, 'CATEGORIES_ERROR');
  }
};
