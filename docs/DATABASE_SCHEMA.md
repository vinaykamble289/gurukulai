# Complete Database Schema

## Database Architecture

The platform uses a hybrid database approach:

1. **PostgreSQL**: Relational data requiring ACID compliance
2. **MongoDB**: Unstructured logs and flexible analytics data
3. **Redis**: Caching and real-time session state

## PostgreSQL Schema

### Table: users

Stores core user account information

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    education_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### Table: learner_profiles

Stores detailed learner characteristics and preferences

```sql
CREATE TABLE learner_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Learning Preferences
    modality_preference VARCHAR(50) DEFAULT 'visual', -- visual, auditory, kinesthetic, mixed
    session_duration_preference VARCHAR(20) DEFAULT 'medium', -- short, medium, long
    difficulty_preference VARCHAR(20) DEFAULT 'adaptive', -- easy, moderate, challenging, adaptive
    
    -- Cognitive Profile
    working_memory_capacity VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    processing_speed VARCHAR(20) DEFAULT 'medium', -- slow, medium, fast
    attention_span_minutes INTEGER DEFAULT 25,
    
    -- Engagement Metrics
    total_sessions INTEGER DEFAULT 0,
    total_time_minutes INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_modality CHECK (modality_preference IN ('visual', 'auditory', 'kinesthetic', 'mixed')),
    CONSTRAINT valid_duration CHECK (session_duration_preference IN ('short', 'medium', 'long')),
    CONSTRAINT positive_attention CHECK (attention_span_minutes > 0)
);

CREATE INDEX idx_learner_profiles_user_id ON learner_profiles(user_id);
```

### Table: knowledge_state

Tracks mastery level for each concept per learner

```sql
CREATE TABLE knowledge_state (
    knowledge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    concept VARCHAR(100) NOT NULL,
    
    -- Mastery Metrics
    mastery_level DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00
    confidence_level DECIMAL(3,2) DEFAULT 0.00,
    
    -- IRT Parameters (Item Response Theory)
    ability_estimate DECIMAL(5,2) DEFAULT 0.00, -- theta parameter
    ability_std_error DECIMAL(5,2) DEFAULT 1.00,
    
    -- Bayesian Knowledge Tracing
    p_learned DECIMAL(3,2) DEFAULT 0.00, -- probability concept is learned
    p_transit DECIMAL(3,2) DEFAULT 0.10, -- probability of learning
    p_slip DECIMAL(3,2) DEFAULT 0.10, -- probability of slip (know but answer wrong)
    p_guess DECIMAL(3,2) DEFAULT 0.25, -- probability of guess (don't know but answer right)
    
    -- Tracking
    first_exposure TIMESTAMP,
    last_reviewed TIMESTAMP,
    review_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    
    -- Spaced Repetition
    next_review_date TIMESTAMP,
    repetition_interval_days INTEGER DEFAULT 1,
    easiness_factor DECIMAL(3,2) DEFAULT 2.50, -- SM-2 algorithm
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_mastery CHECK (mastery_level BETWEEN 0 AND 1),
    CONSTRAINT valid_confidence CHECK (confidence_level BETWEEN 0 AND 1),
    CONSTRAINT valid_probabilities CHECK (
        p_learned BETWEEN 0 AND 1 AND
        p_transit BETWEEN 0 AND 1 AND
        p_slip BETWEEN 0 AND 1 AND
        p_guess BETWEEN 0 AND 1
    ),
    UNIQUE(user_id, subject, topic, concept)
);

CREATE INDEX idx_knowledge_user_id ON knowledge_state(user_id);
CREATE INDEX idx_knowledge_subject ON knowledge_state(subject);
CREATE INDEX idx_knowledge_next_review ON knowledge_state(next_review_date);
CREATE INDEX idx_knowledge_mastery ON knowledge_state(mastery_level);
```

### Table: learning_sessions

Records all learning sessions

