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

### GitHub Pages (Current)

The application is automatically deployed to GitHub Pages via GitHub Actions.

**Live URL**: https://vikyath-n.github.io/AVAT/

#### Deployment Triggers:
- Push to `main` branch
- Manual workflow dispatch

#### Environment Variables (GitHub Secrets):
- `MAPBOX_TOKEN`: Your Mapbox public token
- `GITHUB_TOKEN`: Automatically provided by GitHub

### 🔄 Manual Deployment

```bash
# Build and deploy frontend
cd frontend
npm run build
npm run deploy
```

## 🏗️ Full Stack Deployment Options

### Option 1: Heroku
```bash
# Backend deployment
heroku create avat-backend
git subtree push --prefix backend heroku main

# Update frontend environment
REACT_APP_API_BASE_URL=https://avat-backend.herokuapp.com/api/v1
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
- ✅ HTTPS enforced on GitHub Pages
- ✅ Content Security Policy headers

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

#### 3. Deployment Issues
```bash
# Check GitHub Actions logs
gh run list
gh run view <run-id>

# Verify GitHub Pages settings
```

## 📞 Support

For deployment issues:
- **GitHub Issues**: [Create Issue](https://github.com/vikyath/AVAT/issues)
- **Discussions**: [GitHub Discussions](https://github.com/vikyath/AVAT/discussions)
- **Documentation**: [Wiki](https://github.com/vikyath/AVAT/wiki)

---

**Last Updated**: December 2024
**Version**: 2.0.0
