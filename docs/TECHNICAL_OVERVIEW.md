# Technical Overview - Socratic Learning Platform

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [AI/ML Implementation](#aiml-implementation)
4. [Algorithms](#algorithms)
5. [Database Design](#database-design)
6. [Technical Implementation](#technical-implementation)

---

## System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   React Frontend (Port 5173)                         │  │
│  │   - TypeScript + Vite                                │  │
│  │   - TailwindCSS + Zustand                            │  │
│  │   - Real-time Chat Interface                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS/REST
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Express Backend (Port 3000)                        │  │
│  │   - Node.js + TypeScript                             │  │
│  │   - RESTful API                                      │  │
│  │   - Authentication & Authorization                   │  │
│  │   - Business Logic                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                ↓                              ↓
┌───────────────────────────┐    ┌──────────────────────────┐
│    ML Service Layer       │    │    Database Layer        │
│  ┌─────────────────────┐ │    │  ┌────────────────────┐ │
│  │ Python Flask        │ │    │  │ Supabase           │ │
│  │ (Port 5000)         │ │    │  │ (PostgreSQL)       │ │
│  │                     │ │    │  │                    │ │
│  │ - Google Gemini API │ │    │  │ - User Data        │ │
│  │ - Question Gen      │ │    │  │ - Sessions         │ │
│  │ - Evaluation        │ │    │  │ - Progress         │ │
│  │ - Difficulty Adapt  │ │    │  │ - Analytics        │ │
│  └─────────────────────┘ │    │  └────────────────────┘ │
└───────────────────────────┘    └──────────────────────────┘
```

### Component Interaction Flow
```
User Action → Frontend → Backend API → ML Service/Database
                                    ↓
                            Process & Respond
                                    ↓
Frontend ← Backend ← ML Service/Database
    ↓
Update UI
```

See [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) for detailed diagrams.

---

## Technology Stack

### Frontend Stack
```
React 18.2.0
├── TypeScript 5.x          # Type safety
├── Vite 5.x                # Build tool & dev server
├── TailwindCSS 3.x         # Utility-first CSS
├── Zustand 4.x             # State management
├── React Router 6.x        # Client-side routing
├── Axios 1.x               # HTTP client
└── Supabase Client         # Auth & real-time
```

### Backend Stack
```
Node.js 18+
├── Express 4.x             # Web framework
├── TypeScript 5.x          # Type safety
├── Supabase JS             # Database client
├── Google Generative AI    # Gemini integration
├── Zod                     # Schema validation
├── Winston                 # Logging
└── UUID                    # ID generation
```

### ML Service Stack
```
Python 3.11+
├── Flask 3.x               # Web framework
├── Google Generative AI    # Gemini SDK
├── Flask-CORS              # CORS handling
└── Python-dotenv           # Environment config
```

### Database & Infrastructure
```
Supabase (PostgreSQL 15)
├── PostgreSQL              # Relational database
├── PostgREST               # Auto REST API
├── GoTrue                  # Authentication
└── Realtime                # WebSocket subscriptions

Docker
├── Multi-container setup
├── Service orchestration
└── Development environment
```

---

## AI/ML Implementation

### 1. Google Gemini Integration

**Model Used**: `gemini-2.0-flash-exp` (Primary), `gemini-1.5-flash` (Fallback)

**Implementation Location**: 
- Backend: `backend/src/config/gemini.ts`
- ML Service: `ml-service/app.py`

**Key Features**:
```typescript
// Question Generation
generateWithGemini(prompt, systemInstruction)
  → Socratic question based on topic & difficulty

// Response Evaluation  
generateJSONWithGemini(prompt, systemInstruction)
  → {score, cognitiveLoad, understanding, feedback}
```

### 2. Adaptive Learning System

**No Traditional RL** - Uses rule-based adaptive algorithms:

```
Performance Metrics → Difficulty Adjustment
     ↓
Score + Cognitive Load → New Difficulty Level
     ↓
Generate Next Question at Adjusted Level
```

**Algorithm**: See `backend/src/algorithms/adaptiveDifficulty.ts`

### 3. AI-Powered Features

#### A. Socratic Question Generation
```python
# ML Service: ml-service/app.py
def generate_question(topic, concept, difficulty):
    prompt = f"""Generate Socratic question for {concept}
    Difficulty: {difficulty}/10
    Guidelines: Use Socratic method, guide thinking"""
    
    return gemini.generate_content(prompt)
```

#### B. Response Evaluation
```python
def evaluate_response(question, response, concept):
    prompt = f"""Evaluate response:
    Q: {question}
    A: {response}
    Return JSON: {{score, cognitiveLoad, understanding}}"""
    
    return gemini.generate_content(prompt)
```

#### C. Hint Generation
```typescript
// Progressive hints (3 levels)
generateHints(question, difficulty)
  → ["Gentle nudge", "More specific", "Scaffolding"]
```

See [AI_ML_DETAILS.md](AI_ML_DETAILS.md) for implementation details.

---

*Continued in next section...*

## Algorithms

### 1. Adaptive Difficulty Algorithm

**Purpose**: Dynamically adjust question difficulty based on performance.

**Input**:
- Current difficulty level (1-10)
- User's score on last question (0-100)
- Cognitive load measurement (0-100)

**Output**: New difficulty level (1-10)

**Algorithm**:
```
IF score >= 85 AND cognitiveLoad < 60:
    difficulty = min(10, difficulty + 1)  # Increase
ELSE IF score < 60 OR cognitiveLoad > 85:
    difficulty = max(1, difficulty - 1)   # Decrease
ELSE:
    difficulty = difficulty               # Maintain
```

**Implementation**: `backend/src/algorithms/adaptiveDifficulty.ts`

### 2. Spaced Repetition Algorithm

**Purpose**: Schedule concept reviews for optimal retention.

**Based on**: SM-2 Algorithm (SuperMemo)

**Formula**:
```
intervals = [1, 3, 7, 14, 30, 60, 120] days
adjustedInterval = baseInterval × (0.5 + masteryLevel/100)
nextReview = lastReview + adjustedInterval
```

**Implementation**: `backend/src/algorithms/spacedRepetition.ts`

### 3. Cognitive Load Theory

**Optimal Zone**: 50-75%

**Components**:
- **Intrinsic Load**: Question complexity
- **Extraneous Load**: User struggle
- **Germane Load**: Productive effort

**Calculation**:
```
totalLoad = (intrinsic × 0.4) + (extraneous × 0.4) + (germane × 0.2)
```

**Implementation**: `backend/src/algorithms/cognitiveLoad.ts`

See [ALGORITHMS.md](ALGORITHMS.md) for detailed explanations.

---

## Database Design

### Entity-Relationship Model

**Core Entities**:
1. **Users** - Authentication and profiles
2. **Topics** - Learning subjects
3. **Concepts** - Specific topics within subjects
4. **Sessions** - Learning sessions
5. **Questions** - Generated Socratic questions
6. **Responses** - User answers
7. **Progress** - Mastery tracking

**Key Relationships**:
- User → Sessions (1:N)
- Session → Questions (1:N)
- Question → Responses (1:N)
- Topic → Concepts (1:N)
- User → Progress (1:N per topic/concept)

### Database Schema Highlights

```sql
-- User profile with gamification
user_profiles (
  id, name, level, xp, streak_days
)

-- Learning session tracking
learning_sessions (
  id, user_id, topic_id, status,
  difficulty, questions_completed,
  average_understanding
)

-- AI-generated questions
questions (
  id, session_id, concept_id,
  question_text, difficulty, type
)

-- User responses with evaluation
user_responses (
  id, question_id, user_id,
  response_text, understanding_score,
  cognitive_load, evaluation
)

-- Progress tracking
user_topic_progress (
  user_id, topic_id, mastery_level,
  time_spent, last_practiced
)
```

See [DATABASE_ER_DIAGRAM.md](DATABASE_ER_DIAGRAM.md) for complete schema.

---

## Technical Implementation

### Backend Architecture

**Pattern**: Service-Oriented Architecture

**Layers**:
1. **Controllers** - HTTP request handling
2. **Services** - Business logic
3. **Repositories** - Data access (Supabase)
4. **Middleware** - Auth, logging, error handling

**Example Flow**:
```
HTTP Request → Controller → Service → Database
                                    ↓
                              ML Service (Gemini)
                                    ↓
HTTP Response ← Controller ← Service ← Result
```

### Frontend Architecture

**Pattern**: Component-Based Architecture

**Structure**:
```
src/
├── components/     # Reusable UI components
├── pages/          # Route pages
├── store/          # Zustand state management
├── lib/            # Utilities (API client, etc.)
└── styles/         # Global styles
```

**State Management**: Zustand (lightweight alternative to Redux)

**Routing**: React Router v6

**Styling**: TailwindCSS (utility-first)

### ML Service Architecture

**Framework**: Flask (Python)

**Purpose**: 
- Isolate AI/ML operations
- Independent scaling
- Language-specific optimizations

**Endpoints**:
- `/api/v1/generate-question` - Question generation
- `/api/v1/evaluate-response` - Response evaluation
- `/api/v1/adapt-difficulty` - Difficulty adjustment

See [IMPLEMENTATION_DETAILS.md](IMPLEMENTATION_DETAILS.md) for code examples.

---

## Key Features Implementation

### 1. Socratic Questioning

**Method**: AI-powered question generation using Gemini

**Process**:
1. Analyze topic and concept
2. Determine appropriate difficulty
3. Generate question that guides thinking
4. Avoid direct answers
5. Encourage self-discovery

### 2. Real-time Evaluation

**Method**: AI-powered response analysis

**Metrics**:
- Understanding score (0-100)
- Cognitive load (0-100)
- Strengths identified
- Areas for improvement
- Follow-up questions

### 3. Adaptive Learning Path

**Method**: Rule-based difficulty adjustment

**Factors**:
- Performance on questions
- Cognitive load levels
- Historical progress
- Topic mastery

### 4. Progress Tracking

**Metrics**:
- Overall mastery percentage
- Topic-specific progress
- Concept-level mastery
- Learning velocity
- Retention rates
- Streak tracking

### 5. Gamification

**Elements**:
- XP (Experience Points)
- Levels (1-100)
- Streaks (daily practice)
- Achievements (future)
- Leaderboards (future)

---

## Performance Characteristics

### Response Times

- **Question Generation**: 2-5 seconds (Gemini API)
- **Response Evaluation**: 2-4 seconds (Gemini API)
- **Database Queries**: <100ms (indexed)
- **Page Load**: <1 second (Vite optimization)

### Scalability

**Current Capacity**:
- Concurrent users: 100+ (single instance)
- Questions/day: 10,000+ (Gemini quota dependent)
- Database: Unlimited (Supabase managed)

**Scaling Strategy**:
- Horizontal scaling (multiple backend instances)
- Load balancing (Nginx/AWS ALB)
- Database read replicas
- Redis caching layer
- CDN for static assets

---

## Security Measures

1. **Authentication**: Supabase Auth (JWT tokens)
2. **Authorization**: Row-level security (RLS)
3. **Input Validation**: Zod schemas
4. **SQL Injection**: Parameterized queries
5. **XSS Prevention**: Content sanitization
6. **CORS**: Configured origins
7. **Rate Limiting**: Express middleware
8. **HTTPS**: TLS encryption

---

## Monitoring & Logging

### Logging Strategy

**Backend**: Winston logger
```typescript
logger.info('Session created', { userId, sessionId });
logger.error('Question generation failed', { error });
```

**Levels**: error, warn, info, debug

**Storage**: 
- Development: Console + file
- Production: CloudWatch/Datadog

### Analytics Events

```typescript
analytics.track('session_completed', {
  userId,
  sessionId,
  duration,
  questionsCompleted,
  averageScore
});
```

---

## Future Enhancements

### 1. Reinforcement Learning

Replace rule-based adaptation with learned policy:
```
State: [mastery, difficulty, cognitive_load, history]
Action: [increase, decrease, maintain, review]
Reward: learning_efficiency
Policy: Learned via PPO/DQN
```

### 2. Multi-modal Learning

- Voice input/output
- Image-based questions
- Video explanations
- Interactive simulations

### 3. Collaborative Learning

- Peer discussions
- Group sessions
- Shared progress
- Social features

### 4. Advanced Analytics

- Learning style detection
- Predictive modeling
- Personalized recommendations
- A/B testing framework

---

## Documentation Index

- **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** - Visual architecture
- **[AI_ML_DETAILS.md](AI_ML_DETAILS.md)** - AI/ML implementation
- **[DATABASE_ER_DIAGRAM.md](DATABASE_ER_DIAGRAM.md)** - Database design
- **[IMPLEMENTATION_DETAILS.md](IMPLEMENTATION_DETAILS.md)** - Code details
- **[ALGORITHMS.md](ALGORITHMS.md)** - Algorithm explanations
- **[API_DESIGN.md](API_DESIGN.md)** - API documentation
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide

---

## Quick Reference

### Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + TypeScript | UI/UX |
| Backend | Node.js + Express | API Server |
| ML Service | Python + Flask | AI Operations |
| Database | PostgreSQL (Supabase) | Data Storage |
| AI | Google Gemini | Question Gen & Eval |
| Auth | Supabase Auth | User Management |
| Styling | TailwindCSS | UI Design |
| State | Zustand | State Management |

### Key Algorithms

1. **Adaptive Difficulty** - Rule-based performance adjustment
2. **Spaced Repetition** - SM-2 inspired review scheduling
3. **Cognitive Load** - Multi-factor load assessment
4. **Socratic Method** - AI-powered guided questioning

### Architecture Patterns

- **Backend**: Service-Oriented Architecture
- **Frontend**: Component-Based Architecture
- **Database**: Relational (PostgreSQL)
- **API**: RESTful
- **Auth**: JWT-based

---

**For detailed technical information, see the linked documentation files above.**
