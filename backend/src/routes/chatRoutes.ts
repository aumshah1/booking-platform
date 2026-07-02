import { Router } from 'express';
import { getChatHistory, sendMessage } from '../controllers/chatController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/', getChatHistory);
router.post('/', sendMessage);

export default router;
