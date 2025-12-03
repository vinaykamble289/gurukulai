# Architecture Diagrams

## Visual System Architecture

### 1. Complete System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  Dashboard   │  │   Session    │  │   Progress   │            │
│  │   Page       │  │  Chat Page   │  │    Page      │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│         React Frontend (TypeScript + Vite + TailwindCSS)           │
└────────────────────────────────────────────────────────────────────┘
                              ↓ ↑
                         REST API (HTTPS)
                              ↓ ↑
┌────────────────────────────────────────────────────────────────────┐
│                      BACKEND API SERVER                             │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    Express.js Server                          │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │ │
│  │  │   Auth     │  │  Session   │  │  Progress  │            │ │
│  │  │ Controller │  │ Controller │  │ Controller │            │ │
│  │  └────────────┘  └────────────┘  └────────────┘            │ │
│  │         ↓                ↓                ↓                  │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │ │
│  │  │   Auth     │  │  Session   │  │  Progress  │            │ │
│  │  │  Service   │  │  Service   │  │  Service   │            │ │
│  │  └────────────┘  └────────────┘  └────────────┘            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    Adaptive Algorithms                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │ │
│  │  │  Difficulty  │  │  Cognitive   │  │   Spaced     │      │ │
│  │  │  Adaptation  │  │     Load     │  │  Repetition  │      │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
         ↓ ↑                                          ↓ ↑
    HTTP Requests                               PostgreSQL
         ↓ ↑                                          ↓ ↑
┌─────────────────────┐                    ┌──────────────────────┐
│   ML SERVICE        │                    │   SUPABASE           │
│  ┌───────────────┐  │                    │  ┌────────────────┐ │
│  │ Flask Server  │  │                    │  │  PostgreSQL    │ │
│  │               │  │                    │  │   Database     │ │
│  │ - Question    │  │                    │  │                │ │
│  │   Generation  │  │                    │  │ - Users        │ │
│  │ - Evaluation  │  │                    │  │ - Sessions     │ │
│  │ - Hints       │  │                    │  │ - Questions    │ │
│  └───────────────┘  │                    │  │ - Progress     │ │
│         ↓           │                    │  │ - Analytics    │ │
│  ┌───────────────┐  │                    │  └────────────────┘ │
│  │ Google Gemini │  │                    │                      │
│  │      API      │  │                    │  ┌────────────────┐ │
│  └───────────────┘  │                    │  │  Auth (GoTrue) │ │
└─────────────────────┘                    │  └────────────────┘ │
                                           └──────────────────────┘
```

### 2. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION FLOW                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Action (e.g., "Start Learning")                         │
│    Frontend: Dashboard.tsx                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. API Request                                                   │
│    POST /api/v1/sessions/start                                  │
│    Headers: { Authorization: Bearer <token> }                   │
│    Body: { topicId: "uuid" }                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Backend Processing                                            │
│    SessionController.startSession()                              │
│         ↓                                                        │
│    SessionService.createSession()                                │
│         ↓                                                        │
│    - Verify user profile exists                                 │
│    - Get user preferences                                       │
│    - Calculate initial difficulty                               │
│    - Create session record                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Question Generation                                           │
│    QuestionService.generateQuestion()                            │
│         ↓                                                        │
│    Gemini API Call:                                             │
│    - Topic: "Mathematics"                                       │
│    - Concept: "Algebra"                                         │
│    - Difficulty: 5/10                                           │
│         ↓                                                        │
│    Generated: "What is the relationship between..."             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Database Storage                                              │
│    Supabase:                                                     │
│    - Insert session record                                      │
│    - Insert question record                                     │
│    - Update user streak                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Response to Frontend                                          │
│    {                                                             │
│      session: { id, topicId, difficulty, ... },                │
│      currentQuestion: { id, text, type, ... }                   │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. UI Update                                                     │
│    - Navigate to /session/:id                                   │
│    - Display question in chat interface                         │
│    - Enable input for user response                             │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Learning Session Flow

```
START SESSION
     ↓
┌─────────────────────────────────────────┐
│  Generate Initial Question              │
│  (Based on topic & user level)          │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  Display Question in Chat               │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  User Types Response                    │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  Submit to Backend                      │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  Evaluate with Gemini AI                │
│  - Understanding score (0-100)          │
│  - Cognitive load (0-100)               │
│  - Strengths & improvements             │
│  - Follow-up question                   │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  Adapt Difficulty                       │
│  IF score >= 85 AND load < 60:          │
│    difficulty += 1                      │
│  ELSE IF score < 60 OR load > 85:       │
│    difficulty -= 1                      │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  Generate Next Question                 │
│  (At adjusted difficulty)               │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  Display Evaluation + Next Question     │
└─────────────────────────────────────────┘
     ↓
     Loop until session complete
     ↓
┌─────────────────────────────────────────┐
│  Calculate Session Stats                │
│  - Questions completed                  │
│  - Average understanding                │
│  - Time spent                           │
│  - XP earned                            │
└─────────────────────────────────────────┘
     ↓
END SESSION
```

*Continued in AI_ML_DETAILS.md...*
