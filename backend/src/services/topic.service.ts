import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

export class TopicService {
  async getAllTopics() {
    const { data, error } = await supabase
      .from('topics')
      .select('id, name, description, subject, difficulty_range')
      .order('name');

    if (error) {
      throw new AppError(500, 'Failed to fetch topics');
    }

    return data;
  }

  async getTopic(topicId: string) {
    const { data, error } = await supabase
      .from('topics')
      .select('*, concepts(*)')
      .eq('id', topicId)
      .single();

    if (error || !data) {
      throw new AppError(404, 'Topic not found');
    }

    return data;
  }

  async getTopicConcepts(topicId: string) {
    const { data, error } = await supabase
      .from('concepts')
      .select('*')
      .eq('topic_id', topicId)
      .order('difficulty');

    if (error) {
      throw new AppError(500, 'Failed to fetch concepts');
    }

    return data;
  }

  async createTopic(topicData: {
    name: string;
    description?: string;
    subject: string;
    difficulty_range?: number[];
  }) {
    const { data, error } = await supabase
      .from('topics')
      .insert({
        name: topicData.name,
        description: topicData.description,
        subject: topicData.subject,
        difficulty_range: topicData.difficulty_range || [1, 10]
      })
      .select()
      .single();

    if (error) {
      throw new AppError(500, 'Failed to create topic');
    }

    return data;
  }
}