```sql
CREATE TABLE learning_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Session Details
    subject VARCHAR(100) NOT NULL,
    session_type VARCHAR(50) NOT NULL, -- practice, review, assessment, exploration
    
    -- Timing
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    
    -- Context
    device_type VARCHAR(50), -- mobile, tablet, desktop, voice
    location_context VARCHAR(50), -- home, commute, work, other
    
    -- Performance
    questions_asked INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    average_response_time DECIMAL(6,2), -- seconds
    
    -- Difficulty
    initial_difficulty INTEGER, -- 1-10 scale
    final_difficulty INTEGER,
    average_difficulty DECIMAL(3,1),
    
    -- Cognitive Metrics
    average_cognitive_load DECIMAL(5,2),
    max_cognitive_load DECIMAL(5,2),
    cognitive_overload_events INTEGER DEFAULT 0,
    
    -- Outcomes
    mastery_gain DECIMAL(3,2), -- change in mastery level
    concepts_covered TEXT[], -- array of concept IDs
    
    -- Feedback
    learner_difficulty_rating INTEGER, -- 1-10
    learner_engagement_rating INTEGER, -- 1-10
    learner_satisfaction_rating INTEGER, -- 1-10
    learner_comments TEXT,
    
    -- Status
    completed BOOLEAN DEFAULT FALSE,
    interrupted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_difficulty CHECK (
        initial_difficulty BETWEEN 1 AND 10 AND
        final_difficulty BETWEEN 1 AND 10
    ),
    CONSTRAINT valid_ratings CHECK (
        (learner_difficulty_rating IS NULL OR learner_difficulty_rating BETWEEN 1 AND 10) AND
        (learner_engagement_rating IS NULL OR learner_engagement_rating BETWEEN 1 AND 10) AND
        (learner_satisfaction_rating IS NULL OR learner_satisfaction_rating BETWEEN 1 AND 10)
    )
);

CREATE INDEX idx_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX idx_sessions_start_time ON learning_sessions(start_time);
CREATE INDEX idx_sessions_subject ON learning_sessions(subject);
CREATE INDEX idx_sessions_completed ON learning_sessions(completed);
```

### Table: questions

Question bank with metadata

```sql
CREATE TABLE questions (
    question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Content
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- clarifying, probing_assumptions, probing_reasons, 
                                        -- questioning_viewpoints, probing_implications, 
                                        -- meta_questions
    
    -- Classification
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    concept VARCHAR(100) NOT NULL,
    
    -- Difficulty
    difficulty_level INTEGER NOT NULL, -- 1-10
    cognitive_complexity VARCHAR(50), -- remember, understand, apply, analyze, evaluate, create
    
    -- Expected Response
    expected_reasoning_path JSONB, -- array of reasoning steps
    expected_concepts TEXT[], -- concepts that should be mentioned
    common_misconceptions JSONB, -- array of misconception patterns
    
    -- Hints
    hints JSONB, -- array of hint objects with levels
    
    -- Metadata
    estimated_time_seconds INTEGER,
    prerequisites TEXT[], -- prerequisite concept IDs
    learning_objectives TEXT[],
    
    -- Quality Metrics
    times_asked INTEGER DEFAULT 0,
    average_understanding_score DECIMAL(5,2),
    average_response_time DECIMAL(6,2),
    learner_rating DECIMAL(3,2),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_validated BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    
    CONSTRAINT valid_difficulty CHECK (difficulty_level BETWEEN 1 AND 10),
    CONSTRAINT valid_question_type CHECK (question_type IN (
        'clarifying', 'probing_assumptions', 'probing_reasons',
        'questioning_viewpoints', 'probing_implications', 'meta_questions'
    ))
);

CREATE INDEX idx_questions_subject ON questions(subject);
CREATE INDEX idx_questions_topic ON questions(topic);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);
CREATE INDEX idx_questions_active ON questions(is_active);
```

### Table: question_responses

Records learner responses to questions

