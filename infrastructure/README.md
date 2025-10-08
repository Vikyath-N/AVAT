# Infrastructure & Deployment Configuration

Infrastructure-as-Code and deployment configuration files for AVAT.

## Directory Structure

### 🐳 `docker/`
Docker and containerization:
- **Dockerfile** - Container image definition
- **docker-compose.yml** - Multi-container orchestration

### 🚀 `deployment/`
Legacy deployment configurations:
- **railway.json** - Railway.app configuration (legacy)
- **render.yaml** - Render.com configuration (legacy)
- **render-cli-install.sh** - Render CLI installation script

## Current Infrastructure Stack

### Production (Free Tier)
- **Frontend:** GitHub Pages
  - URL: https://vikyath-n.github.io/AVAT/
  - Deploy: Automatic via `.github/workflows/deploy.yml`
  
- **Backend:** Cloudflare Workers
  - URL: https://avat-backend.v-naradasi.workers.dev/
  - Config: `backend-cloudflare/wrangler.toml`
  - Deploy: Automatic via `.github/workflows/deploy-cloudflare.yml`
  
- **Database:** Neon PostgreSQL
  - Free tier: 512MB storage
  - Connection pooling enabled
  
- **Cache:** Upstash Redis
  - Free tier: 10,000 commands/day
  
- **Storage:** Cloudflare R2
  - Free tier: 10GB storage

### Docker (Optional)
For local development or self-hosting:

```bash
# Build and run locally
docker-compose up --build

# Production build
docker build -t avat:latest .
docker run -p 8000:8000 avat:latest
```

## Migration Guide

### From Railway/Render to Free Infrastructure

See [docs/deployment/DEPLOYMENT-FREE.md](../docs/deployment/DEPLOYMENT-FREE.md) for detailed migration guide.

**Key Changes:**
1. FastAPI backend → Cloudflare Workers
2. PostgreSQL (Railway) → Neon PostgreSQL
3. Railway deployment → GitHub Actions + Cloudflare

## Deployment Workflows

### Automatic Deployment (Recommended)
Push to `main` branch triggers:
1. Frontend build and deploy to GitHub Pages
2. Backend deploy to Cloudflare Workers
3. Health checks on all services

### Manual Deployment

**Frontend:**
```bash
cd frontend
pnpm install
pnpm run build
npx wrangler pages deploy build --project-name avat-frontend
```

**Backend:**
```bash
cd backend-cloudflare
npm install
npm run deploy
```

## Configuration

### Environment Variables
See `.env.example.free` in project root for all required environment variables.

### Secrets Management
- **GitHub Secrets:** Required for CI/CD (see docs/setup/GITHUB-SECRETS-SETUP.md)
- **Cloudflare Secrets:** Set via dashboard or `wrangler secret put`
- **Neon:** Connection string in Cloudflare Worker environment

## Monitoring

- **Frontend:** GitHub Pages status
- **Backend:** Cloudflare Workers analytics dashboard
- **Database:** Neon console
- **Cache:** Upstash console

## Costs

Current infrastructure: **$0/month** (all free tiers)

Previous (Railway/Render): ~$19/month

## Support

For deployment issues, see:
- [Deployment Fixes](../docs/deployment/DEPLOYMENT-FIXES.md)
- [Setup Guides](../docs/setup/)

