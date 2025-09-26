import { Request, Response } from 'express';
import admin from 'firebase-admin';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { generateId } from '@shared';
import { AppError } from '@shared';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    firebaseUid: string;
  };
}

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
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

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }
};

// Initialize Firebase on module load
initializeFirebase();

// Verify Firebase ID token
export const verifyFirebaseToken = async (req: AuthenticatedRequest, res: Response, next: any): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user from database
    const userResult = await query(
      'SELECT id, username, email, firebase_uid, avatar_url, is_online, last_seen FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const user = userResult.rows[0];
    
    // Update last seen
    await query(
      'UPDATE users SET last_seen = NOW() WHERE id = $1',
      [user.id]
    );

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      firebaseUid: user.firebase_uid
    };

    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Firebase token verification error:', error);
    throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
};

// Create or update user from Firebase
export const createOrUpdateUser = async (req: Request, res: Response): Promise<void> => {
  const { firebaseUid, email, username, avatarUrl } = req.body;

  try {
    // Check if user already exists
    const existingUser = await query(
      'SELECT id, username, email FROM users WHERE firebase_uid = $1 OR email = $2',
      [firebaseUid, email]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      
      // Update user info if needed
      await query(
        'UPDATE users SET username = $1, avatar_url = $2, last_seen = NOW() WHERE id = $3',
        [username, avatarUrl, user.id]
      );

      logger.info('User updated from Firebase', { userId: user.id, firebaseUid });
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: username,
            email: user.email,
            avatar: avatarUrl,
            firebaseUid: firebaseUid
          }
        }
      });
    } else {
      // Create new user
      const userId = generateId();
      
      await query(
        `INSERT INTO users (id, firebase_uid, username, email, avatar_url, is_online, last_seen, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW(), NOW())`,
        [userId, firebaseUid, username, email, avatarUrl]
      );

      logger.info('User created from Firebase', { userId, firebaseUid });
      
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: userId,
            username: username,
            email: email,
            avatar: avatarUrl,
            firebaseUid: firebaseUid
          }
        }
      });
    }
  } catch (error) {
    logger.error('Create/update user error:', error);
    throw new AppError('Failed to create/update user', 500, 'USER_CREATE_ERROR');
  }
};

// Get user profile
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    const result = await query(
      `SELECT 
        id, username, email, avatar_url, is_online, last_seen, 
        followers_count, following_count, rooms_created, total_views,
        created_at, updated_at
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const user = result.rows[0];
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar_url,
          isOnline: user.is_online,
          lastSeen: user.last_seen,
          followersCount: user.followers_count,
          followingCount: user.following_count,
          roomsCreated: user.rooms_created,
          totalViews: user.total_views,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Get profile error:', error);
    throw new AppError('Failed to get profile', 500, 'PROFILE_ERROR');
  }
};

// Update user profile
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { username, avatarUrl } = req.body;
  const userId = req.user!.id;

  try {
    // Check if username is already taken
    if (username) {
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, userId]
      );

      if (existingUser.rows.length > 0) {
        throw new AppError('Username already taken', 409, 'USERNAME_TAKEN');
      }
    }

    // Update user profile
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      updateFields.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }

    if (avatarUrl) {
      updateFields.push(`avatar_url = $${paramCount}`);
      values.push(avatarUrl);
      paramCount++;
    }

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400, 'NO_FIELDS');
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(userId);

    await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    logger.info('User profile updated', { userId, username, avatarUrl });

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Update profile error:', error);
    throw new AppError('Failed to update profile', 500, 'PROFILE_UPDATE_ERROR');
  }
};

// Delete user account
export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const firebaseUid = req.user!.firebaseUid;

  try {
    // Delete user from database (cascade will handle related records)
    await query('DELETE FROM users WHERE id = $1', [userId]);

    // Delete user from Firebase
    await admin.auth().deleteUser(firebaseUid);

    logger.info('User account deleted', { userId, firebaseUid });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error('Delete account error:', error);
    throw new AppError('Failed to delete account', 500, 'ACCOUNT_DELETE_ERROR');
  }
};

// Get Firebase config for frontend
export const getFirebaseConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    };

    res.json({
      success: true,
      data: { config }
    });
  } catch (error) {
    logger.error('Get Firebase config error:', error);
    throw new AppError('Failed to get Firebase config', 500, 'FIREBASE_CONFIG_ERROR');
  }
};
