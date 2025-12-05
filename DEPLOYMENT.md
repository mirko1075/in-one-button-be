# OneButton Backend - Deployment Guide

This guide covers deploying the OneButton backend to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Render Deployment](#render-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Post-Deployment](#post-deployment)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- [ ] PostgreSQL database (Render, AWS RDS, or similar)
- [ ] Auth0 account and application configured
- [ ] Stripe account with API keys
- [ ] Deepgram API key
- [ ] SendGrid account and API key
- [ ] (Optional) Slack workspace with bot token
- [ ] Domain name (if using custom domain)

## Environment Setup

### 1. Create Production Environment File

Never commit `.env` to version control. Use environment variables in your hosting platform.

Required environment variables:

```env
NODE_ENV=production
PORT=8080

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.yourdomain.com
AUTH0_ISSUER=https://your-tenant.auth0.com/

# JWT (for local auth fallback)
JWT_SECRET=<generate-strong-random-string-32+chars>
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...

# Deepgram
DEEPGRAM_API_KEY=<your-deepgram-key>

# SendGrid
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=OneButton

# Slack (Optional)
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

# URLs
FRONTEND_URL=https://app.yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Security
CORS_ORIGINS=https://app.yourdomain.com,https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cron Jobs
ENABLE_CRON_JOBS=true
MEETING_RETENTION_DAYS=90

# Logging
LOG_LEVEL=info
```

### 2. Generate Secure Secrets

```bash
# Generate JWT secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database Setup

### Using Render PostgreSQL

1. Create a PostgreSQL database on Render
2. Copy the external database URL
3. Set `DATABASE_URL` environment variable
4. Ensure SSL is enabled: `?sslmode=require`

### Using AWS RDS

1. Create RDS PostgreSQL instance
2. Configure security group to allow access
3. Note connection details
4. Set `DATABASE_URL` with connection string

### Running Migrations

After database is created:

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://..."

# Run migrations
npm run prisma:migrate
```

## Render Deployment

### Method 1: Using Dockerfile (Recommended)

1. **Create Web Service on Render**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: onebutton-backend
   - **Environment**: Docker
   - **Region**: Choose closest to your users
   - **Branch**: main
   - **Dockerfile Path**: ./Dockerfile

3. **Environment Variables**
   - Add all variables from `.env.example`
   - Use Render's environment variable UI

4. **Health Check**
   - **Health Check Path**: `/api/health`
   - **Health Check Interval**: 30 seconds

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy

### Method 2: Using Build Commands

1. **Configure Build Settings**
   ```
   Build Command: npm install && npm run build && npm run prisma:generate
   Start Command: npm run prisma:migrate && npm start
   ```

2. **Set Node Version** (render.yaml)
   ```yaml
   services:
     - type: web
       name: onebutton-backend
       env: node
       buildCommand: npm install && npm run build && npm run prisma:generate
       startCommand: npm run prisma:migrate && npm start
       envVars:
         - key: NODE_VERSION
           value: 20.11.0
   ```

### Auto-Deploy

Render automatically deploys on push to main branch.

To disable auto-deploy:
- Go to Settings → Auto-Deploy
- Toggle off

## Docker Deployment

### Build Production Image

```bash
# Build image
docker build -t onebutton-backend:latest .

# Tag for registry
docker tag onebutton-backend:latest registry.example.com/onebutton-backend:latest

# Push to registry
docker push registry.example.com/onebutton-backend:latest
```

### Run Container

```bash
docker run -d \
  --name onebutton-backend \
  -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e STRIPE_SECRET_KEY="sk_..." \
  -e AUTH0_DOMAIN="..." \
  --restart unless-stopped \
  onebutton-backend:latest
```

### Docker Compose Production

```yaml
version: '3.8'

services:
  app:
    image: onebutton-backend:latest
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      # ... other env vars
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: onebutton-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: onebutton-backend
  template:
    metadata:
      labels:
        app: onebutton-backend
    spec:
      containers:
      - name: onebutton-backend
        image: onebutton-backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: onebutton-secrets
              key: database-url
        # ... other env vars
        livenessProbe:
          httpGet:
            path: /api/health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check health endpoint
curl https://api.yourdomain.com/api/health

# Expected response:
{
  "success": true,
  "message": "OneButton API is running",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### 2. Test API Endpoints

```bash
# Test registration
curl -X POST https://api.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

### 3. Configure Stripe Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://api.yourdomain.com/api/billing/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret
5. Set `STRIPE_WEBHOOK_SECRET` environment variable
6. Redeploy

### 4. Configure CORS

Update `CORS_ORIGINS` environment variable with your frontend URLs:

```env
CORS_ORIGINS=https://app.yourdomain.com,https://yourdomain.com
```

### 5. Set Up SSL Certificate

Render provides automatic SSL certificates. For custom domains:

1. Add custom domain in Render dashboard
2. Add DNS records (Render will provide details)
3. Wait for SSL certificate to provision

## Monitoring

### Application Logs

```bash
# View logs on Render
# Dashboard → Service → Logs tab

# Docker logs
docker logs -f onebutton-backend

# Kubernetes logs
kubectl logs -f deployment/onebutton-backend
```

### Health Checks

Set up monitoring service (e.g., UptimeRobot, Pingdom):
- URL: `https://api.yourdomain.com/api/health`
- Interval: 5 minutes
- Alert on failures

### Database Monitoring

- Monitor connection pool usage
- Set up alerts for high query times
- Monitor disk space

### Error Tracking

Integrate error tracking service:
- Sentry
- Rollbar
- LogRocket

### Performance Monitoring

- Monitor response times
- Track API endpoint usage
- Monitor WebSocket connections

## Troubleshooting

### Application Won't Start

1. Check logs for errors
2. Verify all environment variables are set
3. Ensure database is accessible
4. Check Prisma migrations ran successfully

### Database Connection Errors

```bash
# Test database connection
npx prisma db pull

# If fails, check:
# - DATABASE_URL format
# - Database is accessible from deployment
# - SSL mode is correct (?sslmode=require)
# - Firewall rules allow connection
```

### Stripe Webhook Failures

1. Verify webhook endpoint is accessible
2. Check `STRIPE_WEBHOOK_SECRET` is correct
3. Test webhook in Stripe Dashboard
4. Check application logs for webhook errors

### High Memory Usage

- Increase container memory limit
- Check for memory leaks
- Review cron job schedules
- Monitor active WebSocket connections

### Slow Response Times

- Check database query performance
- Enable query logging
- Review N+1 queries
- Add database indexes
- Consider caching layer (Redis)

## Scaling

### Horizontal Scaling

1. **Render**: Increase number of instances in dashboard
2. **Docker**: Use container orchestration (Kubernetes, Docker Swarm)
3. **Load Balancer**: Configure load balancer for multiple instances

### Database Scaling

1. Upgrade database instance size
2. Add read replicas
3. Implement connection pooling
4. Consider caching frequently accessed data

### WebSocket Scaling

For multiple instances with WebSocket:
- Use Redis adapter for Socket.io
- Configure sticky sessions on load balancer

## Backup & Recovery

### Database Backups

1. Enable automated backups (Render provides daily backups)
2. Test restore process
3. Keep backups for at least 30 days

### Application Backups

- Tag Docker images with version numbers
- Keep previous versions for rollback
- Document rollback procedure

### Disaster Recovery Plan

1. Document all environment variables
2. Keep secrets in secure vault
3. Have rollback procedure ready
4. Test recovery process regularly

## Security Checklist

- [ ] All secrets stored securely (not in code)
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Stripe webhooks signature verified
- [ ] Auth0 properly configured
- [ ] Database access restricted
- [ ] Logs don't contain sensitive data
- [ ] Dependencies regularly updated
- [ ] Security headers configured (Helmet)
- [ ] Input validation enabled

## Performance Optimization

1. **Enable Compression**: Already enabled in app.ts
2. **Database Indexes**: Ensure all foreign keys indexed
3. **Caching**: Consider Redis for session storage
4. **CDN**: Use CDN for static assets (if any)
5. **Monitoring**: Set up APM (Application Performance Monitoring)

## Maintenance

### Regular Tasks

- **Weekly**: Review error logs
- **Monthly**: Update dependencies
- **Quarterly**: Security audit
- **Yearly**: Review and update documentation

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Run tests
npm test

# Deploy
```

## Support

For deployment issues:
1. Check logs first
2. Review this documentation
3. Open GitHub issue
4. Contact support
