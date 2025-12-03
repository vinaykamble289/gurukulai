import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { QuestionService } from './question.service';
import { UserService } from './user.service';
import { v4 as uuidv4 } from 'uuid';

export class SessionService {
  private questionService = new QuestionService();
  private userService = new UserService();

  async createSession(userId: string, topicId: string, difficulty?: number) {
    // Ensure user profile exists
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!profile) {
      // Create profile if it doesn't exist
      await supabase.from('user_profiles').insert({
        id: userId,
        name: 'User',
        level: 1,
        xp: 0,
        streak_days: 0
      });

      // Create preferences
      await supabase.from('user_preferences').insert({
        user_id: userId
      });
    }

    // Get user preferences for initial difficulty
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('difficulty_preference')
      .eq('user_id', userId)
      .single();

    // Get user's progress on topic to determine starting difficulty
    const { data: progress } = await supabase
      .from('user_topic_progress')
      .select('mastery_level')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .single();

    let initialDifficulty = difficulty || 5;
    
    if (preferences?.difficulty_preference === 'adaptive' && progress) {
      // Start at difficulty based on mastery level
      initialDifficulty = Math.max(1, Math.min(10, Math.floor(progress.mastery_level / 10)));
    }

    // Create session
    const sessionId = uuidv4();
    const { data: session, error } = await supabase
      .from('learning_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        topic_id: topicId,
        status: 'active',
        initial_difficulty: initialDifficulty,
        current_difficulty: initialDifficulty,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Session creation error:', error);
      throw new AppError(500, `Failed to create session: ${error.message}`);
    }

    if (!session) {
      throw new AppError(500, 'Session was not created');
    }

    // Generate first question
    const firstQuestion = await this.questionService.generateQuestion(
      userId,
      topicId,
      initialDifficulty,
      { sessionId: session.id }
    );

    // Update streak
    await this.userService.updateStreak(userId);

