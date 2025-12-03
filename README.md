# Socratic Learning Platform

An AI-powered adaptive learning platform using the Socratic method to guide learners through personalized educational journeys.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd ml-service && pip install -r requirements.txt && cd ..

# 2. Configure .env (copy from .env.example)
# Add your SUPABASE_URL, SUPABASE_ANON_KEY, GOOGLE_API_KEY

# 3. Setup database (run SQL files in Supabase Dashboard)
# - supabase/schema.sql
# - supabase/create-profile-trigger.sql
# - supabase/seed.sql (optional)

# 4. Start everything
node start-debug.js

# 5. Open http://localhost:5173
```

## ✨ Features

- 🤖 **AI-Powered Learning** - Gemini-based Socratic questioning
- 📊 **Progress Tracking** - Mastery levels, streaks, XP system
- 🎯 **Adaptive Difficulty** - Adjusts to your performance
- 💬 **Interactive Chat** - Beautiful real-time learning interface
- 📚 **Custom Topics** - Create your own learning topics
- 💡 **Progressive Hints** - 3 levels of help when needed
- 🧠 **Cognitive Load** - Optimized learning experience
- 📈 **Analytics** - Detailed progress and retention metrics

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **ML Service**: Python + Flask + Google Gemini
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth

## 📁 Project Structure

```
├── frontend/          # React frontend
├── backend/           # Express backend API
├── ml-service/        # Python ML service
├── supabase/          # Database schemas and seeds
├── docs/              # Documentation
└── scripts/           # Utility scripts
```

## 🛠️ Scripts

- `node start-debug.js` - Start all services with logs
- `node scripts/check-status.js` - Check system status
- `node scripts/fix-user-profiles.js` - Fix user profile issues
- `node scripts/test-ml-and-dashboard.js` - Run tests

## 📚 Documentation

### Quick Links
- [Setup Guide](docs/SETUP.md) - Complete setup instructions
- [Features](docs/FEATURES.md) - All features explained
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues

### Technical Documentation
- **[Technical Overview](docs/TECHNICAL_OVERVIEW.md)** - Complete technical documentation
- **[Architecture Diagrams](docs/ARCHITECTURE_DIAGRAMS.md)** - Visual system architecture
- **[AI/ML Details](docs/AI_ML_DETAILS.md)** - AI implementation and algorithms
- **[Database ER Diagram](docs/DATABASE_ER_DIAGRAM.md)** - Database design
- **[Implementation Details](docs/IMPLEMENTATION_DETAILS.md)** - Code-level details

### Full Documentation Index
See [docs/README.md](docs/README.md) for complete documentation index

## 🧪 Testing

```bash
# Check system status
node scripts/check-status.js

# Run comprehensive tests
node scripts/test-ml-and-dashboard.js
```

## 🐛 Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues and solutions.

Quick fixes:
- **Session errors**: `node scripts/fix-user-profiles.js`
- **Chat input disabled**: Refresh page or create new session
- **No topics**: Click "+ Create Topic" in dashboard

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## 📄 License

See [LICENSE](LICENSE) for details.

## 🎯 Getting Help

1. Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
2. Run `node scripts/check-status.js` to diagnose issues
3. Check browser console and backend logs
4. Review documentation in `docs/` folder

---

**Built with ❤️ using React, Node.js, Python, and Google Gemini**
