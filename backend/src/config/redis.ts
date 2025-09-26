import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

let redisClient: Redis;

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export const connectRedis = async (config: RedisConfig): Promise<void> => {
  try {
    redisClient = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      retryDelayOnClusterDown: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('close', () => {
      logger.info('Redis client disconnected');
    });

    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call connectRedis first.');
  }
  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};

// Cache utilities
export const cache = {
  async get(key: string): Promise<string | null> {
    try {
      return await redisClient.get(key);
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  },

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await redisClient.setex(key, ttl, value);
      } else {
        await redisClient.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error('Redis set error:', error);
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Redis del error:', error);
      return false;
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  },

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      await redisClient.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error('Redis expire error:', error);
      return false;
    }
  },

  async keys(pattern: string): Promise<string[]> {
    try {
      return await redisClient.keys(pattern);
    } catch (error) {
      logger.error('Redis keys error:', error);
      return [];
    }
  },
};

// Session management
export const session = {
  async set(userId: string, sessionData: any, ttl: number = 3600): Promise<boolean> {
    const key = `session:${userId}`;
    return await cache.set(key, JSON.stringify(sessionData), ttl);
  },

  async get(userId: string): Promise<any | null> {
    const key = `session:${userId}`;
    const data = await cache.get(key);
    return data ? JSON.parse(data) : null;
  },

  async del(userId: string): Promise<boolean> {
    const key = `session:${userId}`;
    return await cache.del(key);
  },
};

// Room management
export const roomCache = {
  async setRoom(roomId: string, roomData: any, ttl: number = 3600): Promise<boolean> {
    const key = `room:${roomId}`;
    return await cache.set(key, JSON.stringify(roomData), ttl);
  },

  async getRoom(roomId: string): Promise<any | null> {
    const key = `room:${roomId}`;
    const data = await cache.get(key);
    return data ? JSON.parse(data) : null;
  },

  async delRoom(roomId: string): Promise<boolean> {
    const key = `room:${roomId}`;
    return await cache.del(key);
  },

  async addParticipant(roomId: string, userId: string): Promise<boolean> {
    const key = `room:${roomId}:participants`;
    try {
      await redisClient.sadd(key, userId);
      await redisClient.expire(key, 3600); // 1 hour
      return true;
    } catch (error) {
      logger.error('Redis add participant error:', error);
      return false;
    }
  },

  async removeParticipant(roomId: string, userId: string): Promise<boolean> {
    const key = `room:${roomId}:participants`;
    try {
      await redisClient.srem(key, userId);
      return true;
    } catch (error) {
      logger.error('Redis remove participant error:', error);
      return false;
    }
  },

  async getParticipants(roomId: string): Promise<string[]> {
    const key = `room:${roomId}:participants`;
    try {
      return await redisClient.smembers(key);
    } catch (error) {
      logger.error('Redis get participants error:', error);
      return [];
    }
  },
};
