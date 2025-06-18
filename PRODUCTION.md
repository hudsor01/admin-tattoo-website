# Production Deployment - Ink 37 Tattoos Admin Dashboard

## 🚀 Quick Start

This admin dashboard is now production-ready! Follow these steps for deployment:

### 1. Pre-Deployment Verification
```bash
# Run comprehensive production verification
npm run verify:prod
```

### 2. Environment Setup
```bash
# Copy and configure production environment
cp .env.production.example .env.production
# Edit .env.production with your production values
```

### 3. Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 📊 Production Features

### ✅ Performance Optimizations
- **Prisma Client**: Optimized with `--no-engine` flag
- **Bundle Analysis**: Built-in bundle analyzer
- **Image Optimization**: WebP/AVIF formats, caching
- **CSS Optimization**: Production CSS minification
- **Code Splitting**: Automatic Next.js optimizations

### 🔒 Security Hardening
- **Security Headers**: HSTS, CSP, X-Frame-Options
- **HTTPS Enforcement**: Automatic in production
- **CSRF Protection**: Built-in middleware
- **Input Validation**: Zod schemas for all APIs
- **Rate Limiting**: API endpoint protection

### 🏥 Health Monitoring
- **Database Health**: `/api/health/database`
- **Application Health**: `/api/health`
- **Live Checks**: `/api/health/live`
- **Ready Checks**: `/api/health/ready`

### 📈 Production Scripts

```bash
# Full deployment pipeline
npm run deploy:full

# Health checks only
npm run health:prod

# Production optimization
npm run optimize:prod

# Prisma production setup
npm run prisma:migrate:prod

# Bundle analysis
npm run build:analyze
```

## 🐳 Docker Deployment

### Quick Docker Setup
```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Docker Build
```bash
# Build production image
docker build -t admin-dashboard .

# Run container
docker run -p 3000:3000 \
  --env-file .env.production \
  admin-dashboard
```

## 🌐 Deployment Platforms

### Vercel (Recommended)
- ✅ Zero-config deployment
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Built-in monitoring

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway up
```

### DigitalOcean App Platform
- Use the Dockerfile for deployment
- Set environment variables in DO dashboard
- Enable automatic deployments

### Traditional VPS/Server
```bash
# On server
git clone [your-repo]
cd admin-dash
npm ci --only=production
cp .env.production.example .env.production
# Configure .env.production
npm run deploy:full
npm run start:prod

# With PM2 process manager
npm install -g pm2
pm2 start npm --name "admin-dashboard" -- run start:prod
pm2 startup
pm2 save
```

## 🗄️ Database Setup

### PostgreSQL (Recommended)
```bash
# Production migration
npm run prisma:migrate:prod

# Seed with initial data (optional)
npm run db:seed
```

### Connection String Format
```
DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"
```

## 🔐 Environment Variables

### Required Variables
```env
DATABASE_URL="your-production-database-url"
AUTH_SECRET="secure-random-32-char-string"
AUTH_URL="https://yourdomain.com"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

### Optional Variables
```env
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
WEBHOOK_SECRET="webhook-security-secret"
```

## 📦 File Storage

### Vercel Blob (Recommended)
- Automatic CDN distribution
- Optimized for Next.js
- Simple API integration

### Alternative Options
- AWS S3
- Google Cloud Storage
- DigitalOcean Spaces

## 🔍 Monitoring & Alerts

### Health Check Endpoints
- `GET /api/health` - Overall system health
- `GET /api/health/database` - Database connectivity
- `GET /api/health/live` - Liveness probe
- `GET /api/health/ready` - Readiness probe

### Recommended Monitoring
- **Uptime**: Pingdom, UptimeRobot
- **Performance**: Vercel Analytics, Google PageSpeed
- **Errors**: Sentry, LogRocket
- **Database**: Built-in Prisma monitoring

## 🛠️ Maintenance

### Regular Tasks
```bash
# Update dependencies
npm update
npm audit fix

# Database maintenance
npm run prisma:migrate:prod

# Performance check
npm run build:analyze
```

### Backup Strategy
- Database: Automated PostgreSQL backups
- Media files: Vercel Blob automatic redundancy
- Configuration: Environment variables backup

## 🚨 Troubleshooting

### Common Issues

**Build Failures**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Database Connection Issues**
```bash
# Test database connection
npm run db:health
```

**OAuth Issues**
- Verify redirect URIs in Google Console
- Check AUTH_URL matches your domain
- Ensure HTTPS in production

**Performance Issues**
```bash
# Analyze bundle size
npm run build:analyze

# Check large assets
npm run optimize:prod
```

## 📞 Support

### Deployment Issues
1. Check deployment logs
2. Verify environment variables
3. Test health endpoints
4. Review error messages

### Performance Issues
1. Run bundle analysis
2. Check database queries
3. Monitor server resources
4. Review CDN caching

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run verify:prod
      - run: npm run deploy:full
```

## 🎯 Production Checklist

### Before Deployment
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] OAuth settings updated for production domain
- [ ] SSL certificate configured
- [ ] Health checks passing
- [ ] Bundle size optimized

### After Deployment
- [ ] Health endpoints responding
- [ ] Authentication working
- [ ] File uploads functional
- [ ] Database queries performing well
- [ ] Monitoring alerts configured
- [ ] Backup strategy implemented

---

🎉 **Congratulations!** Your Ink 37 Tattoos Admin Dashboard is production-ready!

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)