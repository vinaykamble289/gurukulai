# Database Design & ER Diagram

## Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   auth.users     │ (Supabase Auth)
├──────────────────┤
│ id (PK)          │
│ email            │
│ created_at       │
└──────────────────┘
         │
         │ 1:1
         ↓
┌──────────────────┐
│ user_profiles    │
├──────────────────┤
│ id (PK, FK)      │───────────────────────┐
│ name             │                       │
│ level            │                       │
│ xp               │                       │
│ streak_days      │                       │
│ last_activity    │                       │
└──────────────────┘                       │
         │                                 │
         │ 1:1                             │
         ↓                                 │
┌──────────────────┐                       │
│user_preferences  │                       │
├──────────────────┤                       │
│ user_id (PK,FK)  │                       │
│ session_duration │                       │
│ difficulty_pref  │                       │
│ notifications    │                       │
└──────────────────┘                       │
                                           │
         ┌─────────────────────────────────┤
         │                                 │
         │ 1:N                             │ 1:N
         ↓                                 ↓
┌──────────────────┐              ┌──────────────────┐
│learning_sessions │              │user_topic_progress│
├──────────────────┤              ├──────────────────┤
│ id (PK)          │              │ id (PK)          │
│ user_id (FK)     │              │ user_id (FK)     │
│ topic_id (FK)    │──┐           │ topic_id (FK)    │──┐
│ status           │  │           │ mastery_level    │  │
│ difficulty       │  │           │ time_spent       │  │
│ started_at       │  │           │ last_practiced   │  │
│ completed_at     │  │           └──────────────────┘  │
│ questions_count  │  │                                 │
│ avg_understanding│  │                                 │
└──────────────────┘  │                                 │
         │            │                                 │
         │ 1:N        │                                 │
         ↓            │                                 │
┌──────────────────┐  │           ┌──────────────────┐  │
│   questions      │  │           │     topics       │  │
├──────────────────┤  │           ├──────────────────┤  │
│ id (PK)          │  │           │ id (PK)          │◄─┘
│ session_id (FK)  │  │           │ name             │
│ concept_id (FK)  │──┼───────┐   │ description      │
│ question_text    │  │       │   │ subject          │
│ question_type    │  │       │   │ difficulty_range │
│ difficulty       │  │       │   │ prerequisites    │
│ context          │  │       │   └──────────────────┘
└──────────────────┘  │       │            │
         │            │       │            │ 1:N
         │ 1:N        │       │            ↓
         ↓            │       │   ┌──────────────────┐
┌──────────────────┐  │       │   │    concepts      │
│ user_responses   │  │       │   ├──────────────────┤
├──────────────────┤  │       └──→│ id (PK)          │
│ id (PK)          │  │           │ topic_id (FK)    │
│ question_id (FK) │  │           │ name             │
│ user_id (FK)     │──┘           │ description      │
│ response_text    │              │ difficulty       │
│ understanding    │              │ prerequisites    │
│ cognitive_load   │              └──────────────────┘
│ evaluation       │                       │
│ response_time    │                       │ 1:N
└──────────────────┘                       ↓
         │                        ┌──────────────────┐
         │ 1:N                    │user_concept_prog │
         ↓                        ├──────────────────┤
┌──────────────────┐              │ id (PK)          │
│      hints       │              │ user_id (FK)     │
├──────────────────┤              │ concept_id (FK)  │
│ id (PK)          │              │ mastery_level    │
│ question_id (FK) │              │ retention        │
│ level (1-3)      │              │ last_reviewed    │
│ hint_text        │              │ next_review      │
└──────────────────┘              │ review_count     │
                                  └──────────────────┘

┌──────────────────┐
│analytics_events  │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ event_type       │
│ session_id (FK)  │
│ event_data       │
│ created_at       │
└──────────────────┘
```

---

## Table Descriptions

### Core User Tables

#### `user_profiles`
Extends Supabase auth.users with learning-specific data.

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships**:
- 1:1 with `auth.users`
- 1:1 with `user_preferences`
- 1:N with `learning_sessions`
- 1:N with `user_topic_progress`

#### `user_preferences`
User settings and learning preferences.

```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id),
  session_duration INTEGER DEFAULT 15,
  difficulty_preference TEXT DEFAULT 'adaptive',
  learning_modality TEXT DEFAULT 'visual',
  notifications_enabled BOOLEAN DEFAULT true
);
```

---

### Content Tables

#### `topics`
Learning topics (e.g., "Algebra", "Physics").

```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  difficulty_range INTEGER[] DEFAULT '{1,10}',
  prerequisites UUID[]
);
```

**Relationships**:
- 1:N with `concepts`
- 1:N with `learning_sessions`
- 1:N with `user_topic_progress`

#### `concepts`
Specific concepts within topics.

```sql
CREATE TABLE concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES topics(id),
  name TEXT NOT NULL,
  description TEXT,
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 10),
  prerequisites UUID[]
);
```

**Relationships**:
- N:1 with `topics`
- 1:N with `questions`
- 1:N with `user_concept_progress`

---

### Session Tables

#### `learning_sessions`
Individual learning sessions.

```sql
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  topic_id UUID REFERENCES topics(id),
  status TEXT CHECK (status IN ('active', 'paused', 'completed')),
  initial_difficulty INTEGER,
  current_difficulty INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  questions_completed INTEGER DEFAULT 0,
  average_understanding DECIMAL(5,2),
  cognitive_load_avg DECIMAL(5,2)
);
```

**Relationships**:
- N:1 with `user_profiles`
- N:1 with `topics`
- 1:N with `questions`

#### `questions`
Generated Socratic questions.

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES learning_sessions(id),
  concept_id UUID REFERENCES concepts(id),
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN 
    ('guided', 'scaffolded', 'open-ended')),
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 10),
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships**:
- N:1 with `learning_sessions`
- N:1 with `concepts`
- 1:N with `user_responses`
- 1:N with `hints`

---

### Response & Progress Tables

#### `user_responses`
User answers to questions.

```sql
CREATE TABLE user_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id),
  user_id UUID REFERENCES user_profiles(id),
  response_text TEXT NOT NULL,
  understanding_score INTEGER CHECK (understanding_score >= 0 
    AND understanding_score <= 100),
  cognitive_load INTEGER CHECK (cognitive_load >= 0 
    AND cognitive_load <= 100),
  evaluation JSONB,
  response_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships**:
- N:1 with `questions`
- N:1 with `user_profiles`

#### `user_topic_progress`
Progress tracking per topic.

```sql
CREATE TABLE user_topic_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  topic_id UUID REFERENCES topics(id),
  mastery_level DECIMAL(5,2) CHECK (mastery_level >= 0 
    AND mastery_level <= 100),
  time_spent_seconds INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  UNIQUE(user_id, topic_id)
);
```

#### `user_concept_progress`
Progress tracking per concept (for spaced repetition).

```sql
CREATE TABLE user_concept_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  concept_id UUID REFERENCES concepts(id),
  mastery_level DECIMAL(5,2),
  retention_strength DECIMAL(5,2),
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  review_count INTEGER DEFAULT 0,
  UNIQUE(user_id, concept_id)
);
```

---

### Support Tables

#### `hints`
Progressive hints for questions.

```sql
CREATE TABLE hints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id),
  level INTEGER CHECK (level >= 1 AND level <= 3),
  hint_text TEXT NOT NULL
);
```

#### `analytics_events`
Event tracking for analytics.

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  event_type TEXT NOT NULL,
  session_id UUID REFERENCES learning_sessions(id),
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

*Continued in IMPLEMENTATION_DETAILS.md...*
