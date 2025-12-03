# Complete API Design Specification

## API Overview

Base URL: `https://api.socratic-learning.com/v1`

Authentication: JWT Bearer tokens

Rate Limiting: 100 requests/minute per user, 1000/minute per organization

## Authentication Endpoints

### POST /auth/register
Register a new learner account

**Request Body**:
```json
{
  "email": "learner@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "age": 25,
  "educationLevel": "undergraduate",
  "learningGoals": ["mathematics", "critical thinking"]
}
```

**Response** (201 Created):
```json
{
  "userId": "usr_abc123",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_xyz789",
  "expiresIn": 3600
}
```

### POST /auth/login
Authenticate existing user

**Request Body**:
```json
{
  "email": "learner@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "userId": "usr_abc123",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_xyz789",
  "expiresIn": 3600
}
```

### POST /auth/refresh
Refresh access token

**Request Body**:
```json
{
  "refreshToken": "refresh_xyz789"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

## Learner Profile Endpoints

### GET /learners/{userId}/profile
Retrieve learner profile and knowledge state

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "userId": "usr_abc123",
  "name": "John Doe",
  "email": "learner@example.com",
  "age": 25,
  "educationLevel": "undergraduate",
  "learningPreferences": {
    "modalityPreference": "visual",
    "sessionDuration": "medium",
    "difficultyPreference": "challenging"
  },
  "knowledgeState": {
    "algebra": {
      "masteryLevel": 0.75,
      "lastReviewed": "2024-12-01T10:30:00Z",
      "conceptsLearned": 45,
      "conceptsTotal": 60
    },
    "geometry": {
      "masteryLevel": 0.60,
      "lastReviewed": "2024-11-28T14:20:00Z",
      "conceptsLearned": 30,
      "conceptsTotal": 50
    }
  },
  "cognitiveProfile": {
    "workingMemoryCapacity": "high",
    "processingSpeed": "medium",
    "attentionSpan": 25
  },
  "engagementMetrics": {
    "totalSessions": 45,
    "totalTimeMinutes": 1350,
    "averageSessionLength": 30,
    "streakDays": 7,
    "lastActive": "2024-12-02T09:15:00Z"
  }
}
```

### PATCH /learners/{userId}/profile
Update learner profile

**Request Body**:
```json
{
  "learningPreferences": {
    "modalityPreference": "auditory",
    "sessionDuration": "short"
  }
}
```

**Response** (200 OK):
```json
{
  "message": "Profile updated successfully",
  "updatedFields": ["learningPreferences"]
}
```

### GET /learners/{userId}/progress
Get detailed learning progress

**Query Parameters**:
- `subject` (optional): Filter by subject
- `timeRange` (optional): "week", "month", "year", "all"

**Response** (200 OK):
```json
{
  "userId": "usr_abc123",
  "timeRange": "month",
  "overallProgress": {
    "conceptsMastered": 75,
    "conceptsInProgress": 15,
    "conceptsNotStarted": 110,
    "averageMasteryLevel": 0.68
  },
  "subjectProgress": [
    {
      "subject": "algebra",
      "masteryLevel": 0.75,
      "conceptsMastered": 45,
      "timeSpentMinutes": 600,
      "retentionRate": 0.82
    }
  ],
  "recentAchievements": [
    {
      "achievementId": "ach_001",
      "title": "7-Day Streak",
      "earnedAt": "2024-12-02T00:00:00Z"
    }
  ]
}
```

## Session Management Endpoints

### POST /sessions/start
Start a new learning session

**Request Body**:
```json
{
  "userId": "usr_abc123",
  "subject": "algebra",
  "sessionType": "practice",
  "context": {
    "deviceType": "mobile",
    "location": "commute",
    "availableTime": 15
  }
}
```

**Response** (201 Created):
```json
{
  "sessionId": "ses_xyz789",
  "startTime": "2024-12-02T09:00:00Z",
  "recommendedDuration": 15,
  "initialDifficulty": 6,
  "message": "Session started. Let's begin with some review questions."
}
```

### GET /sessions/{sessionId}
Get current session state

**Response** (200 OK):
```json
{
  "sessionId": "ses_xyz789",
  "userId": "usr_abc123",
  "subject": "algebra",
  "startTime": "2024-12-02T09:00:00Z",
  "duration": 12,
  "questionsAsked": 5,
  "questionsAnswered": 5,
  "currentDifficulty": 7,
  "cognitiveLoad": 65,
  "performanceScore": 0.80
}
```

