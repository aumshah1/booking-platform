import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware';
import { createFlight, updateFlight, deleteFlight, getFlight, searchFlights } from '../controllers/flightController';
import { getSeats, adminUpdateSeatStatus } from '../controllers/seatController';

const router = Router();

// Search is public or protected depending on business logic, making it public for now
router.get('/search', searchFlights);

// Get specific flight
router.get('/:id', getFlight);

// Get flight seats
router.get('/:id/seats', getSeats);

// Protected routes (Admin functionality theoretically, but using basic auth middleware for now)
router.use(requireAuth, requireAdmin);
router.post('/', createFlight);
router.put('/:id', updateFlight);
router.delete('/:id', deleteFlight);

router.patch('/seats/:seatId/status', adminUpdateSeatStatus);

export default router;
