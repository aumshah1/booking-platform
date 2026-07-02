import { Router, Request, Response } from 'express';
import { register, login, logout, forgotPassword, resetPassword } from '../controllers/authController';
import { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator } from '../validators/authValidator';
import { validate } from '../middlewares/validate';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/logout', requireAuth, logout);
router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', requireAuth, resetPasswordValidator, validate, resetPassword);

// Dummy protected route for verification
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ message: 'You have access', user: (req as any).user });
});

export default router;
