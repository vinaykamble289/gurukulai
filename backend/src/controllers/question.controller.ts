import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { QuestionService } from '../services/question.service';

export class QuestionController {
  private questionService = new QuestionService();

  generateQuestion = async (req: AuthRequest, res: Response) => {
    const { topicId, difficulty, context } = req.body;
    const question = await this.questionService.generateQuestion(req.userId!, topicId, difficulty, context);
    res.json({ question });
  };

  getHint = async (req: AuthRequest, res: Response) => {
    const { questionId } = req.params;
    const { level } = req.body;
    const hint = await this.questionService.getHint(questionId, level, req.userId!);
    res.json({ hint });
  };

  evaluateResponse = async (req: AuthRequest, res: Response) => {
    const { questionId } = req.params;
    const { response } = req.body;
    const evaluation = await this.questionService.evaluateResponse(questionId, response, req.userId!);
    res.json({ evaluation });
  };
}
