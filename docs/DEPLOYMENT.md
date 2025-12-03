# Deployment Guide

## Overview

This guide covers deploying the Socratic Learning Platform to production environments.

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Supabase project created and schema deployed
- [ ] OpenAI API key with sufficient credits
- [ ] Domain name configured (optional)
- [ ] SSL certificates ready (handled by platforms)
- [ ] Database backups configured
- [ ] Monitoring setup planned

## Option 1: Docker Compose (Simple)

### Prerequisites
- Docker and Docker Compose installed
- Server with 2GB+ RAM

### Steps

1. **Clone repository on server**
```bash
git clone <your-repo-url>
cd socratic-learning-platform
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with production values
```

3. **Build and start**
```bash
docker-compose up -d
```

4. **Setup reverse proxy (Nginx)**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

5. **Setup SSL with Let's Encrypt**
```bash
sudo certbot --nginx -d yourdomain.com
```

## Option 2: Separate Services (Recommended)

### Backend Deployment (Railway/Render/Heroku)

#### Railway
1. Create new project on Railway
2. Connect GitHub repository
3. Add environment variables
4. Deploy backend folder
5. Note the deployment URL

#### Render
1. Create new Web Service
2. Connect repository
3. Set build command: `npm install && npm run build:backend`
4. Set start command: `node dist/index.js`
5. Add environment variables
6. Deploy

#### Heroku
```bash
# Install Heroku CLI
heroku create socratic-learning-backend

# Set environment variables
heroku config:set SUPABASE_URL=your-url
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your-key
heroku config:set OPENAI_API_KEY=your-key

# Deploy
git subtree push --prefix backend heroku main
```

### Frontend Deployment (Vercel/Netlify)

#### Vercel
1. Import project from GitHub
2. Set root directory to `frontend`
3. Framework preset: Vite
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (backend URL)
5. Deploy

#### Netlify
1. Connect repository
2. Build command: `cd frontend && npm install && npm run build`
3. Publish directory: `frontend/dist`
4. Add environment variables
5. Deploy

### ML Service Deployment

#### Google Cloud Run
```bash
# Build and push image
gcloud builds submit --tag gcr.io/PROJECT_ID/ml-service ml-service/

# Deploy
gcloud run deploy ml-service \
  --image gcr.io/PROJECT_ID/ml-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=your-key
```

#### Railway
1. Create new project
2. Deploy from GitHub
3. Select ml-service folder
4. Add OPENAI_API_KEY
5. Deploy

## Option 3: AWS Deployment

### Architecture
```
CloudFront (CDN)
    ↓
S3 (Frontend Static Files)

ALB (Load Balancer)
    ↓
ECS Fargate (Backend + ML Service)
    ↓
Supabase (Database)
```

### Steps

1. **Frontend to S3 + CloudFront**
```bash
# Build frontend
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name

# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name your-bucket-name.s3.amazonaws.com
```

2. **Backend to ECS**
```bash
# Build and push Docker image
docker build -t socratic-backend backend/
docker tag socratic-backend:latest YOUR_ECR_REPO:latest
docker push YOUR_ECR_REPO:latest

# Create ECS task definition and service
# (Use AWS Console or CloudFormation)
```

3. **ML Service to ECS**
```bash
# Similar to backend
docker build -t socratic-ml ml-service/
docker tag socratic-ml:latest YOUR_ECR_REPO:latest
docker push YOUR_ECR_REPO:latest
```

## Environment Variables by Service

### Backend
```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
ML_SERVICE_URL=https://your-ml-service-url
FRONTEND_URL=https://yourdomain.com
```

