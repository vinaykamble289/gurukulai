# Socratic Learning Platform - Complete Technical Documentation

**Version**: 1.0  
**Last Updated**: December 2024  
**Author**: Development Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [AI/ML Implementation](#aiml-implementation)
5. [Algorithms](#algorithms)
6. [Database Design](#database-design)
7. [Implementation Details](#implementation-details)
8. [API Documentation](#api-documentation)
9. [Security & Performance](#security--performance)
10. [Deployment](#deployment)
11. [Testing](#testing)
12. [Future Enhancements](#future-enhancements)

---

# 1. Executive Summary

## Project Overview

The Socratic Learning Platform is an AI-powered adaptive learning system that uses the Socratic method to guide learners through personalized educational journeys. The platform leverages Google's Gemini AI to generate thought-provoking questions and evaluate responses in real-time.

## Key Features

- **AI-Powered Socratic Questioning**: Generates questions that guide thinking rather than provide answers
- **Adaptive Difficulty**: Dynamically adjusts question difficulty based on performance
- **Real-time Evaluation**: Instant feedback on responses with detailed analysis
- **Progress Tracking**: Comprehensive analytics on learning progress and mastery
- **Spaced Repetition**: Optimized review scheduling for long-term retention
- **Cognitive Load Monitoring**: Ensures optimal learning challenge level
- **Gamification**: XP, levels, and streaks to maintain engagement

## Technology Highlights

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **ML Service**: Python + Flask + Google Gemini
- **Database**: PostgreSQL (Supabase)
- **AI**: Google Gemini 2.0 Flash

## Architecture Pattern

Service-Oriented Architecture with microservices for ML operations, RESTful API design, and component-based frontend.

---

# 2. System Architecture

## 2.1 High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              React Frontend (Port 5173)                       │  │
│  │  - TypeScript + Vite + TailwindCSS                           │  │
│  │  - Zustand State Management                                  │  │
│  │  - React Router v6                                           │  │
│  │  - Real-time Chat Interface                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                              ↓ ↑
                         REST API (HTTPS)
                              ↓ ↑
┌────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           Express Backend API (Port 3000)                     │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  Controllers (HTTP Layer)                              │  │  │
│  │  │  - Auth, Session, Progress, Question, Topic           │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  Services (Business Logic)                             │  │  │
│  │  │  - User, Session, Question, Progress Management       │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  Algorithms                                            │  │  │
│  │  │  - Adaptive Difficulty                                 │  │  │
│  │  │  - Spaced Repetition                                   │  │  │
│  │  │  - Cognitive Load Assessment                           │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
         ↓ ↑                                          ↓ ↑
    HTTP Requests                               PostgreSQL
         ↓ ↑                                          ↓ ↑
┌─────────────────────┐                    ┌──────────────────────┐
│   ML SERVICE        │                    │   SUPABASE           │
│  ┌───────────────┐  │                    │  ┌────────────────┐ │
│  │ Flask Server  │  │                    │  │  PostgreSQL    │ │
│  │ (Port 5000)   │  │                    │  │   Database     │ │
│  │               │  │                    │  │                │ │
│  │ - Question    │  │                    │  │ - Users        │ │
│  │   Generation  │  │                    │  │ - Sessions     │ │
│  │ - Evaluation  │  │                    │  │ - Questions    │ │
│  │ - Hints       │  │                    │  │ - Progress     │ │
│  └───────────────┘  │                    │  │ - Analytics    │ │
│         ↓           │                    │  └────────────────┘ │
│  ┌───────────────┐  │                    │                      │
│  │ Google Gemini │  │                    │  ┌────────────────┐ │
│  │      API      │  │                    │  │  Auth (GoTrue) │ │
│  └───────────────┘  │                    │  └────────────────┘ │
└─────────────────────┘                    └──────────────────────┘
```

## 2.2 Component Interaction Flow

```
User Action (Frontend)
       ↓
API Request (axios)
       ↓
Backend Controller
       ↓
Service Layer (Business Logic)
       ↓
┌──────────────┬──────────────┐
│              │              │
↓              ↓              ↓
Database    ML Service    External APIs
(Supabase)  (Gemini)     (if needed)
       ↓              ↓              ↓
       └──────────────┴──────────────┘
                      ↓
              Process & Combine
                      ↓
              Return Response
                      ↓
              Update Frontend UI
```

## 2.3 Data Flow - Learning Session

```
1. User clicks "Start Learning"
       ↓
2. POST /api/v1/sessions/start
   Body: { topicId: "uuid" }
       ↓
3. Backend: SessionService.createSession()
   - Verify user profile
   - Get preferences
   - Calculate initial difficulty
   - Create session record
       ↓
4. QuestionService.generateQuestion()
   - Get topic & concept
   - Build prompt
   - Call Gemini API
   - Store question
       ↓
5. Return to Frontend
   { session: {...}, currentQuestion: {...} }
       ↓
6. Navigate to /session/:id
   Display question in chat interface
       ↓
7. User types response
       ↓
8. POST /api/v1/sessions/:id/submit
   Body: { questionId, response }
       ↓
9. Evaluate with Gemini
   - Understanding score
   - Cognitive load
   - Strengths & improvements
       ↓
10. Adapt difficulty
    IF score >= 85 AND load < 60: +1
    ELSE IF score < 60 OR load > 85: -1
       ↓
11. Generate next question
    (at adjusted difficulty)
       ↓
12. Return evaluation + next question
       ↓
13. Display in chat
       ↓
Loop until session complete
```

---

# 3. Technology Stack

## 3.1 Frontend Stack

### Core Technologies
```
React 18.2.0
├── TypeScript 5.x          # Type safety & developer experience
├── Vite 5.x                # Fast build tool & dev server
├── TailwindCSS 3.x         # Utility-first CSS framework
├── Zustand 4.x             # Lightweight state management
├── React Router 6.x        # Client-side routing
├── Axios 1.x               # HTTP client
└── Supabase Client         # Auth & real-time subscriptions
```

### UI Components
- Custom component library (Button, Card, Input, etc.)
- Responsive design (mobile-first)
- Dark theme with gradient accents
- Smooth animations and transitions

### State Management
```typescript
// Zustand store example
interface AuthState {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  login: async (email, password) => { /* ... */ },
  logout: async () => { /* ... */ }
}));
```

## 3.2 Backend Stack

### Core Technologies
```
Node.js 18+
├── Express 4.x             # Web framework
├── TypeScript 5.x          # Type safety
├── Supabase JS             # Database client
├── Google Generative AI    # Gemini SDK
├── Zod                     # Schema validation
├── Winston                 # Logging
├── UUID                    # ID generation
└── CORS                    # Cross-origin requests
```

### Architecture Pattern
```
Controllers (HTTP Layer)
    ↓
Services (Business Logic)
    ↓
Repositories (Data Access)
```

### Middleware Stack
1. CORS configuration
2. JSON body parser
3. Request logger
4. Authentication
5. Route handlers
6. Error handler

## 3.3 ML Service Stack

### Core Technologies
```
Python 3.11+
├── Flask 3.x               # Web framework
├── Google Generative AI    # Gemini SDK
├── Flask-CORS              # CORS handling
└── Python-dotenv           # Environment config
```

### Purpose
- Isolate AI/ML operations
- Independent scaling
- Language-specific optimizations
- Gemini API integration

## 3.4 Database & Infrastructure

### Supabase (PostgreSQL 15)
```
Supabase Platform
├── PostgreSQL 15           # Relational database
├── PostgREST               # Auto-generated REST API
├── GoTrue                  # Authentication service
├── Realtime                # WebSocket subscriptions
└── Storage                 # File storage (future)
```

### Database Features
- Row-level security (RLS)
- Real-time subscriptions
- Automatic API generation
- Built-in authentication
- Database triggers & functions

### Docker Setup
```yaml
services:
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
  
  backend:
    build: ./backend
    ports: ["3000:3000"]
    depends_on: [ml-service]
  
  ml-service:
    build: ./ml-service
    ports: ["5000:5000"]
```

---

# 4. AI/ML Implementation

## 4.1 Google Gemini Integration

### Models Used

**Primary Model**: `gemini-2.0-flash-exp`
- Fast response time (2-5 seconds)
- High quality outputs
- Cost-effective
- Latest features

**Fallback Model**: `gemini-1.5-flash`
- Reliability backup
- Automatic failover
- Proven stability

### Backend Integration

```typescript
// backend/src/config/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function generateWithGemini(
  prompt: string,
  systemInstruction?: string,
  useFallback = false
): Promise<string> {
  const modelName = useFallback 
    ? 'gemini-1.5-flash' 
    : 'gemini-2.0-flash-exp';
  
  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      ...(systemInstruction && { systemInstruction })
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    if (!useFallback) {
      // Retry with fallback model
      return generateWithGemini(prompt, systemInstruction, true);
    }
    throw error;
  }
}

export async function generateJSONWithGemini<T>(
  prompt: string,
  systemInstruction?: string
): Promise<T> {
  const text = await generateWithGemini(prompt, systemInstruction);
  
  // Extract JSON from markdown code blocks
  let jsonText = text.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
  }
  
  return JSON.parse(jsonText);
}
```

### ML Service Integration

```python
# ml-service/app.py
import google.generativeai as genai
import os

genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

def generate_with_gemini(prompt, system_instruction=None, use_fallback=False):
    model_name = 'gemini-1.5-flash' if use_fallback else 'gemini-2.0-flash-exp'
    
    try:
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_instruction
        )
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        if not use_fallback:
            return generate_with_gemini(prompt, system_instruction, True)
        raise e
```

## 4.2 Socratic Question Generation

### Algorithm Flow

```
Input: Topic, Concept, Difficulty (1-10)
       ↓
1. Get topic and concept details from database
       ↓
2. Determine difficulty description
       ↓
3. Build prompt with guidelines
       ↓
4. Set system instruction (educator role)
       ↓
5. Call Gemini API
       ↓
6. Receive generated question
       ↓
7. Store in database
       ↓
8. Generate 3 progressive hints
       ↓
Output: Question object with hints
```

### Prompt Engineering

```typescript
const difficultyDescriptions = {
  1: 'very basic, introductory level',
  2: 'basic with simple examples',
  3: 'fundamental understanding',
  4: 'intermediate with some complexity',
  5: 'intermediate requiring deeper thought',
  6: 'moderately challenging',
  7: 'challenging requiring analysis',
  8: 'advanced requiring synthesis',
  9: 'very advanced requiring evaluation',
  10: 'expert level requiring creation'
};

const prompt = `Generate a Socratic question for learning about "${concept}" 
in the topic of "${topicName}".

Difficulty level: ${difficulty}/10 (${difficultyDescriptions[difficulty]})

Guidelines:
- Use the Socratic method: ask questions that guide thinking
- Encourage critical thinking and self-discovery
- Build on prior knowledge
- Be clear and focused
- Appropriate for difficulty level ${difficulty}
${context?.previousResponse ? `\nPrevious response: "${context.previousResponse}"` : ''}

Generate only the question text, no additional explanation.`;

const systemInstruction = `You are an expert educator using the Socratic 
method to help learners discover knowledge through guided questioning. 
Generate clear, thought-provoking questions that encourage critical thinking.`;
```

### Implementation

```typescript
// backend/src/services/question.service.ts
async generateQuestion(
  userId: string,
  topicId: string,
  difficulty: number,
  context?: any
): Promise<Question> {
  // 1. Get topic and concepts
  const topic = await this.getTopic(topicId);
  const concept = this.selectConcept(topic.concepts, difficulty);
  
  // 2. Build prompt
  const prompt = this.buildQuestionPrompt(topic, concept, difficulty, context);
  const systemInstruction = 'You are an expert educator...';
  
  // 3. Generate with Gemini
  const questionText = await generateWithGemini(prompt, systemInstruction);
  
  // 4. Store in database
  const question = await supabase
    .from('questions')
    .insert({
      session_id: context?.sessionId,
      concept_id: concept.id,
      question_text: questionText,
      question_type: this.determineType(difficulty),
      difficulty,
      context
    })
    .select()
    .single();
  
  // 5. Generate hints
  await this.generateHints(question.id, questionText, difficulty);
  
  return {
    id: question.id,
    text: question.question_text,
    type: question.question_type,
    difficulty: question.difficulty
  };
}
```

## 4.3 Response Evaluation

### Evaluation Metrics

```typescript
interface Evaluation {
  score: number;              // 0-100: Understanding score
  cognitiveLoad: number;      // 0-100: Mental effort required
  understanding: 'low' | 'medium' | 'high';
  strengths: string[];        // What the learner did well
  improvements: string[];     // Areas to explore further
  followUpQuestion: string;   // Deepen understanding
}
```

### Evaluation Prompt

```typescript
const prompt = `Evaluate this learner's response to a Socratic question 
about "${concept}".

Question: "${question}"
Learner's Response: "${response}"
Difficulty Level: ${difficulty}/10

Evaluate the response and provide:
1. Understanding score (0-100)
   - 0-40: Minimal understanding
   - 41-60: Basic understanding
   - 61-80: Good understanding
   - 81-100: Excellent understanding

2. Cognitive load estimate (0-100, where 50-75 is optimal)
   - Consider response complexity
   - Assess struggle indicators
   - Evaluate clarity of thought

3. Understanding level: "low", "medium", or "high"

4. Key strengths (2-3 specific points)

5. Areas for improvement (1-2 specific suggestions)

6. A follow-up Socratic question to deepen understanding

Format as JSON:
{
  "score": number,
  "cognitiveLoad": number,
  "understanding": "low" | "medium" | "high",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "followUpQuestion": "question text"
}`;

const systemInstruction = `You are an expert educator evaluating learner 
responses using evidence-based assessment methods. Be constructive and 
encouraging while providing accurate evaluation. Return only valid JSON.`;
```

### Implementation

```typescript
async evaluateResponse(
  questionId: string,
  response: string,
  userId: string
): Promise<Evaluation> {
  // 1. Get question details
  const question = await this.getQuestion(questionId);
  
  // 2. Build evaluation prompt
  const prompt = this.buildEvaluationPrompt(
    question.question_text,
    response,
    question.concepts?.name,
    question.difficulty
  );
  
  // 3. Evaluate with Gemini (JSON mode)
  const evaluation = await generateJSONWithGemini<Evaluation>(
    prompt,
    'You are an expert educator...'
  );
  
  // 4. Store response and evaluation
  await supabase.from('user_responses').insert({
    question_id: questionId,
    user_id: userId,
    response_text: response,
    understanding_score: evaluation.score,
    cognitive_load: evaluation.cognitiveLoad,
    evaluation: evaluation
  });
  
  return evaluation;
}
```

## 4.4 Why Not Traditional Reinforcement Learning?

### Current Approach: Rule-Based Adaptation

**Advantages**:
- ✅ Predictable and transparent behavior
- ✅ Easy to debug and tune
- ✅ No training data required
- ✅ Immediate deployment
- ✅ Explainable decisions

**Implementation**:
```typescript
function adaptDifficulty(
  currentDifficulty: number,
  score: number,
  cognitiveLoad: number
): number {
  if (score >= 85 && cognitiveLoad < 60) {
    return Math.min(10, currentDifficulty + 1);
  }
  if (score < 60 || cognitiveLoad > 85) {
    return Math.max(1, currentDifficulty - 1);
  }
  return currentDifficulty;
}
```

### Future: Reinforcement Learning

**Potential Implementation**:

```python
# State representation
state = [
    user_mastery,           # 0-100
    current_difficulty,     # 1-10
    cognitive_load,         # 0-100
    recent_scores,          # last 5 scores
    topic_complexity,       # 1-10
    time_on_task           # seconds
]

# Action space
actions = [
    'increase_difficulty',
    'decrease_difficulty',
    'maintain_difficulty',
    'suggest_review',
    'change_topic'
]

# Reward function
reward = (mastery_gain * engagement_score) / time_spent

# Policy learning (PPO/DQN)
policy = learn_policy(states, actions, rewards)
```

**Why Not Yet**:
1. Requires large dataset of learning sessions
2. Need to carefully define reward function
3. Risk of suboptimal exploration phase
4. Current rule-based system works well
5. Can implement later with collected data

---


# 5. Algorithms

## 5.1 Adaptive Difficulty Algorithm

### Purpose
Dynamically adjust question difficulty based on learner performance to maintain optimal challenge level.

### Input Parameters
- `currentDifficulty`: Current difficulty level (1-10)
- `score`: Understanding score from last question (0-100)
- `cognitiveLoad`: Mental effort measurement (0-100)

### Output
- `newDifficulty`: Adjusted difficulty level (1-10)

### Algorithm Logic

```typescript
// backend/src/algorithms/adaptiveDifficulty.ts

export function adaptDifficulty(
  currentDifficulty: number,
  performanceMetrics: {
    score: number;
    cognitiveLoad: number;
    responseTime?: number;
  }
): number {
  const { score, cognitiveLoad } = performanceMetrics;
  
  // Increase difficulty: High performance + Low cognitive load
  if (score >= 85 && cognitiveLoad < 60) {
    return Math.min(10, currentDifficulty + 1);
  }
  
  // Decrease difficulty: Low performance OR High cognitive load
  if (score < 60 || cognitiveLoad > 85) {
    return Math.max(1, currentDifficulty - 1);
  }
  
  /
/ Maintain difficulty: Optimal zone
  return currentDifficulty;
}
```

### Decision Matrix

```
┌─────────────────────────────────────────────────────────────┐
│              Adaptive Difficulty Decision Matrix             │
├──────────────────┬──────────────────┬───────────────────────┤
│  Performance     │  Cognitive Load  │  Action               │
├──────────────────┼──────────────────┼───────────────────────┤
│  Score >= 85     │  Load < 60       │  Increase (+1)        │
│  Score 60-84     │  Load 60-85      │  Maintain (same)      │
│  Score < 60      │  Any             │  Decrease (-1)        │
│  Any             │  Load > 85       │  Decrease (-1)        │
└──────────────────┴──────────────────┴───────────────────────┘
```

### Flow Diagram

```
Current Performance
        ↓
┌───────┴───────┐
│ Evaluate      │
│ Score + Load  │
└───────┬───────┘
        ↓
    ┌───┴───┐
    │ Score │
    │ >= 85?│
    └───┬───┘
    Yes │ No
        ↓   ↓
    ┌───┴───┐
    │ Load  │
    │ < 60? │
    └───┬───┘
    Yes │ No
        ↓   ↓
    Increase  Maintain/Decrease
```

## 5.2 Spaced Repetition Algorithm

### Purpose
Schedule concept reviews at optimal intervals for long-term retention based on SM-2 algorithm.

### Input Parameters
- `mastery`: Current mastery level (0-100)
- `reviewCount`: Number of times reviewed
- `lastReviewed`: Date of last review

### Output
- `nextReview`: Date for next review

### Algorithm Implementation

```typescript
// backend/src/algorithms/spacedRepetition.ts

export function calculateNextReview(
  conceptProgress: {
    mastery: number;
    reviewCount: number;
    lastReviewed: Date;
  }
): Date {
  const { mastery, reviewCount, lastReviewed } = conceptProgress;
  
  // Base intervals (in days) - SM-2 inspired
  const intervals = [1, 3, 7, 14, 30, 60, 120];
  
  // Get base interval for review count
  const intervalIndex = Math.min(reviewCount, intervals.length - 1);
  const baseInterval = intervals[intervalIndex];
  
  // Adjust by mastery level (0-100%)
  const masteryFactor = mastery / 100;
  const adjustedInterval = baseInterval * (0.5 + masteryFactor);
  
  // Calculate next review date
  const nextReview = new Date(lastReviewed);
  nextReview.setDate(nextReview.getDate() + Math.round(adjustedInterval));
  
  return nextReview;
}

export function shouldReview(
  conceptProgress: {
    nextReview: Date;
    mastery: number;
  }
): boolean {
  const now = new Date();
  
  // Review if due date passed
  if (conceptProgress.nextReview <= now) {
    return true;
  }
  
  // Early review if mastery is low
  if (conceptProgress.mastery < 50) {
    const daysSinceReview = Math.floor(
      (now.getTime() - conceptProgress.nextReview.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceReview >= -2; // Allow 2 days early
  }
  
  return false;
}
```

### Review Schedule

```
Review #  │  Base Interval  │  Mastery 50%  │  Mastery 100%
──────────┼─────────────────┼───────────────┼──────────────
    1     │     1 day       │    0.5 days   │    1.5 days
    2     │     3 days      │    1.5 days   │    4.5 days
    3     │     7 days      │    3.5 days   │   10.5 days
    4     │    14 days      │    7 days     │   21 days
    5     │    30 days      │   15 days     │   45 days
    6     │    60 days      │   30 days     │   90 days
    7+    │   120 days      │   60 days     │  180 days
```

## 5.3 Cognitive Load Assessment

### Purpose
Measure mental effort required for learning to maintain optimal challenge level.

### Cognitive Load Theory

**Three Types of Load**:
1. **Intrinsic Load**: Inherent difficulty of the material
2. **Extraneous Load**: Unnecessary mental effort (confusion, poor design)
3. **Germane Load**: Productive effort (schema construction)

**Optimal Zone**: 50-75% total cognitive load

### Algorithm Implementation

```typescript
// backend/src/algorithms/cognitiveLoad.ts

export function assessCognitiveLoad(
  question: {
    difficulty: number;
    complexity: number;
  },
  response: {
    score: number;
    timeSpent: number;
  },
  userState: {
    previousLoad: number;
    mastery: number;
  }
): number {
  // 1. Intrinsic Load (question complexity)
  const intrinsicLoad = question.difficulty * 10;
  
  // 2. Extraneous Load (user struggle)
  const performanceGap = 100 - response.score;
  const extraneousLoad = performanceGap * 0.5;
  
  // 3. Germane Load (productive effort)
  const germaneLoad = response.score * 0.3;
  
  // 4. Time factor (longer time = higher load)
  const timeFactor = Math.min(response.timeSpent / 60, 20); // Cap at 20
  
  // 5. Combined load
  const currentLoad = (
    intrinsicLoad * 0.4 +
    extraneousLoad * 0.4 +
    germaneLoad * 0.2 +
    timeFactor * 0.1
  );
  
  // 6. Smooth with previous load (moving average)
  const smoothedLoad = (currentLoad * 0.7) + (userState.previousLoad * 0.3);
  
  return Math.min(100, Math.max(0, smoothedLoad));
}

export function getCognitiveZone(load: number): string {
  if (load < 40) return 'too_easy';
  if (load < 50) return 'easy';
  if (load <= 75) return 'optimal';
  if (load <= 85) return 'challenging';
  return 'overwhelming';
}
```

### Cognitive Load Zones

```
┌─────────────────────────────────────────────────────────┐
│              Cognitive Load Zones                        │
├──────────────┬──────────────────────────────────────────┤
│   0-40%      │  Too Easy (Boredom Risk)                 │
│  40-50%      │  Easy (Comfortable Learning)             │
│  50-75%      │  Optimal (Flow State) ✓                  │
│  75-85%      │  Challenging (Productive Struggle)       │
│  85-100%     │  Overwhelming (Frustration Risk)         │
└──────────────┴──────────────────────────────────────────┘
```

---

# 6. Database Design

## 6.1 Complete ER Diagram

```
┌──────────────────┐
│   auth.users     │ (Supabase Auth)
├──────────────────┤
│ id (PK)          │
│ email            │
│ encrypted_pwd    │
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
│ created_at       │                       │
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
│ learning_modal   │                       │
│ notifications    │                       │
└──────────────────┘                       │
                                           │
         ┌─────────────────────────────────┤
         │                                 │
         │ 1:N                             │ 1:N
         ↓                                 ↓
┌──────────────────┐              ┌──────────────────┐
│learning_sessions │              │user_topic_prog   │
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
│ cognitive_load   │  │                                 │
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
│ created_at       │  │       │            │
└──────────────────┘  │       │            │ 1:N
         │            │       │            ↓
         │ 1:N        │       │   ┌──────────────────┐
         ↓            │       │   │    concepts      │
┌──────────────────┐  │       │   ├──────────────────┤
│ user_responses   │  │       └──→│ id (PK)          │
├──────────────────┤  │           │ topic_id (FK)    │
│ id (PK)          │  │           │ name             │
│ question_id (FK) │  │           │ description      │
│ user_id (FK)     │──┘           │ difficulty       │
│ response_text    │              │ prerequisites    │
│ understanding    │              └──────────────────┘
│ cognitive_load   │                       │
│ evaluation       │                       │ 1:N
│ response_time    │                       ↓
│ created_at       │              ┌──────────────────┐
└──────────────────┘              │user_concept_prog │
         │                        ├──────────────────┤
         │ 1:N                    │ id (PK)          │
         ↓                        │ user_id (FK)     │
┌──────────────────┐              │ concept_id (FK)  │
│      hints       │              │ mastery_level    │
├──────────────────┤              │ retention        │
│ id (PK)          │              │ last_reviewed    │
│ question_id (FK) │              │ next_review      │
│ level (1-3)      │              │ review_count     │
│ hint_text        │              └──────────────────┘
│ created_at       │
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

## 6.2 Table Schemas

### Core User Tables

#### user_profiles
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 100),
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  streak_days INTEGER DEFAULT 0 CHECK (streak_days >= 0),
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_level ON user_profiles(level);
CREATE INDEX idx_user_profiles_xp ON user_profiles(xp);
```

#### user_preferences
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_duration INTEGER DEFAULT 15 CHECK (session_duration > 0),
  difficulty_preference TEXT DEFAULT 'adaptive' 
    CHECK (difficulty_preference IN ('easy', 'medium', 'hard', 'adaptive')),
  learning_modality TEXT DEFAULT 'visual'
    CHECK (learning_modality IN ('visual', 'auditory', 'kinesthetic', 'mixed')),
  notifications_enabled BOOLEAN DEFAULT true,
  daily_reminders BOOLEAN DEFAULT true,
  review_notifications BOOLEAN DEFAULT true,
  achievement_alerts BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Content Tables

#### topics
```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  difficulty_range INTEGER[] DEFAULT '{1,10}',
  parent_topic_id UUID REFERENCES topics(id),
  prerequisites UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_topics_subject ON topics(subject);
CREATE INDEX idx_topics_name ON topics(name);
```

#### concepts
```sql
CREATE TABLE concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 10),
  prerequisites UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_concepts_topic_id ON concepts(topic_id);
CREATE INDEX idx_concepts_difficulty ON concepts(difficulty);
```

### Session Tables

#### learning_sessions
```sql
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  initial_difficulty INTEGER CHECK (initial_difficulty >= 1 AND initial_difficulty <= 10),
  current_difficulty INTEGER CHECK (current_difficulty >= 1 AND current_difficulty <= 10),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER CHECK (duration_seconds >= 0),
  questions_completed INTEGER DEFAULT 0 CHECK (questions_completed >= 0),
  average_understanding DECIMAL(5,2) CHECK (average_understanding >= 0 AND average_understanding <= 100),
  cognitive_load_avg DECIMAL(5,2) CHECK (cognitive_load_avg >= 0 AND cognitive_load_avg <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX idx_sessions_status ON learning_sessions(status);
CREATE INDEX idx_sessions_started_at ON learning_sessions(started_at DESC);
```

#### questions
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES concepts(id),
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('guided', 'scaffolded', 'open-ended')),
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 10),
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_session_id ON questions(session_id);
CREATE INDEX idx_questions_concept_id ON questions(concept_id);
```

### Response & Progress Tables

#### user_responses
```sql
CREATE TABLE user_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  understanding_score INTEGER CHECK (understanding_score >= 0 AND understanding_score <= 100),
  cognitive_load INTEGER CHECK (cognitive_load >= 0 AND cognitive_load <= 100),
  evaluation JSONB,
  response_time_seconds INTEGER CHECK (response_time_seconds >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_responses_question_id ON user_responses(question_id);
CREATE INDEX idx_responses_user_id ON user_responses(user_id);
CREATE INDEX idx_responses_created_at ON user_responses(created_at DESC);
```

#### user_topic_progress
```sql
CREATE TABLE user_topic_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  mastery_level DECIMAL(5,2) DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  time_spent_seconds INTEGER DEFAULT 0 CHECK (time_spent_seconds >= 0),
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

CREATE INDEX idx_topic_progress_user_id ON user_topic_progress(user_id);
CREATE INDEX idx_topic_progress_mastery ON user_topic_progress(mastery_level DESC);
```

#### user_concept_progress
```sql
CREATE TABLE user_concept_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
  mastery_level DECIMAL(5,2) DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  retention_strength DECIMAL(5,2) DEFAULT 0 CHECK (retention_strength >= 0 AND retention_strength <= 100),
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, concept_id)
);

CREATE INDEX idx_concept_progress_user_id ON user_concept_progress(user_id);
CREATE INDEX idx_concept_progress_next_review ON user_concept_progress(next_review_at);
```

### Support Tables

#### hints
```sql
CREATE TABLE hints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
  hint_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hints_question_id ON hints(question_id);
```

#### analytics_events
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  session_id UUID REFERENCES learning_sessions(id),
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);
```

## 6.3 Database Triggers

### Auto-Create User Profile

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, level, xp, streak_days)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    1,
    0,
    0
  );
  
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Update Timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

*Document continues with sections 7-12...*

---

## Document Navigation

- **Part 1**: Sections 1-6 (Current)
- **Part 2**: Sections 7-12 (Implementation, API, Security, Deployment, Testing, Future)

See individual documentation files in `docs/` for detailed information on each section.

---

**End of Part 1**