```sql
CREATE TABLE question_responses (
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES learning_sessions(session_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(question_id),
    
    -- Response Content
    response_text TEXT NOT NULL,
    response_time_seconds DECIMAL(6,2) NOT NULL,
    
    -- Evaluation
    understanding_score DECIMAL(5,2), -- 0-100
    reasoning_quality VARCHAR(50), -- poor, fair, good, excellent
    concepts_identified TEXT[],
    misconceptions_detected JSONB,
    
    -- Cognitive Metrics
    cognitive_load_at_response DECIMAL(5,2),
    confidence_self_reported INTEGER, -- 1-10
    hints_used INTEGER DEFAULT 0,
    
    -- Correctness (for questions with definitive answers)
    is_correct BOOLEAN,
    partial_credit DECIMAL(3,2), -- 0.00 to 1.00
    
    -- Feedback Given
    feedback_text TEXT,
    feedback_type VARCHAR(50), -- encouraging, corrective, probing_deeper, scaffolding
    
    -- Metadata
    responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_understanding CHECK (understanding_score BETWEEN 0 AND 100),
    CONSTRAINT valid_confidence CHECK (confidence_self_reported IS NULL OR confidence_self_reported BETWEEN 1 AND 10)
);

CREATE INDEX idx_responses_session_id ON question_responses(session_id);
CREATE INDEX idx_responses_user_id ON question_responses(user_id);
CREATE INDEX idx_responses_question_id ON question_responses(question_id);
CREATE INDEX idx_responses_timestamp ON question_responses(responded_at);
```

### Table: cognitive_metrics

Detailed cognitive performance tracking

```sql
CREATE TABLE cognitive_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    session_id UUID REFERENCES learning_sessions(session_id) ON DELETE CASCADE,
    
    -- Timestamp
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Cognitive Load Components
    intrinsic_load DECIMAL(5,2), -- complexity of content itself
    extraneous_load DECIMAL(5,2), -- load from presentation/interface
    germane_load DECIMAL(5,2), -- load from schema construction
    total_load DECIMAL(5,2),
    
    -- Load Indicators
    average_response_time DECIMAL(6,2),
    response_time_variance DECIMAL(6,2),
    error_rate DECIMAL(3,2),
    pause_frequency INTEGER,
    self_reported_difficulty INTEGER, -- 1-10
    
    -- Working Memory
    working_memory_usage DECIMAL(3,2), -- estimated 0-1
    
    -- Attention
    attention_lapses INTEGER,
    focus_score DECIMAL(3,2), -- 0-1
    
    -- Classification
    load_classification VARCHAR(20), -- underload, optimal, overload
    
    CONSTRAINT valid_loads CHECK (
        intrinsic_load >= 0 AND
        extraneous_load >= 0 AND
        germane_load >= 0 AND
        total_load >= 0
    ),
    CONSTRAINT valid_difficulty CHECK (self_reported_difficulty IS NULL OR self_reported_difficulty BETWEEN 1 AND 10)
);

CREATE INDEX idx_cognitive_user_id ON cognitive_metrics(user_id);
CREATE INDEX idx_cognitive_session_id ON cognitive_metrics(session_id);
CREATE INDEX idx_cognitive_timestamp ON cognitive_metrics(measured_at);
```

### Table: retention_tracking

Tracks long-term knowledge retention

```sql
CREATE TABLE retention_tracking (
    retention_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    concept VARCHAR(100) NOT NULL,
    
    -- Initial Learning
    initial_learning_date TIMESTAMP NOT NULL,
    initial_mastery_level DECIMAL(3,2),
    
    -- Retention Tests
    test_date TIMESTAMP NOT NULL,
    days_since_learning INTEGER NOT NULL,
    retention_score DECIMAL(3,2), -- 0-1, how much was retained
    
    -- Forgetting Curve Parameters
    half_life_days DECIMAL(6,2), -- time for retention to drop to 50%
    decay_rate DECIMAL(5,4), -- exponential decay rate
    
    -- Test Details
    test_type VARCHAR(50), -- recall, recognition, application
    test_difficulty INTEGER, -- 1-10
    
    -- Context
    review_count_before_test INTEGER,
    last_review_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_retention CHECK (retention_score BETWEEN 0 AND 1),
    CONSTRAINT valid_mastery CHECK (initial_mastery_level BETWEEN 0 AND 1)
);

CREATE INDEX idx_retention_user_id ON retention_tracking(user_id);
CREATE INDEX idx_retention_concept ON retention_tracking(concept);
CREATE INDEX idx_retention_test_date ON retention_tracking(test_date);
```

### Table: engagement_logs

Tracks engagement signals and patterns