### Frontend
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://api.yourdomain.com
```

### ML Service
```env
FLASK_ENV=production
OPENAI_API_KEY=your-openai-key
```

## Database (Supabase)

### Production Setup
1. Upgrade to Pro plan for better performance
2. Enable Point-in-Time Recovery
3. Setup automated backups
4. Configure connection pooling
5. Enable database webhooks for monitoring

### Migrations
```sql
-- Run any schema updates in Supabase SQL Editor
-- Keep track of migration versions
```

## Security Checklist

- [ ] All secrets in environment variables (not code)
- [ ] HTTPS enabled everywhere
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Supabase RLS policies active
- [ ] API keys rotated regularly
- [ ] Database backups automated
- [ ] Monitoring and alerts setup

## Monitoring

### Backend Monitoring
```javascript
// Add to backend/src/index.ts
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});
```

### Error Tracking
- Sentry for error tracking
- LogRocket for session replay
- Datadog for infrastructure monitoring

### Supabase Monitoring
- Enable database insights
- Setup alerts for high CPU/memory
- Monitor connection pool usage

## Performance Optimization

### Frontend
```bash
# Analyze bundle size
cd frontend
npm run build
npx vite-bundle-visualizer
```

### Backend
- Enable compression
- Add Redis caching
- Optimize database queries
- Use connection pooling

### Database
- Add indexes for frequent queries
- Enable query performance insights
- Optimize RLS policies

## Scaling Strategy

### Horizontal Scaling
- Backend: Multiple instances behind load balancer
- ML Service: Auto-scaling based on CPU
- Frontend: CDN handles this automatically

### Vertical Scaling
- Upgrade Supabase plan for more resources
- Increase container resources (CPU/RAM)

### Caching
```javascript
// Add Redis for caching
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache frequently accessed data
app.get('/api/v1/topics', async (req, res) => {
  const cached = await redis.get('topics');
  if (cached) return res.json(JSON.parse(cached));
  
  const topics = await getTopics();
  await redis.setex('topics', 3600, JSON.stringify(topics));
  res.json(topics);
});
```

## Backup Strategy

### Database
- Supabase automatic backups (daily)
- Manual backups before major changes
- Test restore procedures monthly

### Code
- Git repository (primary)
- GitHub/GitLab (remote)
- Regular tags for releases

## Rollback Plan

1. Keep previous Docker images
2. Tag releases in Git
3. Document rollback procedures
4. Test rollback in staging

### Quick Rollback
```bash
# Docker
docker-compose down
docker-compose up -d --build <previous-tag>

# Vercel
vercel rollback

# Railway
railway rollback
```

## Health Checks

### Backend
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### ML Service
```python
@app.route('/health')
def health():
    return jsonify({'status': 'ok'})
```

## Cost Optimization

### Estimated Monthly Costs (Low Traffic)
- Supabase Free Tier: $0
- Vercel Hobby: $0
- Railway Starter: $5
- OpenAI API: $10-50 (usage-based)
- **Total: ~$15-55/month**

### Estimated Monthly Costs (Medium Traffic)
- Supabase Pro: $25
- Vercel Pro: $20
- Railway Pro: $20
- OpenAI API: $100-200
- **Total: ~$165-265/month**

### Cost Reduction Tips
- Use caching to reduce OpenAI calls
- Optimize database queries
- Use CDN for static assets
- Monitor and set spending alerts

## Troubleshooting

### Common Issues

**CORS Errors**
- Check FRONTEND_URL in backend .env
- Verify CORS middleware configuration

**Database Connection Issues**
- Check Supabase project status
- Verify connection string
- Check RLS policies

**OpenAI Rate Limits**
- Implement request queuing
- Add retry logic with exponential backoff
- Upgrade OpenAI plan

**High Response Times**
- Add caching layer
- Optimize database queries
- Scale backend instances

## Post-Deployment

1. **Test all features**
   - User registration/login
   - Session creation
   - Question generation
   - Progress tracking

2. **Monitor for 24 hours**
   - Check error rates
   - Monitor response times
   - Watch resource usage

3. **Setup alerts**
   - Error rate > 5%
   - Response time > 2s
   - CPU > 80%
   - Memory > 80%

4. **Document**
   - Deployment date
   - Configuration used
   - Any issues encountered

## Support

For deployment issues:
1. Check service logs
2. Verify environment variables
3. Test health endpoints
4. Review monitoring dashboards
5. Check Supabase status page

## Maintenance

### Weekly
- Review error logs
- Check performance metrics
- Monitor costs

### Monthly
- Update dependencies
- Review security advisories
- Test backup restoration
- Optimize database

### Quarterly
- Security audit
- Performance review
- Cost optimization review
- Feature planning

---

**Deployment Checklist Complete! 🚀**

Your Socratic Learning Platform is ready for production.
