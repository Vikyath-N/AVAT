# 🚀 AVAT Deployment Guide

## 🔐 Environment Configuration

### Mapbox Tokens

**Important Security Note**: Never commit API keys to version control!

#### Token Types:
- **Secret Token (sk.)**: Server-side only, never expose in frontend
- **Public Token (pk.)**: Client-side safe, can be used in frontend applications

#### Current Setup:
- **Development**: Uses public token in `.env` file
- **Production**: Uses GitHub secret for secure deployment

### 🛠️ Local Development Setup

1. **Copy environment template:**
```bash
cd frontend
cp .env.example .env
```

2. **Update with your tokens:**
```bash
# Edit .env file
REACT_APP_MAPBOX_TOKEN=pk.your_public_token_here
```

3. **Start development servers:**
```bash
# Backend
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (new terminal)
cd frontend
npm start
```

## 🌐 Production Deployment

### Cloudflare Pages (Current)

The application is automatically deployed to Cloudflare Pages via GitHub Actions using PNPM and environment-secret driven runtime config.

**Live URL**: https://avat-frontend.pages.dev/
**Custom Domain**: https://avat.vikyath.dev/ (after DNS setup)

#### Deployment Triggers:
- Push to `main` branch
- Pull requests validate build

#### Environment Variables (GitHub Secrets):
- `MAPBOX_TOKEN`: Mapbox public token
- `PROD_API_BASE_URL`: e.g. https://api.avat.vikyath.dev/api/v1
- `PROD_WS_URL`: e.g. wss://api.avat.vikyath.dev/ws
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with Pages permissions
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID

#### GitHub Actions Details

- Workflow: `.github/workflows/complete-deployment.yml`
- Tooling: PNPM + `react-scripts` build
- Project Name: `avat-frontend` (configured in Cloudflare)
- Build Configuration:
  - Build command: `pnpm run build`
  - Build output directory: `build`
  - Root directory: `frontend`

Key steps:
```yaml
jobs:
  deploy-frontend:
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install Dependencies 🔧
        working-directory: ./frontend
        run: pnpm install --no-frozen-lockfile
      - name: Build Application 🏗️
        working-directory: ./frontend
        run: pnpm run build
        env:
          REACT_APP_API_BASE_URL: ${{ secrets.PROD_API_BASE_URL }}
          REACT_APP_WS_URL: ${{ secrets.PROD_WS_URL }}
          REACT_APP_MAPBOX_TOKEN: ${{ secrets.MAPBOX_TOKEN }}
          REACT_APP_BASENAME: /
          CI: false
      - name: Deploy to Cloudflare Pages 🚀
        run: npx wrangler pages deploy build --project-name avat-frontend
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### 🔄 Manual Deployment

```bash
# Build and deploy frontend to Cloudflare Pages
cd frontend
pnpm run build

# Deploy to Cloudflare Pages (requires CLOUDFLARE_API_TOKEN)
npx wrangler pages deploy build --project-name avat-frontend
```

### 🌐 Custom Domain Setup

To use your custom domain `avat.vikyath.dev` instead of the default `pages.dev` URL:

1. **Add Custom Domain in Cloudflare Pages Dashboard:**
   - Go to Cloudflare Pages → avat-frontend → Custom domains
   - Click "Set up custom domain"
   - Enter: `avat.vikyath.dev`
   - Choose "Add domain"

2. **Update DNS Records:**
   - In your DNS provider, add CNAME record:
   - Name: `avat.vikyath.dev`
   - Value: `avat-frontend.pages.dev`
   - TTL: 300 seconds

3. **Environment Variables Update:**
   - Update `REACT_APP_BASENAME` to `/` (no longer needs `/AVAT`)
   - The app will be available at both:
     - https://avat-frontend.pages.dev/
     - https://avat.vikyath.dev/

## 🏗️ Full Stack Deployment Options

### Option 1: Heroku (Legacy example)
```bash
# Backend deployment
heroku create avat-backend
git subtree push --prefix backend heroku main

# Update frontend environment
REACT_APP_API_BASE_URL=https://<your-heroku-app>.herokuapp.com/api/v1
```

### Option 2: Railway
```bash
# Connect GitHub repo to Railway
# Set environment variables in Railway dashboard
# Automatic deployments on push
```

### Option 3: Vercel + Supabase
```bash
# Frontend to Vercel
vercel --prod

