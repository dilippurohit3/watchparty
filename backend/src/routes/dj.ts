import { Router } from 'express';
import { param, body } from 'express-validator';
import { 
  requestControl,
  approveControlRequest,
  rejectControlRequest,
  getControlRequests,
  removeCoHost,
  transferHost
} from '../controllers/djController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Request control from a participant
router.post('/:roomId/request-control',
  authenticateToken,
  param('roomId').isUUID().withMessage('Invalid room ID'),
  validateRequest,
  asyncHandler(requestControl)
);

// Approve control request (host only)
router.post('/:roomId/requests/:requestId/approve',
  authenticateToken,
  param('roomId').isUUID().withMessage('Invalid room ID'),
  param('requestId').isUUID().withMessage('Invalid request ID'),
  validateRequest,
  asyncHandler(approveControlRequest)
);

// Reject control request (host only)
router.post('/:roomId/requests/:requestId/reject',
  authenticateToken,
  param('roomId').isUUID().withMessage('Invalid room ID'),
  param('requestId').isUUID().withMessage('Invalid request ID'),
  validateRequest,
  asyncHandler(rejectControlRequest)
);

// Get pending control requests (host only)
router.get('/:roomId/requests',
  authenticateToken,
  param('roomId').isUUID().withMessage('Invalid room ID'),
  validateRequest,
  asyncHandler(getControlRequests)
);

// Remove co-host privileges (host only)
router.delete('/:roomId/co-hosts/:userId',
  authenticateToken,
  param('roomId').isUUID().withMessage('Invalid room ID'),
  param('userId').isUUID().withMessage('Invalid user ID'),
  validateRequest,
  asyncHandler(removeCoHost)
);

// Transfer host privileges (host only)
router.post('/:roomId/transfer-host',
  authenticateToken,
  param('roomId').isUUID().withMessage('Invalid room ID'),
  body('newHostId').isUUID().withMessage('Invalid new host ID'),
  validateRequest,
  asyncHandler(transferHost)
);

export { router as djRoutes };
