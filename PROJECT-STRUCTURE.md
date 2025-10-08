# AVAT Project Structure

## 📁 Directory Organization

```
AVAT/
│
├── 📚 docs/                          Documentation
│   ├── deployment/                   Deployment guides
│   │   ├── DEPLOYMENT-FREE.md        Free infrastructure setup
│   │   ├── DEPLOYMENT.md             Original deployment guide
│   │   └── DEPLOYMENT-FIXES.md       Troubleshooting guide
│   ├── setup/                        Configuration guides
│   │   ├── GITHUB-SECRETS-SETUP.md   GitHub Actions secrets
│   │   ├── NEON-*.md                 Database setup guides
│   │   └── QUICK-FIX-GUIDE.md        Quick fixes
│   ├── development/                  Development docs
│   │   ├── SCRAPER-STATUS-REPORT.md  Scraper implementation
│   │   ├── REAL-DATA-DEPLOYED.md     Real data setup
│   │   └── GITIGNORE-SECURITY-SUMMARY.md
│   └── README.md                     Documentation index
│
├── 🔧 local/                         Local development (gitignored)
│   ├── databases/                    SQLite databases
│   │   ├── enhanced_accidents.db
│   │   └── urls.db
│   ├── sql/                          SQL scripts
│   │   ├── neon-schema-corrected.sql
│   │   ├── neon-complete-setup-full.sql
│   │   └── database-schema.sql
│   ├── test-data/                    Test files
│   ├── scripts/                      Local Python scripts
│   │   ├── enhanced_data_pipeline.py
│   │   ├── extraction.py
│   │   ├── url_storage.py
│   │   └── web_scraping_DMV.py
│   └── README.md                     Local dev guide
│
├── 🏗️ infrastructure/                Infrastructure configs
│   ├── docker/                       Docker files
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   ├── deployment/                   Legacy configs
│   │   ├── railway.json              (Railway - deprecated)
│   │   ├── render.yaml               (Render - deprecated)
│   │   └── render-cli-install.sh
│   └── README.md                     Infrastructure guide
│
├── 🛠️ scripts/                       Utility scripts
│   ├── scrape/                       DMV scraping scripts
│   │   ├── full-sync.sh
│   │   ├── sync-index.sh
│   │   └── sync-pdfs.sh
│   ├── test/                         Testing scripts
│   │   ├── api_smoke.sh
│   │   ├── integration.sh
│   │   └── unit.sh
│   └── test-*.sh                     Various test scripts
│
├── ⚛️ frontend/                      React frontend
│   ├── public/                       Static assets
│   ├── src/                          Source code
│   │   ├── components/               React components
│   │   ├── pages/                    Page components
│   │   ├── services/                 API services
│   │   ├── hooks/                    Custom hooks
│   │   └── types/                    TypeScript types
│   ├── build/                        Production build
│   ├── package.json
│   └── tsconfig.json
│
├── 🐍 backend/                       Python/FastAPI backend
│   ├── api/                          API routes
│   │   ├── accidents.py
│   │   ├── analytics.py
│   │   └── reports.py
│   ├── models/                       Data models
│   ├── services/                     Business logic
│   │   ├── data_service.py
│   │   ├── cache_service.py
│   │   └── dmv_scraper_service.py
│   ├── utils/                        Utilities
│   │   ├── database.py
│   │   ├── migrations.py
│   │   └── pdf_parser.py
│   ├── tests/                        Unit tests
│   └── main.py                       FastAPI app
│
├── ☁️ backend-cloudflare/            Cloudflare Workers
│   ├── src/                          Worker source code
│   │   ├── index.js                  Main worker
│   │   ├── mcp-client.js             MCP client
│   │   └── storage.js                R2 storage
│   ├── wrangler.toml                 Cloudflare config
│   ├── package.json
│   └── README.md                     Worker docs
│
├── 📄 data/                          Data files
│   └── pdfs/                         DMV PDF reports
│       └── 2025/                     Organized by year
│           ├── Waymo/
│           ├── Zoox/
│           ├── Nuro/
│           └── ...
│
├── 🔄 .github/                       GitHub workflows
│   └── workflows/
│       ├── deploy.yml                Frontend deployment
│       ├── deploy-cloudflare.yml     Backend deployment
│       ├── schedule_scrape.yml       Daily scraper
│       └── complete-deployment.yml   Full pipeline
│
├── 📋 Configuration Files
│   ├── .gitignore                    Git ignore patterns
│   ├── .env.example.free             Environment template
│   ├── .neon                         Neon project config
│   ├── pyproject.toml                Python project config
│   ├── requirements.txt              Python dependencies
│   ├── requirements-test.txt         Test dependencies
│   └── apt.txt                       System packages
│
├── 📖 README.md                      Main project README
├── 📝 REORGANIZATION-PLAN.md         This reorganization plan
└── 📊 PROJECT-STRUCTURE.md           Directory structure (this file)
```

## 🎯 Key Principles

### 1. Separation of Concerns
- **Production code**: `frontend/`, `backend/`, `backend-cloudflare/`
- **Documentation**: `docs/`
- **Local development**: `local/` (gitignored)
- **Infrastructure**: `infrastructure/`
- **Utilities**: `scripts/`

### 2. Gitignore Strategy
- **`local/`** - Entire directory ignored (databases, SQL, test data)
- **`docs/`** - Version controlled (safe documentation)
- **`infrastructure/`** - Version controlled (configs only)

### 3. Documentation Organization
- **deployment/** - How to deploy
- **setup/** - How to configure
- **development/** - Development status and guides

### 4. Clean Root Directory
Only essential configuration files in root:
- Package management: `package.json`, `pyproject.toml`, `requirements.txt`
- Git: `.gitignore`
- Environment: `.env.example.free`, `.neon`
- Documentation: `README.md`

## 🚀 Quick Start

1. **Clone and setup:**
   ```bash
   git clone <repo>
   cd AVAT
   cp .env.example.free .env  # Edit with your values
   ```

2. **Frontend development:**
   ```bash
   cd frontend
   pnpm install
   pnpm start
   ```

3. **Backend development:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r ../requirements.txt
   python main.py
   ```

4. **Cloudflare Workers:**
   ```bash
   cd backend-cloudflare
   npm install
   npm run dev
   ```

## 📚 Documentation Links

- [Main README](README.md) - Project overview
- [Deployment Guide](docs/deployment/DEPLOYMENT-FREE.md) - Free tier setup
- [Setup Guide](docs/setup/GITHUB-SECRETS-SETUP.md) - Configuration
- [Infrastructure](infrastructure/README.md) - Infrastructure details
- [Local Development](local/README.md) - Local dev guide

## 🔒 Security

- All sensitive files in `local/` (gitignored)
- Database credentials in environment variables only
- GitHub secrets for CI/CD
- Cloudflare secrets for Workers

## 💡 Benefits of This Structure

1. ✅ **Clean root directory** - Easy to navigate
2. ✅ **Organized documentation** - Easy to find guides
3. ✅ **Separated concerns** - Clear boundaries
4. ✅ **Gitignore-friendly** - No accidental commits
5. ✅ **Production-ready** - Professional organization
6. ✅ **Scalable** - Easy to add new components
