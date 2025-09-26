import { Server as SocketIOServer } from 'socket.io';
import { query } from '../config/database.js';
import { roomCache } from '../config/redis.js';
import { logger, logSocket } from '../utils/logger.js';
import { config } from '../server.js';
import { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  email?: string;
  currentRoom?: string;
}

export const setupSocketHandlers = (io: SocketIOServer): void => {
  // Firebase authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const firebaseToken = socket.handshake.auth.firebaseToken;
      
      if (!firebaseToken) {
        return next(new Error('Firebase authentication token required'));
      }

      // Firebase authentication will be handled by the client
      // For now, allow connection and authenticate on first message
      next();
    } catch (error) {
      next(new Error('Firebase authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('User connected', {
      userId: socket.userId,
      username: socket.username,
      socketId: socket.id
    });

    // Update user online status
    updateUserOnlineStatus(socket.userId!, true);

    // Room management
    socket.on('join_room', (data) => handleJoinRoom(socket, data));
    socket.on('leave_room', (data) => handleLeaveRoom(socket, data));
    
    // Video synchronization
    socket.on('video_play', (data) => handleVideoPlay(socket, data));
    socket.on('video_pause', (data) => handleVideoPause(socket, data));
    socket.on('video_seek', (data) => handleVideoSeek(socket, data));
    socket.on('video_change', (data) => handleVideoChange(socket, data));
    
    // Chat
    socket.on('chat_message', (data) => handleChatMessage(socket, data));
    socket.on('chat_typing', (data) => handleChatTyping(socket, data));
    socket.on('chat_reaction', (data) => handleChatReaction(socket, data));
    
    // Playlist
    socket.on('playlist_add', (data) => handlePlaylistAdd(socket, data));
    socket.on('playlist_remove', (data) => handlePlaylistRemove(socket, data));
    socket.on('playlist_reorder', (data) => handlePlaylistReorder(socket, data));
    
    // User events
    socket.on('user_update', (data) => handleUserUpdate(socket, data));
    
    // Disconnect
    socket.on('disconnect', () => handleDisconnect(socket));
  });
};

// Room Management
const handleJoinRoom = async (socket: AuthenticatedSocket, data: { roomId: string }) => {
  try {
    const { roomId } = data;
    
    // Check if user is authorized to join room
    const roomCheck = await query(
      'SELECT 1 FROM room_participants WHERE room_id = $1 AND user_id = $2',
      [roomId, socket.userId]
    );

    if (roomCheck.rows.length === 0) {
      socket.emit('room_error', { message: 'Not authorized to join this room' });
      return;
    }

    // Leave previous room if any
    if (socket.currentRoom) {
      await handleLeaveRoom(socket, { roomId: socket.currentRoom });
    }

    // Join socket room
    socket.join(roomId);
    socket.currentRoom = roomId;

    // Add user to room cache
    await roomCache.addParticipant(roomId, socket.userId!);

    // Get room state
    const roomState = await getRoomState(roomId);

    // Notify user of successful join
    socket.emit('room_joined', {
      roomId,
      roomState
    });

    // Notify other users in room
    socket.to(roomId).emit('user_joined', {
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date()
    });

    logSocket('join_room', roomId, socket.userId!, { roomId });
  } catch (error) {
    logger.error('Join room error:', error);
    socket.emit('room_error', { message: 'Failed to join room' });
  }
};

const handleLeaveRoom = async (socket: AuthenticatedSocket, data: { roomId: string }) => {
  try {
    const { roomId } = data;

    // Leave socket room
    socket.leave(roomId);
    socket.currentRoom = undefined;

    // Remove user from room cache
    await roomCache.removeParticipant(roomId, socket.userId!);

    // Notify other users in room
    socket.to(roomId).emit('user_left', {
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date()
    });

    logSocket('leave_room', roomId, socket.userId!, { roomId });
  } catch (error) {
    logger.error('Leave room error:', error);
  }
};

// Video Synchronization
const handleVideoPlay = async (socket: AuthenticatedSocket, data: { roomId: string, timestamp: number }) => {
  try {
    const { roomId, timestamp } = data;

    if (socket.currentRoom !== roomId) {
      socket.emit('room_error', { message: 'Not in this room' });
      return;
    }

    // Update room state
    await updateRoomVideoState(roomId, { isPlaying: true, currentTime: timestamp });

    // Broadcast to other users in room
    socket.to(roomId).emit('video_play', {
      timestamp,
      userId: socket.userId,
      username: socket.username
    });

    logSocket('video_play', roomId, socket.userId!, { timestamp });
  } catch (error) {
    logger.error('Video play error:', error);
  }
};

