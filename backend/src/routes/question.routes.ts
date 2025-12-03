import { Router } from 'express';
import { QuestionController } from '../controllers/question.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const questionController = new QuestionController();

router.use(authenticate);

router.post('/generate', questionController.generateQuestion);
router.post('/:questionId/hint', questionController.getHint);
router.post('/:questionId/evaluate', questionController.evaluateResponse);

export default router;
