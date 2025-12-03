# Implementation Details

## Backend Implementation

### 1. Service Layer Architecture

```
Controllers (HTTP Layer)
       ↓
Services (Business Logic)
       ↓
Database/External APIs
```

#### Example: Session Creation Flow

```typescript
// Controller: backend/src/controllers/session.controller.ts
export class SessionController {
  startSession = async (req: AuthRequest, res: Response) => {
    const { topicId, difficulty } = req.body;
    const session = await this.sessionService.createSession(
      req.userId!,
      topicId,
      difficulty
    );
    res.json({ session });
  };
}

// Service: backend/src/services/session.service.ts
export class SessionService {
  async createSession(userId: string, topicId: string, difficulty?: number) {
    // 1. Ensure user profile exists
    await this.ensureUserProfile(userId);
    
    // 2. Get user preferences
    const preferences = await this.getUserPreferences(userId);
    
    // 3. Calculate initial difficulty
    const initialDifficulty = this.calculateInitialDifficulty(
      preferences,
      difficulty
    );
    
    // 4. Create session in database
    const session = await supabase
      .from('learning_sessions')
      .insert({ user_id: userId, topic_id: topicId, ... })
      .single();
    
    // 5. Generate first question
    const question = await this.questionService.generateQuestion(
      userId,
      topicId,
      initialDifficulty
    );
    
    // 6. Update user streak
    await this.userService.updateStreak(userId);
    
    return { ...session, currentQuestion: question };
  }
}
```

---

### 2. Authentication Flow

```
User Login Request
       ↓
POST /api/v1/auth/login
       ↓
AuthController.login()
       ↓
AuthService.login()
       ↓
Supabase Auth API
       ↓
Return JWT Token
       ↓
Store in Frontend (Zustand)
       ↓
Include in subsequent requests
       ↓
Middleware validates token
```

#### Implementation

```typescript
// Middleware: backend/src/middleware/auth.ts
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const user = await authService.verifyToken(token);
    req.userId = user.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

### 3. Question Generation Pipeline

```
1. Get Topic & Concept
       ↓
2. Determine Difficulty
       ↓
3. Build Prompt
       ↓
4. Call Gemini API
       ↓
5. Parse Response
       ↓
6. Store Question
       ↓
7. Generate Hints
       ↓