### POST /sessions/{sessionId}/end
End a learning session

**Request Body**:
```json
{
  "feedback": {
    "difficulty": "appropriate",
    "engagement": 8,
    "satisfaction": 9
  }
}
```

**Response** (200 OK):
```json
{
  "sessionId": "ses_xyz789",
  "summary": {
    "duration": 15,
    "questionsCompleted": 6,
    "accuracy": 0.83,
    "conceptsCovered": ["linear_equations", "quadratic_equations"],
    "masteryGain": 0.05,
    "nextReviewDate": "2024-12-03T09:00:00Z"
  },
  "achievements": [
    {
      "achievementId": "ach_002",
      "title": "Perfect Session",
      "description": "Answered all questions correctly"
    }
  ]
}
```

## Socratic Questioning Endpoints

### POST /questions/generate
Generate next Socratic question

**Request Body**:
```json
{
  "sessionId": "ses_xyz789",
  "userId": "usr_abc123",
  "currentTopic": "quadratic_equations",
  "previousResponse": {
    "questionId": "q_001",
    "answer": "The discriminant tells us about the roots",
    "responseTime": 45
  },
  "context": {
    "cognitiveLoad": 65,
    "consecutiveCorrect": 3
  }
}
```

**Response** (200 OK):
```json
{
  "questionId": "q_002",
  "questionText": "You mentioned the discriminant tells us about roots. Can you explain what specific information it provides about the nature of those roots?",
  "questionType": "probing_reasons",
  "difficulty": 7,
  "expectedReasoningPath": [
    "discriminant_calculation",
    "sign_interpretation",
    "root_nature_conclusion"
  ],
  "hints": [
    {
      "level": 1,
      "text": "Think about what happens when the discriminant is positive, negative, or zero."
    },
    {
      "level": 2,
      "text": "Consider how the discriminant relates to the formula for finding roots."
    }
  ],
  "timeEstimate": 60
}
```

### POST /questions/{questionId}/respond
Submit response to a question

**Request Body**:
```json
{
  "sessionId": "ses_xyz789",
  "userId": "usr_abc123",
  "answer": "When the discriminant is positive, we get two real roots. When it's zero, we get one repeated root. When it's negative, we get complex roots.",
  "responseTime": 52,
  "confidence": 8,
  "hintsUsed": 0
}
```

**Response** (200 OK):
```json
{
  "questionId": "q_002",
  "evaluation": {
    "understandingScore": 95,
    "reasoningQuality": "excellent",
    "conceptsIdentified": [
      "discriminant_interpretation",
      "root_types",
      "real_vs_complex"
    ],
    "misconceptions": [],
    "strengthsIdentified": [
      "Clear explanation",
      "Complete coverage of cases",
      "Correct terminology"
    ]
  },
  "feedback": {
    "message": "Excellent explanation! You've correctly identified all three cases. Can you now think about why the discriminant determines this? What's happening mathematically?",
    "feedbackType": "encouraging_deeper",
    "nextQuestionPreview": "We'll explore the mathematical reasoning behind this relationship."
  },
  "adaptations": {
    "difficultyAdjustment": 1,
    "newDifficulty": 8,
    "cognitiveLoadStatus": "optimal"
  }
}
```

### GET /questions/history
Get question history for a session or user

**Query Parameters**:
- `sessionId` (optional): Filter by session
- `userId` (required): User identifier
- `limit` (optional): Number of questions (default: 20)

**Response** (200 OK):
```json
{
  "questions": [
    {
      "questionId": "q_001",
      "questionText": "What role does the discriminant play in quadratic equations?",
      "askedAt": "2024-12-02T09:05:00Z",
      "response": "The discriminant tells us about the roots",
      "understandingScore": 60,
      "responseTime": 45
    }
  ],
  "totalQuestions": 45,
  "page": 1
}
```

## Cognitive Monitoring Endpoints

### GET /cognitive/load/{sessionId}
Get real-time cognitive load metrics

