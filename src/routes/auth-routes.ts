import { Router } from 'express';
import { authController } from '../controllers/auth-controller';
import { validate } from '../middlewares/validate-middleware';
import { registerSchema, loginSchema } from '../validators/auth-validators';
import { authMiddleware } from '../middlewares/auth-middleware';

const router: Router = Router();

// POST /api/v1/auth/register
router.post('/register', validate(registerSchema), (req, res, next) => {
  authController.register(req, res, next);
});

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), (req, res, next) => {
  authController.login(req, res, next);
});

// POST /api/v1/auth/logout (requer autenticação)
router.post('/logout', authMiddleware, (req, res, next) => {
  authController.logout(req, res, next);
});

// GET /api/v1/auth/me (requer autenticação)
router.get('/me', authMiddleware, (req, res, next) => {
  authController.me(req, res, next);
});

export default router;