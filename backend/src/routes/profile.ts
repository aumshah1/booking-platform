import { Router } from 'express';
import multer from 'multer';
import { getProfile, updateProfile, uploadAvatar, changePassword, deleteAccount } from '../controllers/profileController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.put('/password', changePassword);
router.delete('/', deleteAccount);

export default router;