```sql
CREATE TABLE engagement_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    session_id UUID REFERENCES learning_sessions(session_id) ON DELETE CASCADE,
    
    -- Event Details
    event_type VARCHAR(50) NOT NULL, -- session_start, session_end, question_view, 
                                     -- response_submit, hint_request, break_taken,
                                     -- voluntary_extension, early_exit
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Context
    event_context JSONB, -- flexible storage for event-specific data
    
    -- Engagement Indicators
    engagement_score DECIMAL(3,2), -- calculated engagement at this point
    
    CONSTRAINT valid_engagement CHECK (engagement_score IS NULL OR engagement_score BETWEEN 0 AND 1)
);

CREATE INDEX idx_engagement_user_id ON engagement_logs(user_id);
CREATE INDEX idx_engagement_session_id ON engagement_logs(session_id);
CREATE INDEX idx_engagement_type ON engagement_logs(event_type);
CREATE INDEX idx_engagement_timestamp ON engagement_logs(event_timestamp);
```

### Table: achievements

Gamification and motivation system

```sql
CREATE TABLE achievements (
    achievement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Achievement Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- streak, mastery, engagement, milestone
    
    -- Requirements
    requirement_type VARCHAR(50), -- session_count, streak_days, mastery_level, etc.
    requirement_value INTEGER,
    
    -- Rewards
    points INTEGER DEFAULT 0,
    badge_icon VARCHAR(255),
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_achievements_category ON achievements(category);
```

### Table: user_achievements

Tracks which achievements users have earned

```sql
CREATE TABLE user_achievements (
    user_achievement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(achievement_id),
    
    -- Earning Details
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress DECIMAL(3,2) DEFAULT 1.00, -- for partially completed achievements
    
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned_at ON user_achievements(earned_at);
```

### Table: rlhf_feedback

Reinforcement Learning from Human Feedback data

```sql
CREATE TABLE rlhf_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    session_id UUID REFERENCES learning_sessions(session_id),
    
    -- Feedback Context
    feedback_type VARCHAR(50) NOT NULL, -- question_quality, difficulty_appropriateness,
                                        -- feedback_helpfulness, overall_experience
    
    -- State Information (for RL)
    state_snapshot JSONB NOT NULL, -- learner state when feedback given
    action_taken VARCHAR(100), -- what the system did
    
    -- Feedback
    rating INTEGER, -- 1-5 or 1-10 depending on type
    preference_comparison JSONB, -- for pairwise comparisons
    explicit_feedback TEXT,
    
    -- Implicit Signals
    time_to_feedback DECIMAL(6,2), -- how long before feedback given
    subsequent_performance JSONB, -- performance after this interaction
    
    -- Metadata
    feedback_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 10)
);

CREATE INDEX idx_rlhf_user_id ON rlhf_feedback(user_id);
CREATE INDEX idx_rlhf_session_id ON rlhf_feedback(session_id);
CREATE INDEX idx_rlhf_type ON rlhf_feedback(feedback_type);
CREATE INDEX idx_rlhf_timestamp ON rlhf_feedback(feedback_timestamp);
```

## MongoDB Collections

### Collection: interaction_logs

Detailed logs of all interactions (unstructured)

```javascript
{
  _id: ObjectId("..."),
  userId: "usr_abc123",
  sessionId: "ses_xyz789",
  timestamp: ISODate("2024-12-02T09:00:00Z"),
  interactionType: "question_response",
  data: {
    questionId: "q_001",
    questionText: "What is the discriminant?",
    responseText: "It's b² - 4ac",
    responseTime: 45.2,
    cognitiveLoad: 65,
    // ... any other relevant data
  },
  metadata: {
    deviceType: "mobile",
    browserInfo: "Chrome 120",
    networkLatency: 120
  }
}
```

**Indexes**:
```javascript
db.interaction_logs.createIndex({ userId: 1, timestamp: -1 });
db.interaction_logs.createIndex({ sessionId: 1 });
db.interaction_logs.createIndex({ interactionType: 1 });
```

### Collection: analytics_events

Business intelligence and analytics events

```javascript
{
  _id: ObjectId("..."),
  eventName: "mastery_milestone_reached",
  userId: "usr_abc123",
  timestamp: ISODate("2024-12-02T09:00:00Z"),
  properties: {
    subject: "algebra",
    concept: "quadratic_equations",
    masteryLevel: 0.75,
    timeToMastery: 1200 // minutes
  },
  context: {
    sessionCount: 15,
    totalTimeSpent: 1200
  }
}
```

