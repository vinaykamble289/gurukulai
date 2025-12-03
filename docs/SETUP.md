# Complete Setup Guide

## Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd ml-service && pip install -r requirements.txt && cd ..
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_API_KEY=your_google_api_key
```

### 3. Setup Database
1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/schema.sql`
3. Run `supabase/create-profile-trigger.sql`
4. Run `supabase/seed.sql` (optional - sample topics)

### 4. Fix User Profiles (if needed)
```bash
node scripts/fix-user-profiles.js
```

### 5. Start Everything
```bash
node start-debug.js
```

### 6. Open Application
http://localhost:5173

## Troubleshooting

### "Failed to create session"
```bash
node scripts/fix-user-profiles.js
```

### Chat input disabled
- Refresh the page
- Check browser console
- Create a new session

### No topics available
- Click "+ Create Topic" in dashboard
- Or run `supabase/seed.sql`

## Verification
```bash
node scripts/check-status.js
```

See `docs/TROUBLESHOOTING.md` for more help.
