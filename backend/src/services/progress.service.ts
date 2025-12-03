import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

export class ProgressService {
  async getOverview(userId: string) {
    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Get topic progress
    const { data: topicProgress } = await supabase
      .from('user_topic_progress')
      .select('mastery_level')
      .eq('user_id', userId);

    // Get concept progress
    const { data: conceptProgress } = await supabase
      .from('user_concept_progress')
      .select('mastery_level')
      .eq('user_id', userId);

    // Calculate overall mastery
    const allProgress = [...(topicProgress || []), ...(conceptProgress || [])];
    const overallMastery = allProgress.length > 0
      ? allProgress.reduce((sum, p) => sum + p.mastery_level, 0) / allProgress.length
      : 0;

    // Count mastered concepts (>= 80% mastery)
    const conceptsMastered = (conceptProgress || []).filter(c => c.mastery_level >= 80).length;
    const totalConcepts = conceptProgress?.length || 0;

    // Calculate learning velocity (mastery gained this week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: recentSessions } = await supabase
      .from('learning_sessions')
      .select('average_understanding')
      .eq('user_id', userId)
      .gte('started_at', oneWeekAgo.toISOString())
      .eq('status', 'completed');

    const learningVelocity = recentSessions?.length || 0;

    return {
      overallMastery: Math.round(overallMastery),
      streak: profile?.streak_days || 0,
      conceptsMastered,
      totalConcepts,
      learningVelocity,
      level: profile?.level || 1,
      xp: profile?.xp || 0,
      lastActivity: profile?.last_activity_date
    };
  }

  async getAnalytics(userId: string) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get sessions this week
    const { data: sessions } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', oneWeekAgo.toISOString())
      .eq('status', 'completed');

