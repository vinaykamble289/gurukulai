import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { SessionService } from '../services/session.service';
import { z } from 'zod';

const startSessionSchema = z.object({
  topicId: z.string().uuid(),
  difficulty: z.number().min(1).max(10).optional()
});

const submitResponseSchema = z.object({
  questionId: z.string().uuid(),
  response: z.string().min(1)
});

export class SessionController {
  private sessionService = new SessionService();

  startSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { topicId, difficulty } = startSessionSchema.parse(req.body);
      const session = await this.sessionService.createSession(req.userId!, topicId, difficulty);
      res.json({ session });
    } catch (error) {
      next(error);
    }
  };

  getSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const session = await this.sessionService.getSession(sessionId, req.userId!);
      res.json({ session });
    } catch (error) {
      next(error);
    }
  };

  submitResponse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const { questionId, response } = submitResponseSchema.parse(req.body);
      const result = await this.sessionService.submitResponse(sessionId, questionId, response, req.userId!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  completeSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const summary = await this.sessionService.completeSession(sessionId, req.userId!);
      res.json({ summary });
    } catch (error) {
      next(error);
    }
  };

  getUserSessions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const sessions = await this.sessionService.getUserSessions(req.userId!, limit);
      res.json({ sessions });
    } catch (error) {
      next(error);
    }
  };

  pauseSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const result = await this.sessionService.pauseSession(sessionId, req.userId!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  resumeSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const result = await this.sessionService.resumeSession(sessionId, req.userId!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
