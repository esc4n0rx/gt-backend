import { Router } from 'express';
import authRoutes from './auth-routes';
import inviteRoutes from './invite-routes';
import adminRoutes from './admin-routes';
import profileRoutes from './profile-routes';
import moderationRoutes from './moderation-routes';
import categoryRoutes from './category-routes';
import threadRoutes from './thread-routes';
import postRoutes from './post-routes';
import likeRoutes from './like-routes';
import externalApiRoutes from './external-api-routes';

const router: Router = Router();

router.use('/auth', authRoutes);
router.use('/invites', inviteRoutes);
router.use('/admin', adminRoutes);
router.use('/profile', profileRoutes);
router.use('/moderation', moderationRoutes);
router.use('/categories', categoryRoutes);
router.use('/threads', threadRoutes);
router.use('/posts', postRoutes);
router.use('/likes', likeRoutes);
router.use('/external', externalApiRoutes);

export default router;