const handleVideoPause = async (socket: AuthenticatedSocket, data: { roomId: string, timestamp: number }) => {
  try {
    const { roomId, timestamp } = data;

    if (socket.currentRoom !== roomId) {
      socket.emit('room_error', { message: 'Not in this room' });
      return;
    }

    // Update room state
    await updateRoomVideoState(roomId, { isPlaying: false, currentTime: timestamp });

    // Broadcast to other users in room
    socket.to(roomId).emit('video_pause', {
      timestamp,
      userId: socket.userId,
      username: socket.username
    });

    logSocket('video_pause', roomId, socket.userId!, { timestamp });
  } catch (error) {
    logger.error('Video pause error:', error);
  }
};

const handleVideoSeek = async (socket: AuthenticatedSocket, data: { roomId: string, timestamp: number }) => {
  try {
    const { roomId, timestamp } = data;

    if (socket.currentRoom !== roomId) {
      socket.emit('room_error', { message: 'Not in this room' });
      return;
    }

    // Update room state
    await updateRoomVideoState(roomId, { currentTime: timestamp });

    // Broadcast to other users in room
    socket.to(roomId).emit('video_seek', {
      timestamp,
      userId: socket.userId,
      username: socket.username
    });

    logSocket('video_seek', roomId, socket.userId!, { timestamp });
  } catch (error) {
    logger.error('Video seek error:', error);
  }
};

const handleVideoChange = async (socket: AuthenticatedSocket, data: { roomId: string, videoId: string }) => {
  try {
    const { roomId, videoId } = data;

    if (socket.currentRoom !== roomId) {
      socket.emit('room_error', { message: 'Not in this room' });
      return;
    }

    // Update room state
    await query(
      'UPDATE rooms SET current_video_id = $1, updated_at = NOW() WHERE id = $2',
      [videoId, roomId]
    );

    // Broadcast to other users in room
    socket.to(roomId).emit('video_change', {
      videoId,
      userId: socket.userId,
      username: socket.username
    });

    logSocket('video_change', roomId, socket.userId!, { videoId });
  } catch (error) {
    logger.error('Video change error:', error);
  }
};

// Chat
const handleChatMessage = async (socket: AuthenticatedSocket, data: { roomId: string, message: string }) => {
  try {
    const { roomId, message } = data;

    if (socket.currentRoom !== roomId) {
      socket.emit('room_error', { message: 'Not in this room' });
      return;
    }

    // Save message to database
    const messageId = require('uuid').v4();
    await query(
      `INSERT INTO chat_messages (id, room_id, user_id, message, message_type, created_at)
       VALUES ($1, $2, $3, $4, 'text', NOW())`,
      [messageId, roomId, socket.userId, message]
    );

    // Broadcast to all users in room including sender
    socket.to(roomId).emit('chat_message', {
      id: messageId,
      message,
      username: socket.username,
      userId: socket.userId,
      timestamp: new Date()
    });

    logSocket('chat_message', roomId, socket.userId!, { messageLength: message.length });
  } catch (error) {
    logger.error('Chat message error:', error);
  }
};

