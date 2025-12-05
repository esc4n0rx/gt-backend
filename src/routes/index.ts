import { Router } from 'express';
import authRoutes from './auth-routes';
import inviteRoutes from './invite-routes';
import adminRoutes from './admin-routes';

const router: Router = Router();

router.use('/auth', authRoutes);
router.use('/invites', inviteRoutes);
router.use('/admin', adminRoutes);

export default router;