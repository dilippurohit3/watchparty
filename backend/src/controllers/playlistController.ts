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

export const getPlaylist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId } = req.params;

  try {
    // Check if user is in the room
    const roomCheck = await query(
      'SELECT 1 FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [roomId, req.user!.id]
    );

    if (roomCheck.rows.length === 0) {
      throw new AppError('Not authorized to view playlist in this room', 403, 'ROOM_ACCESS_DENIED');
    }

    // Get playlist with videos
    const result = await query(
      `SELECT 
        p.id as playlist_id,
        p.current_index,
        p.is_shuffled,
        p.repeat_mode,
        pv.position,
        v.id as video_id,
        v.title,
        v.url,
        v.thumbnail_url,
        v.duration,
        v.type,
        v.added_by,
        v.added_at
       FROM playlists p
       LEFT JOIN playlist_videos pv ON p.id = pv.playlist_id
       LEFT JOIN videos v ON pv.video_id = v.id
       WHERE p.room_id = $1
       ORDER BY pv.position ASC`,
      [roomId]
    );

    if (result.rows.length === 0) {
      // Create empty playlist if it doesn't exist
      await query(
        'INSERT INTO playlists (id, room_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
        [generateId(), roomId]
      );

      res.json({
        success: true,
        data: {
          id: null,
          roomId,
          videos: [],
          currentIndex: 0,
          isShuffled: false,
          repeatMode: 'none',
        }
      });
      return;
    }

    const playlist = result.rows[0];
    const videos = result.rows
      .filter(row => row.video_id)
      .map(row => ({
        id: row.video_id,
        title: row.title,
        url: row.url,
        thumbnail: row.thumbnail_url,
        duration: row.duration,
        type: row.type,
        addedBy: row.added_by,
        addedAt: row.added_at,
        position: row.position,
      }));

    res.json({
      success: true,
      data: {
        id: playlist.playlist_id,
        roomId,
        videos,
        currentIndex: playlist.current_index,
        isShuffled: playlist.is_shuffled,
        repeatMode: playlist.repeat_mode,
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Get playlist error:', error);
    throw new AppError('Failed to get playlist', 500, 'PLAYLIST_GET_ERROR');
  }
};

export const addVideo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const { videoId, title, url, thumbnail, duration, type } = req.body;
  const userId = req.user!.id;

  try {
    // Check if user is in the room
    const roomCheck = await query(
      'SELECT 1 FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );

    if (roomCheck.rows.length === 0) {
      throw new AppError('Not authorized to modify playlist in this room', 403, 'ROOM_ACCESS_DENIED');
    }

    // Get or create playlist
    let playlistResult = await query(
      'SELECT id FROM playlists WHERE room_id = $1',
      [roomId]
    );

    let playlistId = playlistResult.rows[0]?.id;

    if (!playlistId) {
      playlistId = generateId();
      await query(
        'INSERT INTO playlists (id, room_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
        [playlistId, roomId]
      );
    }

    // Create video if it doesn't exist
    let videoIdToUse = videoId;
    if (!videoId) {
      const videoResult = await query(
        `INSERT INTO videos (id, title, url, thumbnail_url, duration, type, added_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id`,
        [generateId(), title, url, thumbnail, duration, type, userId]
      );
      videoIdToUse = videoResult.rows[0].id;
    }

    // Get next position
    const positionResult = await query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM playlist_videos WHERE playlist_id = $1',
      [playlistId]
    );

    const nextPosition = positionResult.rows[0].next_position;

    // Add video to playlist
    await query(
      `INSERT INTO playlist_videos (id, playlist_id, video_id, position, added_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [generateId(), playlistId, videoIdToUse, nextPosition]
    );

    logger.info('Video added to playlist', {
      roomId,
      playlistId,
      videoId: videoIdToUse,
      position: nextPosition,
      userId
    });

    res.status(201).json({
      success: true,
      data: {
        videoId: videoIdToUse,
        position: nextPosition,
      },
      message: 'Video added to playlist successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Add video to playlist error:', error);
    throw new AppError('Failed to add video to playlist', 500, 'PLAYLIST_ADD_ERROR');
  }
};

export const removeVideo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId, videoId } = req.params;
  const userId = req.user!.id;

  try {
    // Check if user is in the room
    const roomCheck = await query(
      'SELECT 1 FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );

    if (roomCheck.rows.length === 0) {
      throw new AppError('Not authorized to modify playlist in this room', 403, 'ROOM_ACCESS_DENIED');
    }

    // Get playlist
    const playlistResult = await query(
      'SELECT id FROM playlists WHERE room_id = $1',
      [roomId]
    );

    if (playlistResult.rows.length === 0) {
      throw new AppError('Playlist not found', 404, 'PLAYLIST_NOT_FOUND');
    }

    const playlistId = playlistResult.rows[0].id;

    // Remove video from playlist
    const result = await query(
      'DELETE FROM playlist_videos WHERE playlist_id = $1 AND video_id = $2',
      [playlistId, videoId]
    );

    if (result.rowCount === 0) {
      throw new AppError('Video not found in playlist', 404, 'VIDEO_NOT_IN_PLAYLIST');
    }

    // Reorder remaining videos
    await query(
      `UPDATE playlist_videos 
       SET position = position - 1 
       WHERE playlist_id = $1 AND position > (
         SELECT position FROM playlist_videos WHERE playlist_id = $1 AND video_id = $2
       )`,
      [playlistId, videoId]
    );

    logger.info('Video removed from playlist', { roomId, playlistId, videoId, userId });

    res.json({
      success: true,
      message: 'Video removed from playlist successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Remove video from playlist error:', error);
    throw new AppError('Failed to remove video from playlist', 500, 'PLAYLIST_REMOVE_ERROR');
  }
};

export const reorderVideos = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const { videoIds } = req.body;
  const userId = req.user!.id;

  try {
    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      throw new AppError('Video IDs array required', 400, 'VIDEO_IDS_REQUIRED');
    }

    // Check if user is in the room
    const roomCheck = await query(
      'SELECT 1 FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );

    if (roomCheck.rows.length === 0) {
      throw new AppError('Not authorized to modify playlist in this room', 403, 'ROOM_ACCESS_DENIED');
    }

    // Get playlist
    const playlistResult = await query(
      'SELECT id FROM playlists WHERE room_id = $1',
      [roomId]
    );

    if (playlistResult.rows.length === 0) {
      throw new AppError('Playlist not found', 404, 'PLAYLIST_NOT_FOUND');
    }

    const playlistId = playlistResult.rows[0].id;

    // Update video positions in transaction
    await transaction(async (client) => {
      for (let i = 0; i < videoIds.length; i++) {
        await client.query(
          'UPDATE playlist_videos SET position = $1 WHERE playlist_id = $2 AND video_id = $3',
          [i, playlistId, videoIds[i]]
        );
      }
    });

    logger.info('Playlist reordered', { roomId, playlistId, videoIds, userId });

    res.json({
      success: true,
      message: 'Playlist reordered successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Reorder playlist error:', error);
    throw new AppError('Failed to reorder playlist', 500, 'PLAYLIST_REORDER_ERROR');
  }
};

export const clearPlaylist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const userId = req.user!.id;

  try {
    // Check if user is in the room
    const roomCheck = await query(
      'SELECT 1 FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );

    if (roomCheck.rows.length === 0) {
      throw new AppError('Not authorized to modify playlist in this room', 403, 'ROOM_ACCESS_DENIED');
    }

    // Get playlist
    const playlistResult = await query(
      'SELECT id FROM playlists WHERE room_id = $1',
      [roomId]
    );

    if (playlistResult.rows.length === 0) {
      throw new AppError('Playlist not found', 404, 'PLAYLIST_NOT_FOUND');
    }

    const playlistId = playlistResult.rows[0].id;

    // Clear playlist
    await query(
      'DELETE FROM playlist_videos WHERE playlist_id = $1',
      [playlistId]
    );

    // Reset current index
    await query(
      'UPDATE playlists SET current_index = 0, updated_at = NOW() WHERE id = $1',
      [playlistId]
    );

    logger.info('Playlist cleared', { roomId, playlistId, userId });

    res.json({
      success: true,
      message: 'Playlist cleared successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Clear playlist error:', error);
    throw new AppError('Failed to clear playlist', 500, 'PLAYLIST_CLEAR_ERROR');
  }
};

export const setCurrentVideo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const { videoId, currentIndex } = req.body;
  const userId = req.user!.id;

  try {
    // Check if user is in the room
    const roomCheck = await query(
      'SELECT 1 FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );

    if (roomCheck.rows.length === 0) {
      throw new AppError('Not authorized to modify playlist in this room', 403, 'ROOM_ACCESS_DENIED');
    }

    // Get playlist
    const playlistResult = await query(
      'SELECT id FROM playlists WHERE room_id = $1',
      [roomId]
    );

    if (playlistResult.rows.length === 0) {
      throw new AppError('Playlist not found', 404, 'PLAYLIST_NOT_FOUND');
    }

    const playlistId = playlistResult.rows[0].id;

    // Update current index
    await query(
      'UPDATE playlists SET current_index = $1, updated_at = NOW() WHERE id = $2',
      [currentIndex, playlistId]
    );

    // Update room's current video
    await query(
      'UPDATE rooms SET current_video_id = $1, updated_at = NOW() WHERE id = $2',
      [videoId, roomId]
    );

    logger.info('Current video set', { roomId, playlistId, videoId, currentIndex, userId });

    res.json({
      success: true,
      message: 'Current video set successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Set current video error:', error);
    throw new AppError('Failed to set current video', 500, 'CURRENT_VIDEO_ERROR');
  }
};
