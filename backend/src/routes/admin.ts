import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { 
  getPlatformStats,
  getPendingReports,
  getActiveBans,
  getAllUsers,
  getAllRooms,
  getDetailedAnalytics,
  getSystemHealth,
  resolveReport,
  banUser,
  unbanUser,
  warnUser,
  deleteRoom,
  bulkAction
} from '../controllers/adminController.js';
import { validate } from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(requireAdmin);

// Platform stats
router.get('/stats', getPlatformStats);

// Moderation
router.get('/reports', getPendingReports);
router.get('/bans', getActiveBans);
router.post('/reports/:id/resolve', resolveReport);
router.post('/ban', banUser);
router.delete('/bans/:id', unbanUser);
router.post('/warn', warnUser);

// User management
router.get('/users', getAllUsers);
router.get('/rooms', getAllRooms);

// Analytics
router.get('/analytics', getDetailedAnalytics);

// System
router.get('/system/health', getSystemHealth);

// Bulk actions
router.post('/bulk', bulkAction);

// Room management
router.delete('/rooms/:id', deleteRoom);

export { router as adminRoutes };
