import { Express } from 'express';
import { authRoutes } from './auth.js';
import { firebaseAuthRoutes } from './firebaseAuth.js';
import { roomRoutes } from './room.js';
import { userRoutes } from './user.js';
import { videoRoutes } from './video.js';
import { chatRoutes } from './chat.js';
import { playlistRoutes } from './playlist.js';
import { followRoutes } from './follow.js';
import { trendingRoutes } from './trending.js';
import { djRoutes } from './dj.js';
import { adminRoutes } from './admin.js';

export const setupRoutes = (app: Express): void => {
  // API routes
  app.use('/api/auth', authRoutes); // Keep original auth for backward compatibility
  app.use('/api/firebase', firebaseAuthRoutes); // Firebase auth
  app.use('/api/rooms', roomRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/videos', videoRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/playlist', playlistRoutes);
  app.use('/api/follow', followRoutes);
  app.use('/api/trending', trendingRoutes);
  app.use('/api/dj', djRoutes);
  app.use('/api/admin', adminRoutes); // Admin dashboard
};