**Indexes**:
```javascript
db.analytics_events.createIndex({ eventName: 1, timestamp: -1 });
db.analytics_events.createIndex({ userId: 1, timestamp: -1 });
```

### Collection: ml_model_predictions

Stores ML model predictions for analysis

```javascript
{
  _id: ObjectId("..."),
  modelName: "difficulty_predictor",
  modelVersion: "v2.1.0",
  userId: "usr_abc123",
  timestamp: ISODate("2024-12-02T09:00:00Z"),
  input: {
    currentMastery: 0.65,
    recentPerformance: [0.8, 0.7, 0.9],
    cognitiveLoad: 60
  },
  prediction: {
    recommendedDifficulty: 7,
    confidence: 0.85
  },
  actual: {
    actualDifficulty: 7,
    performanceScore: 0.82
  }
}
```

**Indexes**:
```javascript
db.ml_model_predictions.createIndex({ modelName: 1, timestamp: -1 });
db.ml_model_predictions.createIndex({ userId: 1 });
```

## Redis Data Structures

### Session State (Hash)

Key: `session:{sessionId}`

```
HSET session:ses_xyz789 userId usr_abc123
HSET session:ses_xyz789 startTime 2024-12-02T09:00:00Z
HSET session:ses_xyz789 currentDifficulty 7
HSET session:ses_xyz789 questionsAsked 5
HSET session:ses_xyz789 cognitiveLoad 65
EXPIRE session:ses_xyz789 7200  # 2 hours
```

### User Cache (Hash)

Key: `user:{userId}`

```
HSET user:usr_abc123 name "John Doe"
HSET user:usr_abc123 currentStreak 7
HSET user:usr_abc123 lastActive 2024-12-02T09:00:00Z
EXPIRE user:usr_abc123 3600  # 1 hour
```

### Real-time Metrics (Sorted Set)

Key: `metrics:cognitive_load:{sessionId}`

```
ZADD metrics:cognitive_load:ses_xyz789 1733133600 65
ZADD metrics:cognitive_load:ses_xyz789 1733133660 68
ZADD metrics:cognitive_load:ses_xyz789 1733133720 62
EXPIRE metrics:cognitive_load:ses_xyz789 7200
```

### Rate Limiting (String)

Key: `ratelimit:{userId}:{endpoint}`

```
INCR ratelimit:usr_abc123:/questions/generate
EXPIRE ratelimit:usr_abc123:/questions/generate 60
```

## Database Relationships Diagram

```
users (1) ──────────── (1) learner_profiles
  │
  │ (1)
  │
  ├─────────────── (many) learning_sessions
  │                         │
  │                         │ (1)
  │                         │
  │                         └─── (many) question_responses
  │                                        │
  │ (1)                                    │ (many)
  │                                        │
  ├─────────────── (many) knowledge_state │
  │                                        │
  │ (1)                                    │
  │                                        │
  ├─────────────── (many) cognitive_metrics
  │                                        │
  │ (1)                              (many)│
  │                                        │
  ├─────────────── (many) retention_tracking
  │                                        │
  │ (1)                                    │
  │                                        │
  ├─────────────── (many) engagement_logs │
  │                                        │
  │ (1)                                    │
  │                                        │
  ├─────────────── (many) rlhf_feedback   │
  │                                        │
  │ (many)                                 │
  │                                        │
  └─────────────── (many) user_achievements
                            │
                            │ (many)
                            │
                      achievements (1)

questions (1) ──────── (many) question_responses
```

## Data Retention Policies

1. **Active User Data**: Retained indefinitely while account is active
2. **Session Data**: Retained for 2 years, then archived
3. **Interaction Logs**: Retained for 1 year, then aggregated and deleted
4. **Analytics Events**: Retained for 3 years
5. **ML Predictions**: Retained for 6 months
6. **Redis Cache**: TTL-based, typically 1-2 hours

## Backup Strategy

1. **PostgreSQL**: Daily full backups, hourly incremental backups
2. **MongoDB**: Daily backups with point-in-time recovery
3. **Redis**: Periodic snapshots (RDB) + AOF for durability

## Data Migration Scripts

See `database/migrations/` directory for version-controlled schema migrations.
