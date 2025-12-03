# Troubleshooting Guide

## Common Issues

### 1. "Failed to create session" (500 Error)

**Cause**: User profile doesn't exist in database.

**Solution**:
```bash
node scripts/fix-user-profiles.js
```

Or run in Supabase SQL Editor:
```sql
-- Create profiles for existing users
INSERT INTO public.user_profiles (id, name, level, xp, streak_days)
SELECT u.id, split_part(u.email, '@', 1), 1, 0, 0
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

### 2. Chat Input Disabled

**Cause**: No current question loaded.

**Solutions**:
1. Refresh the page
2. Check browser console for errors
3. Create a new session instead of continuing old one
4. Verify GOOGLE_API_KEY is valid

### 3. ML Service Won't Start

**Cause**: Missing dependencies or API key.

**Solution**:
```bash
cd ml-service
pip install -r requirements.txt
cd ..
# Check .env has GOOGLE_API_KEY
```

### 4. Backend Errors

**Solution**:
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
cd ..
```

### 5. No Topics Available

**Solutions**:
- Click "+ Create Topic" in dashboard
- Run `supabase/seed.sql` in Supabase SQL Editor

## Check System Status
```bash
node scripts/check-status.js
```

## Run Tests
```bash
node scripts/test-ml-and-dashboard.js
```