    return {
      id: session.id,
      topicId: session.topic_id,
      status: session.status,
      difficulty: session.current_difficulty,
      startedAt: session.started_at,
      currentQuestion: firstQuestion
    };
  }

  async getSession(sessionId: string, userId: string) {
    const { data: session, error } = await supabase
      .from('learning_sessions')
      .select(`
        *,
        topics(name, description),
        questions(
          id,
          question_text,
          difficulty,
          question_type,
          user_responses(*)
        )
      `)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error || !session) {
      throw new AppError(404, 'Session not found');
    }

    // Find the current question (most recent without a response)
    let currentQuestion = null;
    if (session.questions && session.questions.length > 0) {
      const unansweredQuestion = session.questions.find((q: any) => 
        !q.user_responses || q.user_responses.length === 0
      );
      
      if (unansweredQuestion) {
        currentQuestion = {
          id: unansweredQuestion.id,
          text: unansweredQuestion.question_text,
          type: unansweredQuestion.question_type,
          difficulty: unansweredQuestion.difficulty
        };
      }
    }

    return {
      id: session.id,
      topicId: session.topic_id,
      topicName: session.topics?.name,
      status: session.status,
      difficulty: session.current_difficulty,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      duration: session.duration_seconds,
      questionsCompleted: session.questions_completed,
      averageUnderstanding: session.average_understanding,
      questions: session.questions,
      currentQuestion
    };
  }

  async submitResponse(sessionId: string, questionId: string, response: string, userId: string) {
    const startTime = Date.now();

    // Evaluate the response
    const evaluation = await this.questionService.evaluateResponse(questionId, response, userId);

    const responseTime = Math.floor((Date.now() - startTime) / 1000);

    // Update response with timing
    await supabase
      .from('user_responses')
      .update({ response_time_seconds: responseTime })
      .eq('question_id', questionId)
      .eq('user_id', userId);

    // Get session
    const { data: session } = await supabase
      .from('learning_sessions')
      .select('*, questions(user_responses(understanding_score, cognitive_load))')
      .eq('id', sessionId)
      .single();

    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    // Calculate average cognitive load
    const responses = session.questions.flatMap((q: any) => q.user_responses);
    const avgCognitiveLoad = responses.length > 0
      ? responses.reduce((sum: number, r: any) => sum + (r.cognitive_load || 0), 0) / responses.length
      : 50;

    // Adapt difficulty based on performance and cognitive load
    let newDifficulty = session.current_difficulty;
    
    if (evaluation.score >= 85 && avgCognitiveLoad < 60) {
      newDifficulty = Math.min(10, session.current_difficulty + 1);
    } else if (evaluation.score < 60 || avgCognitiveLoad > 85) {
      newDifficulty = Math.max(1, session.current_difficulty - 1);
    }

    // Update session difficulty
    await supabase
      .from('learning_sessions')
      .update({ current_difficulty: newDifficulty })
      .eq('id', sessionId);

    // Check if we should generate next question
    const shouldContinue = responses.length < (parseInt(process.env.MAX_QUESTIONS_PER_SESSION || '10'));

    let nextQuestion = null;
    if (shouldContinue && session.status === 'active') {
      nextQuestion = await this.questionService.generateQuestion(
        userId,
        session.topic_id,
        newDifficulty,
        {
          sessionId,
          previousQuestion: questionId,
          previousResponse: response
        }
      );
    }

    return {
      evaluation,
      nextQuestion,
      difficultyAdjusted: newDifficulty !== session.current_difficulty,
      newDifficulty,
      cognitiveLoad: avgCognitiveLoad
    };
  }

  async completeSession(sessionId: string, userId: string) {
    const { data: session } = await supabase
      .from('learning_sessions')
      .select(`
        *,
        questions(
          id,
          user_responses(understanding_score, cognitive_load)
        )
      `)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    // Calculate session statistics
    const responses = session.questions.flatMap((q: any) => q.user_responses);
    const questionsCompleted = session.questions.length;
    const avgUnderstanding = responses.length > 0
      ? responses.reduce((sum: number, r: any) => sum + (r.understanding_score || 0), 0) / responses.length
      : 0;
    const avgCognitiveLoad = responses.length > 0
      ? responses.reduce((sum: number, r: any) => sum + (r.cognitive_load || 0), 0) / responses.length
      : 0;

    const duration = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);

    // Update session
    await supabase
      .from('learning_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        questions_completed: questionsCompleted,
        average_understanding: avgUnderstanding,
        cognitive_load_avg: avgCognitiveLoad
      })
      .eq('id', sessionId);

    // Update topic progress
    await this.updateTopicProgress(userId, session.topic_id, avgUnderstanding, duration);

    // Award XP
    const xpEarned = Math.floor(questionsCompleted * 50 + avgUnderstanding * 5);
    const xpResult = await this.userService.addXP(userId, xpEarned);

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: 'session_completed',
      session_id: sessionId,
      event_data: {
        duration,
        questionsCompleted,
        avgUnderstanding,
        avgCognitiveLoad,
        xpEarned
      }
    });

    return {
      sessionId,
      duration,
      questionsCompleted,
      averageUnderstanding: avgUnderstanding,
      averageCognitiveLoad: avgCognitiveLoad,
      xpEarned,
      leveledUp: xpResult?.leveledUp || false,
      newLevel: xpResult?.level
    };
  }

  private async updateTopicProgress(userId: string, topicId: string, understanding: number, duration: number) {
    const { data: existing } = await supabase
      .from('user_topic_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .single();

    if (existing) {
      // Update existing progress
      const newMastery = Math.min(100, existing.mastery_level + understanding * 0.1);
      await supabase
        .from('user_topic_progress')
        .update({
          mastery_level: newMastery,
          time_spent_seconds: existing.time_spent_seconds + duration,
          last_practiced_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new progress record
      await supabase
        .from('user_topic_progress')
        .insert({
          user_id: userId,
          topic_id: topicId,
          mastery_level: understanding * 0.1,
          time_spent_seconds: duration,
          last_practiced_at: new Date().toISOString()
        });
    }
  }

  async getUserSessions(userId: string, limit = 20) {
    const { data: sessions, error } = await supabase
      .from('learning_sessions')
      .select(`
        *,
        topics(name)
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new AppError(500, 'Failed to fetch sessions');
    }

    return sessions.map(s => ({
      id: s.id,
      topicName: s.topics?.name,
      status: s.status,
      startedAt: s.started_at,
      completedAt: s.completed_at,
      duration: s.duration_seconds,
      questionsCompleted: s.questions_completed,
      averageUnderstanding: s.average_understanding
    }));
  }

  async pauseSession(sessionId: string, userId: string) {
    const { error } = await supabase
      .from('learning_sessions')
      .update({ status: 'paused' })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) {
      throw new AppError(500, 'Failed to pause session');
    }

    return { message: 'Session paused' };
  }

  async resumeSession(sessionId: string, userId: string) {
    const { error } = await supabase
      .from('learning_sessions')
      .update({ status: 'active' })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) {
      throw new AppError(500, 'Failed to resume session');
    }

    return { message: 'Session resumed' };
  }
}
