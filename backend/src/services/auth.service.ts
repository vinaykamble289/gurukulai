import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

export class AuthService {
  async register(email: string, password: string, name: string) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      throw new AppError(400, authError.message);
    }

    if (!authData.user) {
      throw new AppError(400, 'Failed to create user');
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        name,
        level: 1,
        xp: 0,
        streak_days: 0
      });

    if (profileError) {
      throw new AppError(500, 'Failed to create user profile');
    }

    // Create default preferences
    await supabase
      .from('user_preferences')
      .insert({
        user_id: authData.user.id
      });

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name
      },
      session: authData.session
    };
  }

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (!data.user) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name
      },
      session: data.session
    };
  }

  async logout(accessToken: string) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new AppError(500, 'Logout failed');
    }
    return { message: 'Logged out successfully' };
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      throw new AppError(401, 'Invalid refresh token');
    }

    return { session: data.session };
  }

  async verifyToken(token: string) {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new AppError(401, 'Invalid token');
    }

    return user;
  }
}
