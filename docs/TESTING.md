# Testing Guide

## Manual Testing Workflow

### 1. Test User Registration

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

Expected: Returns user object and session token

### 2. Test Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Expected: Returns user and session with access_token

### 3. Test Get Topics

```bash
curl http://localhost:3000/api/v1/topics
```

Expected: Returns array of topics from seed data

### 4. Test Start Session

```bash
# Replace TOKEN with access_token from login
curl -X POST http://localhost:3000/api/v1/sessions/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "topicId": "550e8400-e29b-41d4-a716-446655440002"
  }'
```

Expected: Returns session with first generated question

### 5. Test Submit Response

```bash
# Replace SESSION_ID and QUESTION_ID from previous response
curl -X POST http://localhost:3000/api/v1/sessions/SESSION_ID/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "questionId": "QUESTION_ID",
    "response": "The discriminant tells us about the nature of the roots. If positive, we get two real roots. If zero, one root. If negative, complex roots."
  }'
```

Expected: Returns evaluation with score and next question

### 6. Test Get Hint

```bash
curl -X POST http://localhost:3000/api/v1/questions/QUESTION_ID/hint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"level": 1}'
```

Expected: Returns hint text

### 7. Test Progress Overview

```bash
curl http://localhost:3000/api/v1/progress/overview \
  -H "Authorization: Bearer TOKEN"
```

Expected: Returns user progress statistics

### 8. Test Complete Session

```bash
curl -X POST http://localhost:3000/api/v1/sessions/SESSION_ID/complete \
  -H "Authorization: Bearer TOKEN"
```

Expected: Returns session summary with XP earned

## Frontend Testing

### Registration Flow
1. Navigate to http://localhost:5173/register
2. Fill in name, email, password
3. Click Register
4. Should redirect to dashboard

### Login Flow
1. Navigate to http://localhost:5173/login
2. Enter credentials
3. Click Login
4. Should redirect to dashboard

### Learning Session Flow
1. On dashboard, click "Start Learning" on any topic
2. Read the Socratic question
3. Type a thoughtful response
4. Click "Submit Answer"
5. Review evaluation feedback
6. Continue with next question or complete session

### Hint System
1. During a session, click "💡 Hint" button
2. Read hint level 1
3. Click again for hint level 2
4. Click again for hint level 3
5. Verify hints become progressively more specific

### Progress Tracking
1. Complete a few sessions
2. Navigate to dashboard
3. Verify stats update (mastery, streak, XP, level)

## Integration Testing

### Test Adaptive Difficulty
1. Start a session
2. Answer questions correctly with high scores
3. Observe difficulty increasing
4. Answer questions poorly
5. Observe difficulty decreasing

### Test Streak System
1. Complete a session today
2. Check streak count
3. Come back tomorrow and complete another
4. Verify streak incremented
5. Skip a day
6. Verify streak reset

### Test XP and Leveling
1. Note current XP and level
2. Complete a session
3. Verify XP increased
4. Complete enough sessions to level up
5. Verify level increased

## Database Verification

### Check User Created
```sql
SELECT * FROM public.user_profiles;
```

### Check Session Created
```sql
SELECT * FROM public.learning_sessions;
```

### Check Questions Generated
```sql
SELECT * FROM public.questions;
```

### Check Responses Stored
```sql
SELECT * FROM public.user_responses;
```

### Check Progress Updated
```sql
SELECT * FROM public.user_topic_progress;
```

## ML Service Testing

### Test Question Generation
```bash
curl -X POST http://localhost:5000/api/v1/generate-question \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Quadratic Equations",
    "difficulty": 5
  }'
```

### Test Response Evaluation
```bash
curl -X POST http://localhost:5000/api/v1/evaluate-response \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the discriminant?",
    "response": "b squared minus 4ac"
  }'
```

## Performance Testing

### Load Test Session Creation
```bash
# Install Apache Bench
# Test 100 requests with 10 concurrent
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
  -p session.json -T application/json \
  http://localhost:3000/api/v1/sessions/start
```

### Monitor Response Times
- Session start: < 2s (includes OpenAI call)
- Submit response: < 3s (includes OpenAI evaluation)
- Get topics: < 100ms
- Get progress: < 200ms

## Error Testing

### Test Invalid Credentials
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wrong@example.com",
    "password": "wrongpass"
  }'
```
Expected: 401 error

### Test Missing Auth Token
```bash
curl http://localhost:3000/api/v1/progress/overview
```
Expected: 401 error

### Test Invalid Session ID
```bash
curl http://localhost:3000/api/v1/sessions/invalid-id \
  -H "Authorization: Bearer TOKEN"
```
Expected: 404 error

## Automated Testing (Future)

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## Common Issues

### OpenAI Rate Limits
- Symptom: 429 errors from OpenAI
- Solution: Add delays between requests or upgrade OpenAI plan

### Supabase Connection Issues
- Symptom: Connection timeout
- Solution: Check Supabase project is not paused

### CORS Errors
- Symptom: Browser blocks requests
- Solution: Verify FRONTEND_URL in backend .env

### Session Timeout
- Symptom: 401 after some time
- Solution: Implement token refresh in frontend

## Test Coverage Goals

- [ ] Unit tests for all services
- [ ] Integration tests for all API endpoints
- [ ] E2E tests for critical user flows
- [ ] Performance benchmarks
- [ ] Security testing
- [ ] Accessibility testing

## Monitoring

### Health Checks
```bash
curl http://localhost:3000/health
curl http://localhost:5000/health
```

### Logs
- Backend: Check console output
- Frontend: Check browser console
- ML Service: Check Flask logs
- Supabase: Check Supabase dashboard logs

## Success Criteria

✅ User can register and login
✅ User can start a learning session
✅ Questions are generated dynamically
✅ Responses are evaluated accurately
✅ Difficulty adapts based on performance
✅ Progress is tracked correctly
✅ Hints work progressively
✅ XP and levels update
✅ Streaks are maintained