    const sessionsThisWeek = sessions?.length || 0;
    const timeSpent = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0;
    const avgUnderstanding = sessions && sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.average_understanding || 0), 0) / sessions.length
      : 0;

    // Performance by time of day
    const performanceByTime = this.calculatePerformanceByTime(sessions || []);

    // Get cognitive load trends
    const { data: responses } = await supabase
      .from('user_responses')
      .select('cognitive_load, created_at')
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo.toISOString())
      .order('created_at', { ascending: true });

    const cognitiveLoadTrend = responses?.map(r => ({
      timestamp: r.created_at,
      load: r.cognitive_load
    })) || [];

    // Get strengths and growth areas
    const strengthsAndGrowth = await this.analyzeStrengthsAndGrowth(userId);

    return {
      sessionsThisWeek,
      timeSpent: Math.round(timeSpent / 60), // Convert to minutes
      averageUnderstanding: Math.round(avgUnderstanding),
      performanceByTime,
      cognitiveLoadTrend,
      ...strengthsAndGrowth
    };
  }

  private calculatePerformanceByTime(sessions: any[]) {
    const timeSlots = {
      morning: [] as number[],
      afternoon: [] as number[],
      evening: [] as number[]
    };

    sessions.forEach(session => {
      const hour = new Date(session.started_at).getHours();
      const score = session.average_understanding || 0;

      if (hour >= 5 && hour < 12) {
        timeSlots.morning.push(score);
      } else if (hour >= 12 && hour < 17) {
        timeSlots.afternoon.push(score);
      } else {
        timeSlots.evening.push(score);
      }
    });

    return {
      morning: timeSlots.morning.length > 0
        ? Math.round(timeSlots.morning.reduce((a, b) => a + b, 0) / timeSlots.morning.length)
        : 0,
      afternoon: timeSlots.afternoon.length > 0
        ? Math.round(timeSlots.afternoon.reduce((a, b) => a + b, 0) / timeSlots.afternoon.length)
        : 0,
      evening: timeSlots.evening.length > 0
        ? Math.round(timeSlots.evening.reduce((a, b) => a + b, 0) / timeSlots.evening.length)
        : 0
    };
  }

  private async analyzeStrengthsAndGrowth(userId: string) {
    // Get topic progress
    const { data: topicProgress } = await supabase
      .from('user_topic_progress')
      .select('*, topics(name, subject)')
      .eq('user_id', userId)
      .order('mastery_level', { ascending: false });

    const strengths = (topicProgress || [])
      .filter(p => p.mastery_level >= 70)
      .slice(0, 3)
      .map(p => p.topics?.name || 'Unknown');

    const growthAreas = (topicProgress || [])
      .filter(p => p.mastery_level < 50)
      .slice(0, 3)
      .map(p => p.topics?.name || 'Unknown');

    return {
      strengths,
      growthAreas
    };
  }

  async getTopicProgress(userId: string, topicId: string) {
    const { data: progress, error } = await supabase
      .from('user_topic_progress')
      .select(`
        *,
        topics(
          name,
          description,
          concepts(id)
        )
      `)
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new AppError(500, 'Failed to fetch progress');
    }

    // Get concept progress for this topic
    const { data: conceptProgress } = await supabase
      .from('user_concept_progress')
      .select('*, concepts!inner(topic_id)')
      .eq('user_id', userId)
      .eq('concepts.topic_id', topicId);

    const totalConcepts = progress?.topics?.concepts?.length || 0;
    const conceptsCompleted = (conceptProgress || []).filter(c => c.mastery_level >= 80).length;

    return {
      topicId,
      topicName: progress?.topics?.name,
      mastery: Math.round(progress?.mastery_level || 0),
      conceptsCompleted,
      totalConcepts,
      timeSpent: Math.round((progress?.time_spent_seconds || 0) / 60),
      lastPracticed: progress?.last_practiced_at,
      concepts: conceptProgress?.map(c => ({
        id: c.concept_id,
        mastery: c.mastery_level,
        lastReviewed: c.last_reviewed_at,
        nextReview: c.next_review_at
      }))
    };
  }

  async getRetentionMetrics(userId: string) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Get concept progress with review dates
    const { data: concepts } = await supabase
      .from('user_concept_progress')
      .select('*')
      .eq('user_id', userId);

    if (!concepts || concepts.length === 0) {
      return {
        shortTerm: 0,
        mediumTerm: 0,
        longTerm: 0
      };
    }

    // Calculate retention for different time periods
    const shortTermConcepts = concepts.filter(c => 
      c.last_reviewed_at && new Date(c.last_reviewed_at) >= oneWeekAgo
    );
    const mediumTermConcepts = concepts.filter(c => 
      c.last_reviewed_at && new Date(c.last_reviewed_at) >= oneMonthAgo && new Date(c.last_reviewed_at) < oneWeekAgo
    );
    const longTermConcepts = concepts.filter(c => 
      c.last_reviewed_at && new Date(c.last_reviewed_at) >= threeMonthsAgo && new Date(c.last_reviewed_at) < oneMonthAgo
    );

    const calcAvgRetention = (conceptList: any[]) => {
      if (conceptList.length === 0) return 0;
      return conceptList.reduce((sum, c) => sum + (c.retention_strength || c.mastery_level), 0) / conceptList.length;
    };

    return {
      shortTerm: Math.round(calcAvgRetention(shortTermConcepts)),
      mediumTerm: Math.round(calcAvgRetention(mediumTermConcepts)),
      longTerm: Math.round(calcAvgRetention(longTermConcepts)),
      totalConcepts: concepts.length,
      conceptsDueForReview: concepts.filter(c => 
        c.next_review_at && new Date(c.next_review_at) <= now
      ).length
    };
  }

  async getConceptsDueForReview(userId: string) {
    const now = new Date().toISOString();

    const { data: concepts, error } = await supabase
      .from('user_concept_progress')
      .select(`
        *,
        concepts(
          id,
          name,
          description,
          topics(name)
        )
      `)
      .eq('user_id', userId)
      .lte('next_review_at', now)
      .order('next_review_at', { ascending: true })
      .limit(10);

    if (error) {
      throw new AppError(500, 'Failed to fetch concepts for review');
    }

    return concepts?.map(c => ({
      conceptId: c.concept_id,
      conceptName: c.concepts?.name,
      topicName: c.concepts?.topics?.name,
      mastery: c.mastery_level,
      lastReviewed: c.last_reviewed_at,
      dueDate: c.next_review_at,
      reviewCount: c.review_count
    })) || [];
  }
}
