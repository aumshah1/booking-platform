import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware';
import { getAnalytics, getUsers, deleteUser, getAllBookings, getFeedback, updateFeedbackStatus } from '../controllers/adminController';

const router = Router();

// Apply middleware to all routes
router.use(requireAuth, requireAdmin);

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.get('/bookings', getAllBookings);
router.get('/feedback', getFeedback);
router.put('/feedback/:id', updateFeedbackStatus);

export default router;
