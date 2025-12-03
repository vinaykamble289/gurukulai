import { Router } from 'express';
import { SessionController } from '../controllers/session.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const sessionController = new SessionController();

router.use(authenticate);

router.post('/start', sessionController.startSession);
router.get('/', sessionController.getUserSessions);
router.get('/:sessionId', sessionController.getSession);
router.post('/:sessionId/submit', sessionController.submitResponse);
router.post('/:sessionId/complete', sessionController.completeSession);
router.post('/:sessionId/pause', sessionController.pauseSession);
router.post('/:sessionId/resume', sessionController.resumeSession);

export default router;
