import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

export class UserService {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new AppError(404, 'Profile not found');
    }

    // Get user email from auth
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);

    return {
      id: data.id,
      name: data.name,
      email: user?.email,
      level: data.level,
      xp: data.xp,
      streakDays: data.streak_days,
      lastActivityDate: data.last_activity_date,
      createdAt: data.created_at
    };
  }

  async updateProfile(userId: string, updates: { name?: string }) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        name: updates.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError(500, 'Failed to update profile');
    }

    return data;
  }

  async getPreferences(userId: string) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new AppError(404, 'Preferences not found');
    }

    return {
      sessionDuration: data.session_duration,
      difficultyPreference: data.difficulty_preference,
      learningModality: data.learning_modality,
      notifications: {
        enabled: data.notifications_enabled,
        daily: data.daily_reminders,
        reviews: data.review_notifications,
        achievements: data.achievement_alerts
      },
      quietHours: {
        start: data.quiet_hours_start,
        end: data.quiet_hours_end
      }
    };
  }

  async updatePreferences(userId: string, preferences: any) {
    const updates: any = {};
    
    if (preferences.sessionDuration) updates.session_duration = preferences.sessionDuration;
    if (preferences.difficultyPreference) updates.difficulty_preference = preferences.difficultyPreference;
    if (preferences.learningModality) updates.learning_modality = preferences.learningModality;
    
    if (preferences.notifications) {
      if (preferences.notifications.enabled !== undefined) 
        updates.notifications_enabled = preferences.notifications.enabled;
      if (preferences.notifications.daily !== undefined) 
        updates.daily_reminders = preferences.notifications.daily;
      if (preferences.notifications.reviews !== undefined) 
        updates.review_notifications = preferences.notifications.reviews;
      if (preferences.notifications.achievements !== undefined) 
        updates.achievement_alerts = preferences.notifications.achievements;
    }

    if (preferences.quietHours) {
      if (preferences.quietHours.start) updates.quiet_hours_start = preferences.quietHours.start;
      if (preferences.quietHours.end) updates.quiet_hours_end = preferences.quietHours.end;
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError(500, 'Failed to update preferences');
    }

    return data;
  }

  async updateStreak(userId: string) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('last_activity_date, streak_days')
      .eq('id', userId)
      .single();

    if (!profile) return;

    const today = new Date().toISOString().split('T')[0];
    const lastActivity = profile.last_activity_date;

    let newStreak = profile.streak_days || 0;

    if (lastActivity) {
      const lastDate = new Date(lastActivity);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    await supabase
      .from('user_profiles')
      .update({
        streak_days: newStreak,
        last_activity_date: today
      })
      .eq('id', userId);

    return newStreak;
  }

  async addXP(userId: string, xpAmount: number) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('xp, level')
      .eq('id', userId)
      .single();

    if (!profile) return;

    const newXP = profile.xp + xpAmount;
    const xpPerLevel = 2000;
    const newLevel = Math.floor(newXP / xpPerLevel) + 1;

    await supabase
      .from('user_profiles')
      .update({
        xp: newXP,
        level: newLevel
      })
      .eq('id', userId);

    return { xp: newXP, level: newLevel, leveledUp: newLevel > profile.level };
  }
}
