# Deployment Steps for Socratic Learning Platform

This file contains the step-by-step instructions for deploying the platform to production using Vercel (frontend), Render (backend and ML service), and Supabase (database).

## Prerequisites
- GitHub repository set up and pushed.
- Accounts created for Vercel, Render, and Supabase.
- CI/CD pipeline configured (`.github/workflows/ci.yml`).
- Environment variables prepared (API keys, secrets).

## 1. Deploy to Vercel (Frontend)
1. Sign up/login to [Vercel](https://vercel.com).
2. Click "New Project" and import your GitHub repository.
3. Configure project settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `VITE_API_URL`: Your Render backend URL (set after backend deployment)
5. Deploy: Vercel will auto-deploy on pushes to `main`. For staging, create a separate project connected to `staging` branch.
6. Note the deployed frontend URL for CORS and API configurations.

## 2. Deploy to Render (Backend and ML Service)
1. Sign up/login to [Render](https://render.com).
2. Connect your GitHub repository to Render.
3. **For Backend Service**:
   - Click "New" > "Web Service".
   - Select your repo, set branch to `main`.
   - Configure:
     - **Runtime**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Root Directory**: `backend`
   - Set environment variables:
     - `NODE_ENV`: `production`
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_ANON_KEY`: Your Supabase anon key
     - `JWT_SECRET`: Secure random string
     - `GEMINI_API_KEY`: Your Google Gemini API key
   - Deploy. Note the service URL.
4. **For ML Service**:
   - Click "New" > "Web Service".
   - Select your repo, set branch to `main`.
   - Configure:
     - **Runtime**: Python 3
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `python app.py`
     - **Root Directory**: `ml-service`
   - Set environment variables:
     - `GEMINI_API_KEY`: Your Google Gemini API key
     - `BACKEND_URL`: Your Render backend URL
   - Deploy. Note the service URL.
5. For staging, create separate services connected to `staging` branch.

## 3. Update Configurations
1. Update frontend environment variables in Vercel with the backend URL.
2. Update Supabase CORS settings to allow your Vercel domain.
3. Update backend CORS to allow your frontend domain.
4. Test integrations: Frontend ↔ Backend ↔ Database ↔ ML Service.

## 4. Domain and SSL (Optional)
- In Vercel, add custom domain under project settings.
- Render provides automatic HTTPS.
- Update DNS and CORS accordingly.

## Monitoring and Scaling
- Monitor usage via platform dashboards.
- Upgrade plans as traffic grows (free tiers have limits).
- Set up health checks and error monitoring.

Deployments auto-trigger on GitHub pushes after CI tests pass.