import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware';
import { createBooking, getBooking, getMyTrips, cancelBooking, changeSeat, rescheduleFlight } from '../controllers/bookingController';

const router = Router();

router.use(requireAuth);

router.post('/', createBooking);
router.get('/my-trips', getMyTrips);
router.get('/:id', getBooking);
router.patch('/:id/cancel', cancelBooking);
router.patch('/:id/seat', changeSeat);
router.patch('/:id/reschedule', rescheduleFlight);

export default router;
