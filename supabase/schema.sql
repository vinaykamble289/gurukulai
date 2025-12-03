-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  session_duration INTEGER DEFAULT 15,
  difficulty_preference TEXT DEFAULT 'adaptive',
  learning_modality TEXT DEFAULT 'visual',
  notifications_enabled BOOLEAN DEFAULT true,
  daily_reminders BOOLEAN DEFAULT true,
  review_notifications BOOLEAN DEFAULT true,
  achievement_alerts BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  difficulty_range INTEGER[] DEFAULT '{1,10}',
  parent_topic_id UUID REFERENCES public.topics(id),
  prerequisites UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Concepts within topics
CREATE TABLE public.concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 10),
  prerequisites UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress on topics
CREATE TABLE public.user_topic_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  mastery_level DECIMAL(5,2) DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  time_spent_seconds INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- User progress on concepts
CREATE TABLE public.user_concept_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES public.concepts(id) ON DELETE CASCADE,
  mastery_level DECIMAL(5,2) DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  retention_strength DECIMAL(5,2) DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, concept_id)
);

-- Learning sessions
CREATE TABLE public.learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  initial_difficulty INTEGER,
  current_difficulty INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  questions_completed INTEGER DEFAULT 0,
  average_understanding DECIMAL(5,2),
  cognitive_load_avg DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES public.concepts(id),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('open-ended', 'guided', 'scaffolded')),
  difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 10),
  context JSONB,
  expected_elements TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User responses
CREATE TABLE public.user_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  understanding_score DECIMAL(5,2),
  cognitive_load DECIMAL(5,2),
  response_time_seconds INTEGER,
  hint_level_used INTEGER DEFAULT 0,
  evaluation JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hints
CREATE TABLE public.hints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
  hint_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  badge_icon TEXT,
  xp_reward INTEGER DEFAULT 0,
  criteria JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Analytics events
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  session_id UUID REFERENCES public.learning_sessions(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_topic_progress_user ON public.user_topic_progress(user_id);
CREATE INDEX idx_user_concept_progress_user ON public.user_concept_progress(user_id);
CREATE INDEX idx_user_concept_progress_next_review ON public.user_concept_progress(next_review_at);
CREATE INDEX idx_learning_sessions_user ON public.learning_sessions(user_id);
CREATE INDEX idx_learning_sessions_status ON public.learning_sessions(status);
CREATE INDEX idx_questions_session ON public.questions(session_id);
CREATE INDEX idx_user_responses_user ON public.user_responses(user_id);
CREATE INDEX idx_user_responses_question ON public.user_responses(question_id);
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);

-- Row Level Security (RLS) Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_concept_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies for user_preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for user_topic_progress
CREATE POLICY "Users can view own progress" ON public.user_topic_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Policies for learning_sessions
CREATE POLICY "Users can view own sessions" ON public.learning_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Policies for user_responses
CREATE POLICY "Users can view own responses" ON public.user_responses
  FOR SELECT USING (auth.uid() = user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_topic_progress_updated_at BEFORE UPDATE ON public.user_topic_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_concept_progress_updated_at BEFORE UPDATE ON public.user_concept_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