**Response** (200 OK):
```json
{
  "sessionId": "ses_xyz789",
  "currentLoad": {
    "overall": 65,
    "intrinsic": 50,
    "extraneous": 10,
    "germane": 40
  },
  "loadClassification": "optimal",
  "indicators": {
    "averageResponseTime": 48,
    "responseTimeVariance": 12,
    "errorRate": 0.15,
    "pauseFrequency": 2,
    "selfReportedDifficulty": 6
  },
  "recommendations": {
    "action": "maintain",
    "reasoning": "Learner is in optimal challenge zone"
  }
}
```

### POST /cognitive/feedback
Submit cognitive state feedback

**Request Body**:
```json
{
  "sessionId": "ses_xyz789",
  "userId": "usr_abc123",
  "timestamp": "2024-12-02T09:10:00Z",
  "feedbackType": "difficulty",
  "value": 7,
  "comment": "This question is challenging but manageable"
}
```

**Response** (200 OK):
```json
{
  "message": "Feedback recorded",
  "adjustmentMade": true,
  "newDifficulty": 7
}
```

## Analytics & Reporting Endpoints

### GET /analytics/retention
Get retention metrics

**Query Parameters**:
- `userId` (required)
- `subject` (optional)
- `timeRange` (optional): "week", "month", "year"

**Response** (200 OK):
```json
{
  "userId": "usr_abc123",
  "retentionMetrics": {
    "overall": {
      "shortTerm": 0.92,
      "mediumTerm": 0.78,
      "longTerm": 0.65
    },
    "bySubject": [
      {
        "subject": "algebra",
        "retentionRate": 0.82,
        "forgettingCurve": {
          "halfLife": 14,
          "decayRate": 0.05
        },
        "conceptsAtRisk": [
          {
            "concept": "factoring_polynomials",
            "retentionScore": 0.45,
            "nextReview": "2024-12-03T10:00:00Z"
          }
        ]
      }
    ]
  },
  "recommendations": [
    {
      "type": "review",
      "concept": "factoring_polynomials",
      "urgency": "high",
      "scheduledFor": "2024-12-03T10:00:00Z"
    }
  ]
}
```

### GET /analytics/learning-gains
Measure learning gains over time

**Query Parameters**:
- `userId` (required)
- `subject` (optional)
- `startDate` (required)
- `endDate` (required)

**Response** (200 OK):
```json
{
  "userId": "usr_abc123",
  "period": {
    "start": "2024-11-01T00:00:00Z",
    "end": "2024-12-01T00:00:00Z"
  },
  "learningGains": {
    "overallGain": 0.25,
    "bySubject": [
      {
        "subject": "algebra",
        "preTestScore": 0.50,
        "postTestScore": 0.75,
        "gain": 0.25,
        "normalizedGain": 0.50,
        "effectSize": 1.2
      }
    ],
    "skillDevelopment": {
      "criticalThinking": {
        "baseline": 0.60,
        "current": 0.78,
        "improvement": 0.18
      },
      "problemSolving": {
        "baseline": 0.55,
        "current": 0.72,
        "improvement": 0.17
      }
    }
  }
}
```

### GET /analytics/engagement
Get engagement metrics

**Query Parameters**:
- `userId` (required)
- `timeRange` (optional): "week", "month", "year"

**Response** (200 OK):
```json
{
  "userId": "usr_abc123",
  "timeRange": "month",
  "engagement": {
    "overallScore": 82,
    "metrics": {
      "sessionFrequency": 0.85,
      "sessionCompletion": 0.92,
      "activeParticipation": 0.88,
      "voluntaryExtension": 0.65
    },
    "trends": {
      "direction": "increasing",
      "changeRate": 0.05
    },
    "predictedChurn": {
      "risk": "low",
      "probability": 0.12,
      "factors": ["high_streak", "consistent_performance"]
    }
  }
}
```

## Data Ingestion Endpoints

### POST /data/content/upload
Upload learning content

**Request Body** (multipart/form-data):
```
file: content.json
metadata: {
  "subject": "algebra",
  "difficulty": 6,
  "prerequisites": ["basic_arithmetic"],
  "learningObjectives": ["solve_linear_equations"]
}
```

**Response** (201 Created):
```json
{
  "contentId": "cnt_abc123",
  "status": "processing",
  "message": "Content uploaded successfully. Processing will complete in approximately 2 minutes."
}
```

### POST /data/questions/bulk
Bulk upload questions

