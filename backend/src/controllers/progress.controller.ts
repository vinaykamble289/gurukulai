import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ProgressService } from '../services/progress.service';

export class ProgressController {
  private progressService = new ProgressService();

  getOverview = async (req: AuthRequest, res: Response) => {
    const overview = await this.progressService.getOverview(req.userId!);
    res.json({ overview });
  };

  getAnalytics = async (req: AuthRequest, res: Response) => {
    const analytics = await this.progressService.getAnalytics(req.userId!);
    res.json({ analytics });
  };

  getTopicProgress = async (req: AuthRequest, res: Response) => {
    const { topicId } = req.params;
    const progress = await this.progressService.getTopicProgress(req.userId!, topicId);
    res.json({ progress });
  };

  getRetentionMetrics = async (req: AuthRequest, res: Response) => {
    const metrics = await this.progressService.getRetentionMetrics(req.userId!);
    res.json({ metrics });
  };
}
