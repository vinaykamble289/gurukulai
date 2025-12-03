import { Request, Response, NextFunction } from 'express';
import { TopicService } from '../services/topic.service';

export class TopicController {
  private topicService = new TopicService();

  getAllTopics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const topics = await this.topicService.getAllTopics();
      res.json({ topics });
    } catch (error) {
      next(error);
    }
  };

  getTopic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { topicId } = req.params;
      const topic = await this.topicService.getTopic(topicId);
      res.json({ topic });
    } catch (error) {
      next(error);
    }
  };

  getTopicConcepts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { topicId } = req.params;
      const concepts = await this.topicService.getTopicConcepts(topicId);
      res.json({ concepts });
    } catch (error) {
      next(error);
    }
  };

  createTopic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, subject, difficulty_range } = req.body;
      const topic = await this.topicService.createTopic({
        name,
        description,
        subject,
        difficulty_range
      });
      res.status(201).json({ topic });
    } catch (error) {
      next(error);
    }
  };
}