const handleChatTyping = async (socket: AuthenticatedSocket, data: { roomId: string, isTyping: boolean }) => {
  try {
    const { roomId, isTyping } = data;

    if (socket.currentRoom !== roomId) {
      return;
    }

    // Broadcast typing status to other users
    socket.to(roomId).emit('chat_typing', {
      userId: socket.userId,
      username: socket.username,
      isTyping,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Chat typing error:', error);
  }
};

const handleChatReaction = async (socket: AuthenticatedSocket, data: { roomId: string, messageId: string, emoji: string }) => {
  try {
    const { roomId, messageId, emoji } = data;

    if (socket.currentRoom !== roomId) {
      socket.emit('room_error', { message: 'Not in this room' });
      return;
    }

    // Add reaction to database
    await query(
      `INSERT INTO chat_reactions (id, message_id, user_id, emoji, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (message_id, user_id, emoji) DO NOTHING`,
      [require('uuid').v4(), messageId, socket.userId, emoji]
    );

    // Broadcast to all users in room
    socket.to(roomId).emit('chat_reaction', {
      messageId,
      emoji,
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date()
    });

    logSocket('chat_reaction', roomId, socket.userId!, { messageId, emoji });
  } catch (error) {
    logger.error('Chat reaction error:', error);
  }
};

// Playlist
const handlePlaylistAdd = async (socket: AuthenticatedSocket, data: { roomId: string, video: any }) => {
  try {
    const { roomId, video } = data;

    if (socket.currentRoom !== roomId) {
      socket.emit('room_error', { message: 'Not in this room' });
      return;
    }

    // Broadcast to all users in room
    socket.to(roomId).emit('playlist_add', {
      video,
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date()
    });

    logSocket('playlist_add', roomId, socket.userId!, { videoId: video.id });
  } catch (error) {
    logger.error('Playlist add error:', error);
  }
};

const handlePlaylistRemove = async (socket: AuthenticatedSocket, data: { roomId: string, videoId: string }) => {
  try {
    const { roomId, videoId } = data;

    if (socket.currentRoom !== roomId) {
      socket.emit('room_error', { message: 'Not in this room' });
      return;
    }

    // Broadcast to all users in room
    socket.to(roomId).emit('playlist_remove', {
      videoId,
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date()
    });

    logSocket('playlist_remove', roomId, socket.userId!, { videoId });
  } catch (error) {
    logger.error('Playlist remove error:', error);
  }
};

const handlePlaylistReorder = async (socket: AuthenticatedSocket, data: { roomId: string, videoIds: string[] }) => {
  try {
    const { roomId, videoIds } = data;

    if (socket.currentRoom !== roomId) {
      socket.emit('room_error', { message: 'Not in this room' });
      return;
    }

    // Broadcast to all users in room
    socket.to(roomId).emit('playlist_reorder', {
      videoIds,
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date()
    });

    logSocket('playlist_reorder', roomId, socket.userId!, { videoCount: videoIds.length });
  } catch (error) {
    logger.error('Playlist reorder error:', error);
  }
};

// User Events
const handleUserUpdate = async (socket: AuthenticatedSocket, data: { roomId: string, updates: any }) => {
  try {
    const { roomId, updates } = data;

    if (socket.currentRoom !== roomId) {
      return;
    }

    // Broadcast to other users in room
    socket.to(roomId).emit('user_update', {
      userId: socket.userId,
      username: socket.username,
      updates,
      timestamp: new Date()
    });

    logSocket('user_update', roomId, socket.userId!, { updates });
  } catch (error) {
    logger.error('User update error:', error);
  }
};

// Disconnect
const handleDisconnect = async (socket: AuthenticatedSocket) => {
  try {
    logger.info('User disconnected', {
      userId: socket.userId,
      username: socket.username,
      socketId: socket.id
    });

    // Update user online status
    if (socket.userId) {
      await updateUserOnlineStatus(socket.userId, false);
    }

    // Leave current room if any
    if (socket.currentRoom) {
      await handleLeaveRoom(socket, { roomId: socket.currentRoom });
    }
  } catch (error) {
    logger.error('Disconnect error:', error);
  }
};

// Helper functions
const updateUserOnlineStatus = async (userId: string, isOnline: boolean): Promise<void> => {
  try {
    await query(
      'UPDATE users SET is_online = $1, last_seen = NOW() WHERE id = $2',
      [isOnline, userId]
    );
  } catch (error) {
    logger.error('Update user online status error:', error);
  }
};

const getRoomState = async (roomId: string): Promise<any> => {
  try {
    // Get room info
    const roomResult = await query(
      'SELECT * FROM rooms WHERE id = $1',
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      return null;
    }

    const room = roomResult.rows[0];

    // Get participants
    const participants = await roomCache.getParticipants(roomId);

    // Get current video
    let currentVideo = null;
    if (room.current_video_id) {
      const videoResult = await query(
        'SELECT * FROM videos WHERE id = $1',
        [room.current_video_id]
      );
      currentVideo = videoResult.rows[0];
    }

    return {
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        isPublic: room.is_public,
        maxParticipants: room.max_participants,
        roomCode: room.room_code,
        currentVideo: currentVideo,
        isPlaying: room.is_playing,
        currentTime: room.current_time,
        playbackRate: room.playback_rate,
      },
      participants,
    };
  } catch (error) {
    logger.error('Get room state error:', error);
    return null;
  }
};

const updateRoomVideoState = async (roomId: string, updates: any): Promise<void> => {
  try {
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (updates.isPlaying !== undefined) {
      updateFields.push(`is_playing = $${paramCount++}`);
      values.push(updates.isPlaying);
    }
    if (updates.currentTime !== undefined) {
      updateFields.push(`current_time = $${paramCount++}`);
      values.push(updates.currentTime);
    }
    if (updates.playbackRate !== undefined) {
      updateFields.push(`playback_rate = $${paramCount++}`);
      values.push(updates.playbackRate);
    }

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = NOW()`);
      values.push(roomId);

      await query(
        `UPDATE rooms SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
        values
      );
    }
  } catch (error) {
    logger.error('Update room video state error:', error);
  }
};
