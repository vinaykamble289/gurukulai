# AI/ML Implementation Details

## Overview

This platform uses **Google Gemini AI** for intelligent question generation and response evaluation. It does NOT use traditional Reinforcement Learning (RL) but employs **rule-based adaptive algorithms** for personalized learning.

---

## 1. Google Gemini Integration

### Architecture

```
Backend/ML Service
       ↓
Google Generative AI SDK
       ↓
Gemini API (Google Cloud)
       ↓
Response (Text/JSON)
```

### Models Used

**Primary Model**: `gemini-2.0-flash-exp`
- Fast response time
- High quality outputs
- Cost-effective

**Fallback Model**: `gemini-1.5-flash`
- Used if primary fails
- Ensures reliability
- Automatic failover

### Implementation

#### Backend Integration (`backend/src/config/gemini.ts`)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function generateWithGemini(
  prompt: string,
  systemInstruction?: string,
  useFallback = false
): Promise<string> {
  const modelName = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;
  
  const model = genAI.getGenerativeModel({
    model: modelName,
    ...(systemInstruction && { systemInstruction })
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

#### ML Service Integration (`ml-service/app.py`)

```python
import google.generativeai as genai

genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

def generate_with_gemini(prompt, system_instruction=None):
    model = genai.GenerativeModel(
        model_name='gemini-2.0-flash-exp',
        system_instruction=system_instruction
    )
    
    response = model.generate_content(prompt)
    return response.text
```

---

## 2. Socratic Question Generation

### Algorithm

```
Input: Topic, Concept, Difficulty Level (1-10)
       ↓
Construct Prompt:
  "Generate Socratic question for {concept}
   Difficulty: {difficulty}/10
   Guidelines: Use Socratic method, guide thinking"
       ↓
Send to Gemini API
       ↓
Receive Generated Question
       ↓
Store in Database
       ↓
Return to Frontend
```

### Prompt Engineering

```typescript
const prompt = `Generate a Socratic question for learning about "${concept}" 
in the topic of "${topicName}".

Difficulty level: ${difficulty}/10 (${difficultyDescription})

Guidelines:
- Use the Socratic method: ask questions that guide thinking
- Encourage critical thinking and self-discovery
- Build on prior knowledge
- Be clear and focused
- Appropriate for difficulty level ${difficulty}

Generate only the question text, no additional explanation.`;

const systemInstruction = `You are an expert educator using the Socratic 
method to help learners discover knowledge through guided questioning.`;
```

### Difficulty Mapping

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
```

---

## 3. Response Evaluation

### Algorithm

```
Input: Question, User Response, Concept, Difficulty
       ↓
Construct Evaluation Prompt
       ↓
Send to Gemini API (JSON mode)
       ↓
Receive Structured Evaluation:
  {
    score: 0-100,
    cognitiveLoad: 0-100,
    understanding: "low" | "medium" | "high",
    strengths: ["..."],
    improvements: ["..."],
    followUpQuestion: "..."
  }
       ↓
Store in Database
       ↓
Return to Frontend
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
2. Cognitive load estimate (0-100, where 50-75 is optimal)
3. Key strengths in the response
4. Areas for improvement
5. A follow-up Socratic question to deepen understanding

Format as JSON:
{
  "score": number,
  "cognitiveLoad": number,
  "understanding": "low" | "medium" | "high",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "followUpQuestion": "question text"
}`;
```

### Cognitive Load Theory

**Optimal Range**: 50-75%
- Below 50%: Too easy, not challenging enough
- 50-75%: Optimal learning zone
- Above 75%: Too difficult, overwhelming

**Calculation**: AI estimates based on:
- Response complexity
- Concept difficulty
- User's demonstrated understanding
- Time to respond (future feature)

---

## 4. Adaptive Difficulty Algorithm

### Rule-Based Adaptation (Not RL)

```typescript
// backend/src/algorithms/adaptiveDifficulty.ts

function adaptDifficulty(
  currentDifficulty: number,
  score: number,
  cognitiveLoad: number
): number {
  let newDifficulty = currentDifficulty;
  
  // Increase difficulty if performing well with low cognitive load
  if (score >= 85 && cognitiveLoad < 60) {
    newDifficulty = Math.min(10, currentDifficulty + 1);
  }
  
  // Decrease difficulty if struggling or overwhelmed
  else if (score < 60 || cognitiveLoad > 85) {
    newDifficulty = Math.max(1, currentDifficulty - 1);
  }
  
  // Maintain difficulty if in optimal zone
  else {
    newDifficulty = currentDifficulty;
  }
  
  return newDifficulty;
}
```

### Decision Tree

```
                    Current Performance
                            ↓
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
   Score >= 85         60 <= Score < 85     Score < 60
   Load < 60           Any Load             OR Load > 85
        ↓                   ↓                   ↓
   Increase            Maintain            Decrease
   Difficulty          Difficulty          Difficulty
   (+1 level)          (same level)        (-1 level)
        ↓                   ↓                   ↓
   Generate Next Question at New Difficulty
```

---

## 5. Spaced Repetition Algorithm

### Implementation

```typescript
// backend/src/algorithms/spacedRepetition.ts

function calculateNextReview(
  mastery: number,
  reviewCount: number,
  lastReviewed: Date
): Date {
  // Base intervals (in days)
  const intervals = [1, 3, 7, 14, 30, 60, 120];
  
  // Adjust based on mastery
  const masteryFactor = mastery / 100;
  const intervalIndex = Math.min(reviewCount, intervals.length - 1);
  const baseInterval = intervals[intervalIndex];
  
  // Calculate next review date
  const adjustedInterval = baseInterval * (0.5 + masteryFactor);
  const nextReview = new Date(lastReviewed);
  nextReview.setDate(nextReview.getDate() + adjustedInterval);
  
  return nextReview;
}
```

### Schedule

```
Review 1: +1 day
Review 2: +3 days
Review 3: +7 days
Review 4: +14 days
Review 5: +30 days
Review 6: +60 days
Review 7+: +120 days

* Adjusted by mastery level (0-100%)
```

---

## 6. Cognitive Load Monitoring

### Algorithm

```typescript
// backend/src/algorithms/cognitiveLoad.ts

function assessCognitiveLoad(
  questionDifficulty: number,
  responseQuality: number,
  timeSpent: number,
  previousLoad: number
): number {
  // Factors contributing to cognitive load
  const difficultyFactor = questionDifficulty * 10;
  const performanceFactor = (100 - responseQuality) * 0.5;
  const timeFactor = Math.min(timeSpent / 60, 20); // Cap at 20
  
  // Weighted average
  const currentLoad = (
    difficultyFactor * 0.4 +
    performanceFactor * 0.4 +
    timeFactor * 0.2
  );
  
  // Smooth with previous load (moving average)
  const smoothedLoad = (currentLoad * 0.7) + (previousLoad * 0.3);
  
  return Math.min(100, Math.max(0, smoothedLoad));
}
```

### Zones

```
┌─────────────────────────────────────────┐
│  Cognitive Load Zones                   │
├─────────────────────────────────────────┤
│  0-40%    │ Too Easy (Boredom)          │
│  40-50%   │ Easy (Comfortable)          │
│  50-75%   │ Optimal (Flow State) ✓      │
│  75-85%   │ Challenging (Stretch)       │
│  85-100%  │ Overwhelming (Frustration)  │
└─────────────────────────────────────────┘
```

---

## 7. Why Not Traditional RL?

### Current Approach: Rule-Based Adaptation

**Advantages**:
- ✅ Predictable behavior
- ✅ Easy to debug and tune
- ✅ No training data required
- ✅ Immediate deployment
- ✅ Transparent decision-making

**Limitations**:
- ❌ Fixed rules, not learned
- ❌ May not discover optimal strategies
- ❌ Requires manual tuning

### Future: Reinforcement Learning

**Potential Implementation**:

```
State: [user_mastery, current_difficulty, cognitive_load, 
        recent_scores, topic_complexity]
        ↓
Action: [increase_difficulty, decrease_difficulty, maintain,
         suggest_review, change_topic]
        ↓
Reward: learning_efficiency = 
        (mastery_gain * engagement) / time_spent
        ↓
Policy: π(action | state) learned via PPO/DQN
```

**Why Not Yet**:
- Requires large dataset of learning sessions
- Need to define reward function carefully
- Risk of suboptimal exploration phase
- Current rule-based system works well

---

*Continued in DATABASE_ER_DIAGRAM.md...*
