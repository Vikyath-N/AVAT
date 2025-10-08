# AVAT Documentation

This directory contains all project documentation organized by category.

## Directory Structure

### 📦 `deployment/`
Deployment guides and infrastructure documentation:
- **DEPLOYMENT-FREE.md** - Free tier infrastructure setup (Cloudflare, Neon, etc.)
- **DEPLOYMENT.md** - Original deployment guide (Railway/Render)
- **DEPLOYMENT-FIXES.md** - Troubleshooting and fixes during deployment

### ⚙️ `setup/`
Setup and configuration guides:
- **GITHUB-SECRETS-SETUP.md** - GitHub Actions secrets configuration
- **NEON-SETUP-INSTRUCTIONS.md** - Neon PostgreSQL setup
- **NEON-FINAL-SETUP-INSTRUCTIONS.md** - Final Neon setup steps
- **NEON-PERMISSION-FIX.md** - Database permission fixes
- **OPTION-A-STEPS.md** - Option A implementation steps
- **QUICK-FIX-GUIDE.md** - Quick fixes for common issues

### 🛠️ `development/`
Development guides and status reports:
- **SCRAPER-STATUS-REPORT.md** - DMV scraper status and implementation
- **GITIGNORE-SECURITY-SUMMARY.md** - Security patterns in .gitignore
- **REAL-DATA-DEPLOYED.md** - Real data deployment summary
- **REAL-DATA-SETUP-SUMMARY.md** - Real data setup process

## Quick Links

- [Main README](../README.md) - Project overview
- [Deployment Guide](deployment/DEPLOYMENT-FREE.md) - Deploy to free infrastructure
- [Setup Guide](setup/GITHUB-SECRETS-SETUP.md) - Configure GitHub secrets
- [Development Status](development/REAL-DATA-DEPLOYED.md) - Current implementation status

## Contributing

When adding new documentation:
1. Place it in the appropriate subdirectory
2. Update this README with a brief description
3. Link to it from the main README if it's important
4. Use clear, descriptive filenames

