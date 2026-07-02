import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware';
import { getUserProfile, getUpcomingTrips, getRecentBookings, getNotifications } from '../controllers/dashboardController';

const router = Router();

// Protect all dashboard routes
router.use(requireAuth);

router.get('/user', getUserProfile);
router.get('/upcoming-trips', getUpcomingTrips);
router.get('/recent-bookings', getRecentBookings);
router.get('/notifications', getNotifications);

export default router;