8. Return Question
```

#### Code Flow

```typescript
// backend/src/services/question.service.ts
async generateQuestion(
  userId: string,
  topicId: string,
  difficulty: number
) {
  // 1. Get topic and concepts
  const topic = await this.getTopic(topicId);
  const concept = this.selectConcept(topic.concepts, difficulty);
  
  // 2. Build prompt
  const prompt = this.buildQuestionPrompt(topic, concept, difficulty);
  
  // 3. Call Gemini
  const questionText = await generateWithGemini(
    prompt,
    'You are an expert educator using the Socratic method...'
  );
  
  // 4. Store in database
  const question = await supabase
    .from('questions')
    .insert({
      session_id: sessionId,
      concept_id: concept.id,
      question_text: questionText,
      difficulty
    })
    .single();
  
  // 5. Generate hints
  await this.generateHints(question.id, questionText, difficulty);
  
  return question;
}
```

---

## Frontend Implementation

### 1. State Management (Zustand)

```typescript
// frontend/src/store/authStore.ts
interface AuthState {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  
  login: async (email, password) => {
    const { data } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    set({ user: data.user, session: data.session });
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  }
}));
```

### 2. Chat Interface Implementation

```typescript
// frontend/src/pages/Session.tsx
export function Session() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [response, setResponse] = useState('');
  
  const submitResponse = async () => {
    // 1. Add user message to chat
    addMessage({ type: 'response', content: response });
    
    // 2. Send to backend
    const result = await api.post(`/sessions/${sessionId}/submit`, {
      questionId: currentQuestion.id,
      response
    });
    
    // 3. Display evaluation
    addMessage({
      type: 'evaluation',
      content: formatEvaluation(result.evaluation)
    });
    
    // 4. Show next question
    if (result.nextQuestion) {
      setCurrentQuestion(result.nextQuestion);
      addMessage({
        type: 'question',
        content: result.nextQuestion.text
      });
    }
  };
  
  return (
    <div className="chat-interface">
      <MessageList messages={messages} />
      <InputArea
        value={response}
        onChange={setResponse}
        onSubmit={submitResponse}
      />
    </div>
  );
}
```

### 3. Real-time Updates

```typescript
// Using Supabase Realtime (future feature)
useEffect(() => {
  const channel = supabase
    .channel('session-updates')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'questions',
      filter: `session_id=eq.${sessionId}`
    }, (payload) => {
      // New question generated
      setCurrentQuestion(payload.new);
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [sessionId]);
```

---

## ML Service Implementation

### 1. Flask API Structure

```python
# ml-service/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

@app.route('/api/v1/generate-question', methods=['POST'])
def generate_question():
    data = request.json
    topic = data.get('topic')
    difficulty = data.get('difficulty')
    
    # Generate question using Gemini
    question = generate_with_gemini(
        f"Generate Socratic question for {topic} at difficulty {difficulty}"
    )
    
    return jsonify({'question': question})

@app.route('/api/v1/evaluate-response', methods=['POST'])
def evaluate_response():
    data = request.json
    question = data.get('question')
    response = data.get('response')
    
    # Evaluate using Gemini
    evaluation = evaluate_with_gemini(question, response)
    
    return jsonify(evaluation)
```

### 2. Gemini Integration

```python
def generate_with_gemini(prompt, system_instruction=None):
    model = genai.GenerativeModel(
        model_name='gemini-2.0-flash-exp',
        system_instruction=system_instruction
    )
    
    response = model.generate_content(prompt)
    return response.text

def evaluate_with_gemini(question, response):
    prompt = f"""Evaluate this response:
    Q: {question}
    A: {response}
    
    Return JSON with score, cognitiveLoad, understanding, etc."""
    
    result = generate_with_gemini(prompt)
    return json.loads(result)
```

---

## Algorithm Implementations

### 1. Adaptive Difficulty

```typescript
// backend/src/algorithms/adaptiveDifficulty.ts
export function adaptDifficulty(
  currentDifficulty: number,
  performanceMetrics: {
    score: number;
    cognitiveLoad: number;
    responseTime: number;
  }
): number {
  const { score, cognitiveLoad } = performanceMetrics;
  
  // Decision matrix
  if (score >= 85 && cognitiveLoad < 60) {
    // Performing well, increase challenge
    return Math.min(10, currentDifficulty + 1);
  }
  
  if (score < 60 || cognitiveLoad > 85) {
    // Struggling, decrease difficulty
    return Math.max(1, currentDifficulty - 1);
  }
  
  // In optimal zone, maintain
  return currentDifficulty;
}
```

### 2. Spaced Repetition

```typescript
// backend/src/algorithms/spacedRepetition.ts
export function calculateNextReview(
  conceptProgress: ConceptProgress
): Date {
  const { mastery, reviewCount, lastReviewed } = conceptProgress;
  
  // SM-2 inspired algorithm
  const intervals = [1, 3, 7, 14, 30, 60, 120]; // days
  const baseInterval = intervals[Math.min(reviewCount, intervals.length - 1)];
  
  // Adjust by mastery (0-100%)
  const masteryFactor = mastery / 100;
  const adjustedInterval = baseInterval * (0.5 + masteryFactor);
  
  const nextReview = new Date(lastReviewed);
  nextReview.setDate(nextReview.getDate() + adjustedInterval);
  
  return nextReview;
}
```

### 3. Cognitive Load Assessment

```typescript
// backend/src/algorithms/cognitiveLoad.ts
export function assessCognitiveLoad(
  question: Question,
  response: Response,
  userState: UserState
): number {
  // Intrinsic load (question complexity)
  const intrinsicLoad = question.difficulty * 10;
  
  // Extraneous load (user struggle)
  const extraneousLoad = (100 - response.score) * 0.5;
  
  // Germane load (productive effort)
  const germaneLoad = response.score * 0.3;
  
  // Combined load
  const totalLoad = (
    intrinsicLoad * 0.4 +
    extraneousLoad * 0.4 +
    germaneLoad * 0.2
  );
  
  return Math.min(100, Math.max(0, totalLoad));
}
```

---

## Performance Optimizations

### 1. Database Indexing

```sql
-- Frequently queried columns
CREATE INDEX idx_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX idx_sessions_status ON learning_sessions(status);
CREATE INDEX idx_questions_session_id ON questions(session_id);
CREATE INDEX idx_responses_user_id ON user_responses(user_id);
CREATE INDEX idx_progress_user_topic ON user_topic_progress(user_id, topic_id);
```

### 2. Caching Strategy

```typescript
// Redis cache (future implementation)
const cache = new Redis();

async function getTopics() {
  // Check cache first
  const cached = await cache.get('topics:all');
  if (cached) return JSON.parse(cached);
  
  // Fetch from database
  const topics = await supabase.from('topics').select('*');
  
  // Cache for 1 hour
  await cache.setex('topics:all', 3600, JSON.stringify(topics));
  
  return topics;
}
```

### 3. API Rate Limiting

```typescript
// backend/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});
```

---

## Security Implementation

### 1. Input Validation

```typescript
import { z } from 'zod';

const startSessionSchema = z.object({
  topicId: z.string().uuid(),
  difficulty: z.number().min(1).max(10).optional()
});

// In controller
const validated = startSessionSchema.parse(req.body);
```

### 2. SQL Injection Prevention

```typescript
// Using Supabase client (parameterized queries)
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId); // Safe - parameterized

// Never do this:
// const query = `SELECT * FROM users WHERE id = '${userId}'`; // Unsafe!
```

### 3. XSS Prevention

```typescript
// Frontend sanitization
import DOMPurify from 'dompurify';

function displayUserContent(content: string) {
  const clean = DOMPurify.sanitize(content);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

---

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment details.
