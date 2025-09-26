import { z } from 'zod';

// User related types
export const UserSchema = z.object({
  id: z.string(),
  firebaseUid: z.string().optional(),
  username: z.string().min(1).max(50),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
  isOnline: z.boolean().default(false),
  lastSeen: z.date().optional(),
  followersCount: z.number().default(0),
  followingCount: z.number().default(0),
  roomsCreated: z.number().default(0),
  totalViews: z.number().default(0),
  createdAt: z.date().default(() => new Date()),
});

export type User = z.infer<typeof UserSchema>;

// Room related types
export const RoomSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  ownerId: z.string(),
  isPublic: z.boolean().default(true),
  password: z.string().optional(),
  maxParticipants: z.number().min(2).max(100).default(50),
  currentVideo: z.string().optional(),
  isPlaying: z.boolean().default(false),
  currentTime: z.number().default(0),
  playbackRate: z.number().min(0.25).max(4).default(1),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Room = z.infer<typeof RoomSchema>;

// Video related types
export const VideoSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  thumbnail: z.string().url().optional(),
  duration: z.number().optional(),
  type: z.enum(['youtube', 'file', 'url', 'screen_share']),
  addedBy: z.string(), // user ID
  addedAt: z.date().default(() => new Date()),
  position: z.number().default(0), // position in playlist
});

export type Video = z.infer<typeof VideoSchema>;

// Chat message types
export const ChatMessageSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  userId: z.string(),
  username: z.string(),
  message: z.string().min(1).max(1000),
  timestamp: z.date().default(() => new Date()),
  type: z.enum(['text', 'system', 'reaction']).default('text'),
  reactions: z.array(z.object({
    emoji: z.string(),
    users: z.array(z.string()),
  })).default([]),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Playlist types
export const PlaylistSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  videos: z.array(VideoSchema),
  currentIndex: z.number().default(0),
  isShuffled: z.boolean().default(false),
  repeatMode: z.enum(['none', 'one', 'all']).default('none'),
});

export type Playlist = z.infer<typeof PlaylistSchema>;

// Socket event types
export const SocketEvents = {
  // Room events
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_UPDATE: 'room_update',
  ROOM_ERROR: 'room_error',
  
  // Video events
  VIDEO_PLAY: 'video_play',
  VIDEO_PAUSE: 'video_pause',
  VIDEO_SEEK: 'video_seek',
  VIDEO_CHANGE: 'video_change',
  VIDEO_LOAD: 'video_load',
  
  // Chat events
  CHAT_MESSAGE: 'chat_message',
  CHAT_REACTION: 'chat_reaction',
  CHAT_TYPING: 'chat_typing',
  
  // Playlist events
  PLAYLIST_ADD: 'playlist_add',
  PLAYLIST_REMOVE: 'playlist_remove',
  PLAYLIST_REORDER: 'playlist_reorder',
  PLAYLIST_CLEAR: 'playlist_clear',
  
  // User events
  USER_JOIN: 'user_join',
  USER_LEAVE: 'user_leave',
  USER_UPDATE: 'user_update',
} as const;

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Room participant type
export interface RoomParticipant {
  user: User;
  isHost: boolean;
  joinedAt: Date;
  lastActivity: Date;
}

// Social types
export interface UserFollow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface RoomLike {
  id: string;
  roomId: string;
  userId: string;
  createdAt: Date;
}

export interface RoomView {
  id: string;
  roomId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface TrendingRoom {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  isPublic: boolean;
  roomCode: string;
  maxParticipants: number;
  currentVideoId?: string;
  isPlaying: boolean;
  currentTime: number;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    username: string;
    avatar?: string;
  };
  stats: {
    participantCount: number;
    likesCount: number;
    viewsCount: number;
    trendingScore: number;
  };
}

export interface TrendingUser {
  id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  stats: {
    followersCount: number;
    followingCount: number;
    roomsCreated: number;
    totalViews: number;
    trendingScore: number;
  };
  currentRoom?: {
    id: string;
    name: string;
    participantCount: number;
  };
  createdAt: Date;
}

// Video player state
export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  quality: string;
}

// Room state
export interface RoomState {
  room: Room;
  participants: RoomParticipant[];
  currentVideo?: Video;
  playlist: Playlist;
  chat: ChatMessage[];
  playerState: VideoPlayerState;
}

// WebSocket message types
export interface SocketMessage<T = any> {
  type: string;
  data: T;
  timestamp: Date;
  userId: string;
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Admin and Moderation types
export interface ContentReport {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedRoomId?: string;
  reportedMessageId?: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  moderatorId?: string;
  actionTaken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserBan {
  id: string;
  userId: string;
  bannedBy: string;
  reason: string;
  duration?: number; // in hours, null for permanent
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface UserWarning {
  id: string;
  userId: string;
  moderatorId: string;
  reason: string;
  createdAt: Date;
}

export interface ModerationEvent {
  id: string;
  moderatorId: string;
  actionType: string;
  targetUserId?: string;
  targetRoomId?: string;
  details: any;
  createdAt: Date;
}

export interface PlatformStats {
  totalUsers: number;
  totalRooms: number;
  activeUsers: number;
  pendingReports: number;
  systemHealth: SystemHealth;
}

export interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  redis: 'healthy' | 'degraded' | 'down';
  websockets: 'healthy' | 'degraded' | 'down';
  api: 'healthy' | 'degraded' | 'down';
  firebase: 'healthy' | 'degraded' | 'down';
  sfu: 'healthy' | 'degraded' | 'down';
}

export interface AnalyticsData {
  userGrowth: Array<{ date: string; count: number }>;
  roomActivity: Array<{ date: string; count: number }>;
  engagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionDuration: number;
  };
  topRooms: Array<{
    id: string;
    name: string;
    participantCount: number;
    views: number;
  }>;
  topUsers: Array<{
    id: string;
    username: string;
    followersCount: number;
    roomsCreated: number;
  }>;
}

// Configuration types
export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
    uploadPath: string;
  };
  youtube: {
    apiKey: string;
  };
  firebase: {
    projectId: string;
    privateKey: string;
    clientEmail: string;
  };
}
