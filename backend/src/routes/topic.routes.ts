import { Router } from 'express';
import { TopicController } from '../controllers/topic.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const topicController = new TopicController();

router.get('/', topicController.getAllTopics);
router.post('/', authenticate, topicController.createTopic);
router.get('/:topicId', topicController.getTopic);
router.get('/:topicId/concepts', topicController.getTopicConcepts);

export default router;