# Database to Supabase
# Update connection strings
```

## 🔁 Backend Deployment (Local/Dev)

The backend is not deployed via Pages. Run locally or deploy to a host of your choice.

```bash
# Install deps
pip install -r requirements.txt

# Run migrations
cd backend
python -c "from utils.migrations import run_migrations; run_migrations()"

# Start API with reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Scheduler: APScheduler starts automatically at app startup and schedules DMV sync jobs (03:00/03:10 UTC by default).

Health endpoint exposes last scrape run: `GET /api/v1/health`.

## 📊 Performance Optimization

### Frontend Bundle Analysis
```bash
cd frontend
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

### Current Bundle Sizes:
- **Main Bundle**: 434.49 kB (gzipped)
- **Vendor Bundle**: 255.9 kB
- **CSS**: 11.57 kB

### Optimization Strategies:
1. **Code Splitting**: Lazy load routes
2. **Tree Shaking**: Remove unused imports
3. **Image Optimization**: WebP format
4. **CDN**: Use for static assets

## 🔍 Monitoring & Analytics

### Recommended Tools:
- **Performance**: Lighthouse, Web Vitals
- **Errors**: Sentry, LogRocket
- **Analytics**: Google Analytics, Mixpanel
- **Uptime**: Pingdom, UptimeRobot

### Setup Example:
```typescript
// Add to frontend/src/utils/analytics.ts
import { analytics } from './analytics-config';

export const trackEvent = (eventName: string, properties: any) => {
  analytics.track(eventName, properties);
};
```

## 🔒 Security Considerations

### Frontend Security:
- ✅ Environment variables properly configured
- ✅ No sensitive data in client bundle
- ✅ HTTPS enforced on Cloudflare Pages (automatic)
- ✅ Content Security Policy headers
- ✅ DDoS protection via Cloudflare
- ✅ Global CDN for performance and security

### Backend Security (Future):
- [ ] JWT authentication
- [ ] Rate limiting
- [ ] CORS configuration
- [ ] Input validation
- [ ] SQL injection prevention

## 📋 Deployment Checklist

### Pre-deployment:
- [ ] Environment variables set
- [ ] Build passes without errors
- [ ] Tests pass (when implemented)
- [ ] Linting passes
- [ ] Security scan completed

### Post-deployment:
- [ ] Application loads correctly
- [ ] Maps render with data
- [ ] API endpoints respond
- [ ] Real-time features work
- [ ] Mobile responsive
- [ ] Performance metrics acceptable

## 🚨 Troubleshooting

### Common Issues:

#### 1. Map Not Loading
```bash
# Check Mapbox token
console.log(process.env.REACT_APP_MAPBOX_TOKEN)

# Verify token permissions on Mapbox dashboard
```

#### 2. Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for dependency conflicts
npm ls
```

Additional CI gotchas:
- `ERR_PNPM_NO_LOCKFILE`: Use `pnpm install --no-frozen-lockfile` in CI.
- Missing `public/index.html`: Ensure `frontend/public/index.html` is committed and not ignored. `.gitignore` should allow `frontend/public/**`.
- gh-pages push error (exit code 128): Ensure `permissions: contents: write` is set in workflow.

#### 3. Deployment Issues
```bash
# Check GitHub Actions logs
gh run list
gh run view <run-id>

# Check Cloudflare Pages deployment
npx wrangler pages deployment list --project-name avat-frontend

# Verify Cloudflare Pages project settings
npx wrangler pages project list
```

## 📞 Support

For deployment issues:
- **GitHub Issues**: [Create Issue](https://github.com/vikyath/AVAT/issues)
- **Discussions**: [GitHub Discussions](https://github.com/vikyath/AVAT/discussions)
- **Documentation**: [Wiki](https://github.com/vikyath/AVAT/wiki)

---

**Last Updated**: September 2025
**Version**: 2.1.0

---
**Recent Changes**:
- ✅ Migrated from GitHub Pages to Cloudflare Pages for superior performance
- ✅ Updated deployment pipeline for Cloudflare Pages integration
- ✅ Enhanced security with Cloudflare DDoS protection and global CDN
- ✅ Improved build configuration for Pages deployment
