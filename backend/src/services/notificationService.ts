import admin from 'firebase-admin';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { AppError } from '@shared';

interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
}

interface PushNotification {
  id: string;
  userId: string;
  type: 'room_invite' | 'follow' | 'mention' | 'control_request' | 'room_update' | 'system';
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
  isRead: boolean;
  createdAt: Date;
  sentAt?: Date;
}

class NotificationService {
  private fcmApp: admin.app.App | null = null;

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      if (!admin.apps.length) {
        const serviceAccount = {
          type: 'service_account',
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
        };

        this.fcmApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      } else {
        this.fcmApp = admin.app();
      }

      logger.info('Firebase Admin SDK initialized for notifications');
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK:', error);
      // Continue without push notifications
    }
  }

  // Send push notification to user
  async sendPushNotification(
    userId: string,
    notification: NotificationData,
    type: string = 'general'
  ): Promise<boolean> {
    try {
      // Get user's FCM tokens
      const tokens = await this.getUserFCMTokens(userId);
      if (tokens.length === 0) {
        logger.warn('No FCM tokens found for user:', userId);
        return false;
      }

      // Send notification via FCM
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl
        },
        data: {
          type,
          ...notification.data
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#ff0080',
            sound: 'default',
            clickAction: notification.clickAction
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        },
        tokens
      };

      const response = await admin.messaging().sendMulticast(message);
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            logger.error('Failed to send notification:', resp.error);
          }
        });
        
        // Remove invalid tokens
        if (failedTokens.length > 0) {
          await this.removeInvalidTokens(failedTokens);
        }
      }

      logger.info('Push notification sent', {
        userId,
        successCount: response.successCount,
        failureCount: response.failureCount
      });

      return response.successCount > 0;
    } catch (error) {
      logger.error('Failed to send push notification:', error);
      return false;
    }
  }

  // Send room invite notification
  async sendRoomInviteNotification(
    userId: string,
    roomId: string,
    roomName: string,
    inviterUsername: string,
    inviterAvatar?: string
  ): Promise<boolean> {
    const notification: NotificationData = {
      title: 'Room Invitation',
      body: `${inviterUsername} invited you to join "${roomName}"`,
      data: {
        roomId,
        inviterUsername,
        type: 'room_invite'
      },
      imageUrl: inviterAvatar,
      clickAction: `/room/${roomId}`
    };

    return this.sendPushNotification(userId, notification, 'room_invite');
  }

  // Send follow notification
  async sendFollowNotification(
    userId: string,
    followerUsername: string,
    followerAvatar?: string
  ): Promise<boolean> {
    const notification: NotificationData = {
      title: 'New Follower',
      body: `${followerUsername} started following you`,
      data: {
        followerUsername,
        type: 'follow'
      },
      imageUrl: followerAvatar,
      clickAction: `/profile/${followerUsername}`
    };

    return this.sendPushNotification(userId, notification, 'follow');
  }

  // Send mention notification
  async sendMentionNotification(
    userId: string,
    roomId: string,
    roomName: string,
    mentionerUsername: string,
    message: string
  ): Promise<boolean> {
    const notification: NotificationData = {
      title: 'You were mentioned',
      body: `${mentionerUsername} mentioned you in "${roomName}": ${message.substring(0, 100)}...`,
      data: {
        roomId,
        roomName,
        mentionerUsername,
        type: 'mention'
      },
      clickAction: `/room/${roomId}`
    };

    return this.sendPushNotification(userId, notification, 'mention');
  }

  // Send control request notification
  async sendControlRequestNotification(
    hostUserId: string,
    requesterUsername: string,
    roomId: string,
    roomName: string
  ): Promise<boolean> {
    const notification: NotificationData = {
      title: 'Control Request',
      body: `${requesterUsername} is requesting control in "${roomName}"`,
      data: {
        roomId,
        roomName,
        requesterUsername,
        type: 'control_request'
      },
      clickAction: `/room/${roomId}`
    };

    return this.sendPushNotification(hostUserId, notification, 'control_request');
  }

  // Send room update notification
  async sendRoomUpdateNotification(
    userId: string,
    roomId: string,
    roomName: string,
    updateType: 'video_changed' | 'room_ended' | 'host_left',
    data?: Record<string, string>
  ): Promise<boolean> {
    let title = 'Room Update';
    let body = '';

    switch (updateType) {
      case 'video_changed':
        title = 'Video Changed';
        body = `The video in "${roomName}" has changed`;
        break;
      case 'room_ended':
        title = 'Room Ended';
        body = `The room "${roomName}" has ended`;
        break;
      case 'host_left':
        title = 'Host Left';
        body = `The host left "${roomName}"`;
        break;
    }

    const notification: NotificationData = {
      title,
      body,
      data: {
        roomId,
        roomName,
        updateType,
        ...data
      },
      clickAction: `/room/${roomId}`
    };

    return this.sendPushNotification(userId, notification, 'room_update');
  }

  // Get user's FCM tokens
  private async getUserFCMTokens(userId: string): Promise<string[]> {
    try {
      const result = await query(
        'SELECT fcm_token FROM user_fcm_tokens WHERE user_id = $1 AND is_active = true',
        [userId]
      );

      return result.rows.map(row => row.fcm_token);
    } catch (error) {
      logger.error('Failed to get user FCM tokens:', error);
      return [];
    }
  }

  // Remove invalid FCM tokens
  private async removeInvalidTokens(tokens: string[]): Promise<void> {
    try {
      await query(
        'UPDATE user_fcm_tokens SET is_active = false WHERE fcm_token = ANY($1)',
        [tokens]
      );
      logger.info('Removed invalid FCM tokens:', tokens.length);
    } catch (error) {
      logger.error('Failed to remove invalid tokens:', error);
    }
  }

  // Register FCM token for user
  async registerFCMToken(userId: string, token: string, deviceInfo?: any): Promise<void> {
    try {
      // Check if token already exists
      const existingToken = await query(
        'SELECT id FROM user_fcm_tokens WHERE fcm_token = $1',
        [token]
      );

      if (existingToken.rows.length > 0) {
        // Update existing token
        await query(
          'UPDATE user_fcm_tokens SET user_id = $1, device_info = $2, updated_at = NOW() WHERE fcm_token = $3',
          [userId, JSON.stringify(deviceInfo), token]
        );
      } else {
        // Insert new token
        await query(
          `INSERT INTO user_fcm_tokens (id, user_id, fcm_token, device_info, is_active, created_at, updated_at)
           VALUES (uuid_generate_v4(), $1, $2, $3, true, NOW(), NOW())`,
          [userId, token, JSON.stringify(deviceInfo)]
        );
      }

      logger.info('FCM token registered for user:', userId);
    } catch (error) {
      logger.error('Failed to register FCM token:', error);
      throw new AppError('Failed to register notification token', 500, 'FCM_REGISTER_ERROR');
    }
  }

  // Unregister FCM token
  async unregisterFCMToken(token: string): Promise<void> {
    try {
      await query(
        'UPDATE user_fcm_tokens SET is_active = false WHERE fcm_token = $1',
        [token]
      );
      logger.info('FCM token unregistered:', token);
    } catch (error) {
      logger.error('Failed to unregister FCM token:', error);
    }
  }

  // Get user notifications
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: PushNotification[]; total: number }> {
    try {
      const offset = (page - 1) * limit;

      const result = await query(
        `SELECT 
          id, user_id, type, title, body, data, image_url, click_action, is_read, created_at, sent_at
         FROM user_notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const countResult = await query(
        'SELECT COUNT(*) as total FROM user_notifications WHERE user_id = $1',
        [userId]
      );

      const notifications = result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        title: row.title,
        body: row.body,
        data: row.data ? JSON.parse(row.data) : {},
        imageUrl: row.image_url,
        clickAction: row.click_action,
        isRead: row.is_read,
        createdAt: row.created_at,
        sentAt: row.sent_at
      }));

      return {
        notifications,
        total: parseInt(countResult.rows[0].total)
      };
    } catch (error) {
      logger.error('Failed to get user notifications:', error);
      throw new AppError('Failed to get notifications', 500, 'NOTIFICATIONS_GET_ERROR');
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await query(
        'UPDATE user_notifications SET is_read = true WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      );
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      throw new AppError('Failed to mark notification as read', 500, 'NOTIFICATION_READ_ERROR');
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await query(
        'UPDATE user_notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
        [userId]
      );
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      throw new AppError('Failed to mark all notifications as read', 500, 'NOTIFICATIONS_READ_ERROR');
    }
  }
}

export default NotificationService;
