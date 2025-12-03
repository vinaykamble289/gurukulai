import { Router } from 'express';
import { ProgressController } from '../controllers/progress.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const progressController = new ProgressController();

router.use(authenticate);

router.get('/overview', progressController.getOverview);
router.get('/analytics', progressController.getAnalytics);
router.get('/topics/:topicId', progressController.getTopicProgress);
router.get('/retention', progressController.getRetentionMetrics);

export default router;