**Request Body**:
```json
{
  "questions": [
    {
      "questionText": "What is the purpose of the quadratic formula?",
      "subject": "algebra",
      "topic": "quadratic_equations",
      "difficulty": 5,
      "questionType": "conceptual",
      "expectedAnswerPatterns": [
        "solve quadratic equations",
        "find roots",
        "determine solutions"
      ]
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "imported": 1,
  "failed": 0,
  "questionIds": ["q_abc123"]
}
```

## Feedback & Evaluation Endpoints

### POST /feedback/session
Submit session feedback

**Request Body**:
```json
{
  "sessionId": "ses_xyz789",
  "userId": "usr_abc123",
  "ratings": {
    "difficulty": 7,
    "engagement": 8,
    "satisfaction": 9,
    "questionQuality": 8,
    "feedbackHelpfulness": 9
  },
  "comments": "Great session! Questions were challenging but fair.",
  "suggestions": "Maybe add more visual examples"
}
```

**Response** (200 OK):
```json
{
  "message": "Thank you for your feedback!",
  "feedbackId": "fb_xyz789",
  "rewardPoints": 10
}
```

### POST /feedback/question
Rate individual question

**Request Body**:
```json
{
  "questionId": "q_002",
  "userId": "usr_abc123",
  "rating": 5,
  "helpful": true,
  "tags": ["clear", "thought-provoking"]
}
```

**Response** (200 OK):
```json
{
  "message": "Question feedback recorded",
  "aggregateRating": 4.7
}
```

## Admin & Management Endpoints

### GET /admin/system/health
Check system health (admin only)

**Response** (200 OK):
```json
{
  "status": "healthy",
  "services": {
    "api": "up",
    "database": "up",
    "cache": "up",
    "mlEngine": "up"
  },
  "metrics": {
    "activeUsers": 1250,
    "activeSessions": 342,
    "avgResponseTime": 145,
    "errorRate": 0.002
  }
}
```

### GET /admin/analytics/aggregate
Get platform-wide analytics (admin only)

**Response** (200 OK):
```json
{
  "totalUsers": 10000,
  "activeUsers": 7500,
  "totalSessions": 150000,
  "averageLearningGain": 0.22,
  "averageRetention": 0.75,
  "averageEngagement": 78,
  "topPerformingSubjects": ["algebra", "geometry"],
  "systemPerformance": {
    "avgQuestionGenerationTime": 1.2,
    "avgResponseEvaluationTime": 0.8
  }
}
```

## WebSocket Events

### Connection
```javascript
const ws = new WebSocket('wss://api.socratic-learning.com/v1/ws');
ws.send(JSON.stringify({
  type: 'authenticate',
  token: 'jwt_token_here'
}));
```

### Events

**real_time_feedback** (server → client):
```json
{
  "type": "real_time_feedback",
  "sessionId": "ses_xyz789",
  "feedback": {
    "message": "Great reasoning! Keep going.",
    "type": "encouragement"
  }
}
```

**cognitive_load_alert** (server → client):
```json
{
  "type": "cognitive_load_alert",
  "sessionId": "ses_xyz789",
  "load": 85,
  "recommendation": "Consider taking a short break"
}
```

**difficulty_adjusted** (server → client):
```json
{
  "type": "difficulty_adjusted",
  "sessionId": "ses_xyz789",
  "oldDifficulty": 7,
  "newDifficulty": 6,
  "reason": "cognitive_overload_detected"
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request body is missing required field: userId",
    "details": {
      "field": "userId",
      "requirement": "required"
    },
    "timestamp": "2024-12-02T09:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### Error Codes

- `400` - Bad Request (INVALID_REQUEST, VALIDATION_ERROR)
- `401` - Unauthorized (INVALID_TOKEN, TOKEN_EXPIRED)
- `403` - Forbidden (INSUFFICIENT_PERMISSIONS)
- `404` - Not Found (RESOURCE_NOT_FOUND)
- `429` - Too Many Requests (RATE_LIMIT_EXCEEDED)
- `500` - Internal Server Error (INTERNAL_ERROR)
- `503` - Service Unavailable (SERVICE_UNAVAILABLE)

## Rate Limiting

Headers included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638446400
```

## Versioning

API version is specified in URL: `/v1/`

Breaking changes will result in new version: `/v2/`

Deprecation notices provided 6 months in advance.
