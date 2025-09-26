import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { logger } from '../utils/logger.js';
import { AppError } from '@shared';

interface VoiceRoom {
  id: string;
  participants: Map<string, VoiceParticipant>;
  maxParticipants: number;
  isActive: boolean;
  createdAt: Date;
}

interface VoiceParticipant {
  userId: string;
  username: string;
  socketId: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  joinedAt: Date;
  lastActivity: Date;
}

interface VoiceEvent {
  type: 'join' | 'leave' | 'mute' | 'unmute' | 'deafen' | 'undeafen' | 'speaking' | 'audio_level';
  userId: string;
  username: string;
  data?: any;
  timestamp: Date;
}

class WebRTCService {
  private io: SocketIOServer;
  private voiceRooms: Map<string, VoiceRoom>;
  private redisClient: any;
  private redisAdapter: any;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.voiceRooms = new Map();
    this.setupRedisAdapter();
    this.setupSocketHandlers();
  }

  private async setupRedisAdapter() {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      await this.redisClient.connect();
      
      this.redisAdapter = createAdapter(this.redisClient, this.redisClient.duplicate());
      this.io.adapter(this.redisAdapter);
      
      logger.info('Redis adapter setup for WebRTC service');
    } catch (error) {
      logger.error('Failed to setup Redis adapter:', error);
      throw new AppError('WebRTC service initialization failed', 500, 'WEBRTC_INIT_ERROR');
    }
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info('WebRTC client connected:', socket.id);

      // Join voice room
      socket.on('voice:join', async (data: { roomId: string; userId: string; username: string }) => {
        try {
          await this.handleJoinVoiceRoom(socket, data);
        } catch (error) {
          socket.emit('voice:error', { message: 'Failed to join voice room' });
          logger.error('Voice join error:', error);
        }
      });

      // Leave voice room
      socket.on('voice:leave', async (data: { roomId: string; userId: string }) => {
        try {
          await this.handleLeaveVoiceRoom(socket, data);
        } catch (error) {
          logger.error('Voice leave error:', error);
        }
      });

      // Toggle mute
      socket.on('voice:mute', async (data: { roomId: string; userId: string; muted: boolean }) => {
        try {
          await this.handleMuteToggle(socket, data);
        } catch (error) {
          logger.error('Voice mute error:', error);
        }
      });

      // Toggle deafen
      socket.on('voice:deafen', async (data: { roomId: string; userId: string; deafened: boolean }) => {
        try {
          await this.handleDeafenToggle(socket, data);
        } catch (error) {
          logger.error('Voice deafen error:', error);
        }
      });

      // Speaking status
      socket.on('voice:speaking', async (data: { roomId: string; userId: string; speaking: boolean }) => {
        try {
          await this.handleSpeakingStatus(socket, data);
        } catch (error) {
          logger.error('Voice speaking error:', error);
        }
      });

      // Audio level
      socket.on('voice:audio_level', async (data: { roomId: string; userId: string; level: number }) => {
        try {
          await this.handleAudioLevel(socket, data);
        } catch (error) {
          logger.error('Voice audio level error:', error);
        }
      });

      // WebRTC signaling
      socket.on('voice:offer', async (data: { roomId: string; targetUserId: string; offer: any }) => {
        try {
          await this.handleWebRTCOffer(socket, data);
        } catch (error) {
          logger.error('WebRTC offer error:', error);
        }
      });

      socket.on('voice:answer', async (data: { roomId: string; targetUserId: string; answer: any }) => {
        try {
          await this.handleWebRTCAnswer(socket, data);
        } catch (error) {
          logger.error('WebRTC answer error:', error);
        }
      });

      socket.on('voice:ice_candidate', async (data: { roomId: string; targetUserId: string; candidate: any }) => {
        try {
          await this.handleICECandidate(socket, data);
        } catch (error) {
          logger.error('WebRTC ICE candidate error:', error);
        }
      });

      // Disconnect
      socket.on('disconnect', async () => {
        try {
          await this.handleDisconnect(socket);
        } catch (error) {
          logger.error('Voice disconnect error:', error);
        }
      });
    });
  }

  private async handleJoinVoiceRoom(socket: any, data: { roomId: string; userId: string; username: string }) {
    const { roomId, userId, username } = data;

    // Get or create voice room
    let voiceRoom = this.voiceRooms.get(roomId);
    if (!voiceRoom) {
      voiceRoom = {
        id: roomId,
        participants: new Map(),
        maxParticipants: 50, // Configurable
        isActive: true,
        createdAt: new Date()
      };
      this.voiceRooms.set(roomId, voiceRoom);
    }

    // Check room capacity
    if (voiceRoom.participants.size >= voiceRoom.maxParticipants) {
      socket.emit('voice:error', { message: 'Voice room is full' });
      return;
    }

    // Create participant
    const participant: VoiceParticipant = {
      userId,
      username,
      socketId: socket.id,
      isMuted: false,
      isDeafened: false,
      isSpeaking: false,
      audioLevel: 0,
      joinedAt: new Date(),
      lastActivity: new Date()
    };

    // Add participant to room
    voiceRoom.participants.set(userId, participant);

    // Join socket room
    await socket.join(`voice:${roomId}`);

    // Notify other participants
    socket.to(`voice:${roomId}`).emit('voice:participant_joined', {
      userId,
      username,
      timestamp: new Date()
    });

    // Send current participants to new user
    const participants = Array.from(voiceRoom.participants.values()).map(p => ({
      userId: p.userId,
      username: p.username,
      isMuted: p.isMuted,
      isDeafened: p.isDeafened,
      isSpeaking: p.isSpeaking,
      audioLevel: p.audioLevel
    }));

    socket.emit('voice:participants', { participants });

    logger.info('User joined voice room', { roomId, userId, username });
  }

  private async handleLeaveVoiceRoom(socket: any, data: { roomId: string; userId: string }) {
    const { roomId, userId } = data;
    const voiceRoom = this.voiceRooms.get(roomId);

    if (voiceRoom && voiceRoom.participants.has(userId)) {
      const participant = voiceRoom.participants.get(userId)!;
      
      // Remove participant
      voiceRoom.participants.delete(userId);

      // Leave socket room
      await socket.leave(`voice:${roomId}`);

      // Notify other participants
      socket.to(`voice:${roomId}`).emit('voice:participant_left', {
        userId,
        username: participant.username,
        timestamp: new Date()
      });

      // Clean up empty room
      if (voiceRoom.participants.size === 0) {
        this.voiceRooms.delete(roomId);
      }

      logger.info('User left voice room', { roomId, userId });
    }
  }

  private async handleMuteToggle(socket: any, data: { roomId: string; userId: string; muted: boolean }) {
    const { roomId, userId, muted } = data;
    const voiceRoom = this.voiceRooms.get(roomId);

    if (voiceRoom && voiceRoom.participants.has(userId)) {
      const participant = voiceRoom.participants.get(userId)!;
      participant.isMuted = muted;
      participant.lastActivity = new Date();

      // Notify other participants
      socket.to(`voice:${roomId}`).emit('voice:participant_muted', {
        userId,
        username: participant.username,
        muted,
        timestamp: new Date()
      });

      logger.info('User mute status changed', { roomId, userId, muted });
    }
  }

  private async handleDeafenToggle(socket: any, data: { roomId: string; userId: string; deafened: boolean }) {
    const { roomId, userId, deafened } = data;
    const voiceRoom = this.voiceRooms.get(roomId);

    if (voiceRoom && voiceRoom.participants.has(userId)) {
      const participant = voiceRoom.participants.get(userId)!;
      participant.isDeafened = deafened;
      participant.lastActivity = new Date();

      // Notify other participants
      socket.to(`voice:${roomId}`).emit('voice:participant_deafened', {
        userId,
        username: participant.username,
        deafened,
        timestamp: new Date()
      });

      logger.info('User deafen status changed', { roomId, userId, deafened });
    }
  }

  private async handleSpeakingStatus(socket: any, data: { roomId: string; userId: string; speaking: boolean }) {
    const { roomId, userId, speaking } = data;
    const voiceRoom = this.voiceRooms.get(roomId);

    if (voiceRoom && voiceRoom.participants.has(userId)) {
      const participant = voiceRoom.participants.get(userId)!;
      participant.isSpeaking = speaking;
      participant.lastActivity = new Date();

      // Notify other participants
      socket.to(`voice:${roomId}`).emit('voice:participant_speaking', {
        userId,
        username: participant.username,
        speaking,
        timestamp: new Date()
      });

      logger.debug('User speaking status changed', { roomId, userId, speaking });
    }
  }

  private async handleAudioLevel(socket: any, data: { roomId: string; userId: string; level: number }) {
    const { roomId, userId, level } = data;
    const voiceRoom = this.voiceRooms.get(roomId);

    if (voiceRoom && voiceRoom.participants.has(userId)) {
      const participant = voiceRoom.participants.get(userId)!;
      participant.audioLevel = level;
      participant.lastActivity = new Date();

      // Notify other participants (throttled)
      if (Date.now() - participant.lastActivity.getTime() > 100) { // Throttle to 10fps
        socket.to(`voice:${roomId}`).emit('voice:participant_audio_level', {
          userId,
          username: participant.username,
          level,
          timestamp: new Date()
        });
      }
    }
  }

  private async handleWebRTCOffer(socket: any, data: { roomId: string; targetUserId: string; offer: any }) {
    const { roomId, targetUserId, offer } = data;
    
    // Forward offer to target user
    socket.to(`voice:${roomId}`).emit('voice:offer', {
      fromUserId: data.targetUserId,
      offer,
      timestamp: new Date()
    });
  }

  private async handleWebRTCAnswer(socket: any, data: { roomId: string; targetUserId: string; answer: any }) {
    const { roomId, targetUserId, answer } = data;
    
    // Forward answer to target user
    socket.to(`voice:${roomId}`).emit('voice:answer', {
      fromUserId: data.targetUserId,
      answer,
      timestamp: new Date()
    });
  }

  private async handleICECandidate(socket: any, data: { roomId: string; targetUserId: string; candidate: any }) {
    const { roomId, targetUserId, candidate } = data;
    
    // Forward ICE candidate to target user
    socket.to(`voice:${roomId}`).emit('voice:ice_candidate', {
      fromUserId: data.targetUserId,
      candidate,
      timestamp: new Date()
    });
  }

  private async handleDisconnect(socket: any) {
    // Find and remove participant from all rooms
    for (const [roomId, voiceRoom] of this.voiceRooms.entries()) {
      for (const [userId, participant] of voiceRoom.participants.entries()) {
        if (participant.socketId === socket.id) {
          await this.handleLeaveVoiceRoom(socket, { roomId, userId });
          break;
        }
      }
    }

    logger.info('WebRTC client disconnected:', socket.id);
  }

  // Get voice room stats
  public getVoiceRoomStats(roomId: string) {
    const voiceRoom = this.voiceRooms.get(roomId);
    if (!voiceRoom) return null;

    return {
      id: voiceRoom.id,
      participantCount: voiceRoom.participants.size,
      maxParticipants: voiceRoom.maxParticipants,
      isActive: voiceRoom.isActive,
      participants: Array.from(voiceRoom.participants.values()).map(p => ({
        userId: p.userId,
        username: p.username,
        isMuted: p.isMuted,
        isDeafened: p.isDeafened,
        isSpeaking: p.isSpeaking,
        audioLevel: p.audioLevel,
        joinedAt: p.joinedAt
      }))
    };
  }

  // Get all voice rooms
  public getAllVoiceRooms() {
    return Array.from(this.voiceRooms.values()).map(room => ({
      id: room.id,
      participantCount: room.participants.size,
      maxParticipants: room.maxParticipants,
      isActive: room.isActive,
      createdAt: room.createdAt
    }));
  }
}

export default WebRTCService;
