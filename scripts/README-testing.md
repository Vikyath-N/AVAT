# 🧪 Cloudflare Deployment Testing Suite

This directory contains comprehensive test scripts for validating your Cloudflare free infrastructure deployment.

## 📋 Test Scripts Overview

### 1. `test-cloudflare-deployment.sh` - Production Testing
**Purpose**: Comprehensive testing of your deployed Cloudflare infrastructure
**When to use**: After deployment, for health checks, monitoring

**Tests Include**:
- ✅ Cloudflare Pages deployment
- ✅ Cloudflare Workers deployment  
- ✅ Neon PostgreSQL database connectivity
- ✅ Upstash Redis cache connectivity
- ✅ Cloudflare R2 file storage
- ✅ API integration and functionality
- ✅ Performance benchmarks
- ✅ Security configurations
- ✅ Monitoring and observability
- ✅ Cron triggers
- ✅ Frontend-backend integration

### 2. `test-cloudflare-local.sh` - Local Development Testing
**Purpose**: Validate local development setup before deployment
**When to use**: During development, before pushing changes

**Tests Include**:
- ✅ Frontend build process
- ✅ Backend development server
- ✅ Environment configuration
- ✅ Database connectivity
- ✅ Code quality (linting)
- ✅ Deployment readiness

### 3. `test-cloudflare-ci.sh` - CI/CD Pipeline Testing
**Purpose**: Automated testing for GitHub Actions deployment pipeline
**When to use**: In CI/CD workflows, automated deployments

**Tests Include**:
- ✅ GitHub Actions workflow validation
- ✅ Environment secrets verification
- ✅ Deployment pipeline endpoints
- ✅ API functionality
- ✅ Performance benchmarks
- ✅ Security headers
- ✅ Error handling

## 🚀 Quick Start

### Run Production Tests
```bash
# Test your deployed infrastructure
./scripts/test-cloudflare-deployment.sh
```

### Run Local Development Tests
```bash
# Test local setup before deployment
./scripts/test-cloudflare-local.sh
```

### Run CI/CD Tests
```bash
# Test in CI/CD pipeline
./scripts/test-cloudflare-ci.sh
```

## ⚙️ Configuration

### Environment Variables
The scripts use these environment variables (set in your `.env` files or CI environment):

```bash
# Production URLs
FRONTEND_URL="https://7309ac14.avat-frontend.pages.dev"
BACKEND_URL="https://avat-backend.vikyath.workers.dev"
CUSTOM_DOMAIN="https://avat.vikyath.dev"

# Database
DATABASE_URL="postgresql://user:pass@host/db"

# Cache
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_token"

# Storage
R2_BUCKET_URL="https://your-bucket.r2.dev"

# CI/CD
CLOUDFLARE_API_TOKEN="your_api_token"
CLOUDFLARE_ACCOUNT_ID="your_account_id"
MAPBOX_TOKEN="your_mapbox_token"
```

### Prerequisites
```bash
# Install required tools
npm install -g wrangler
npm install -g pnpm

# For local testing
brew install jq  # macOS
# or
sudo apt-get install jq  # Ubuntu
```

## 📊 Test Results

### Success Criteria
- **Production Tests**: 100% pass rate for critical endpoints
- **Local Tests**: All build and configuration tests pass
- **CI Tests**: All automated pipeline tests pass

### Test Categories

#### 🟢 Critical Tests (Must Pass)
- Health endpoint accessibility
- Database connectivity
- Cache connectivity
- API response format
- Security headers

#### 🟡 Performance Tests (Should Pass)
- Response time < 2 seconds
- Concurrent request handling
- Build time < 5 minutes

#### 🔵 Optional Tests (Nice to Have)
- Custom domain configuration
- Advanced monitoring
- Rate limiting

## 🛠️ Troubleshooting

### Common Issues

#### 1. Database Connection Failures
```bash
# Check Neon connection string
echo $DATABASE_URL

# Test direct connection
psql "$DATABASE_URL" -c "SELECT 1;"
```

#### 2. Cache Connection Issues
```bash
# Test Upstash Redis
curl -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
     "$UPSTASH_REDIS_REST_URL/get/test"
```

#### 3. Frontend Build Failures
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm run build
```

#### 4. Backend Deployment Issues
```bash
# Check wrangler configuration
cd backend-cloudflare
wrangler dev --dry-run
wrangler deployments list
```

### Debug Mode
Run tests with verbose output:
```bash
# Enable debug mode
export DEBUG=1
./scripts/test-cloudflare-deployment.sh
```

## 📈 Monitoring Integration

### GitHub Actions Integration
Add to your `.github/workflows/complete-deployment.yml`:

```yaml
- name: Run Deployment Tests
  run: |
    chmod +x scripts/test-cloudflare-ci.sh
    ./scripts/test-cloudflare-ci.sh
```

### Health Check Endpoint
Monitor your deployment with:
```bash
curl https://avat-backend.vikyath.workers.dev/api/v1/health
```

### Automated Monitoring
Set up monitoring with:
- **Uptime monitoring**: Ping your health endpoint every 5 minutes
- **Performance monitoring**: Track response times
- **Error tracking**: Monitor failed requests

## 🔄 Continuous Testing

### Pre-deployment
```bash
# Run before pushing changes
./scripts/test-cloudflare-local.sh
```

### Post-deployment
```bash
# Run after deployment
./scripts/test-cloudflare-deployment.sh
```

### Scheduled Testing
```bash
# Add to cron for regular health checks
0 */6 * * * /path/to/scripts/test-cloudflare-deployment.sh
```

## 📝 Customization

### Adding New Tests
1. Edit the appropriate test script
2. Add your test function following the existing pattern
3. Update the main function to include your test
4. Document the new test in this README

### Test Configuration
Modify test parameters in the script headers:
```bash
# Configuration section
FRONTEND_URL="your-frontend-url"
BACKEND_URL="your-backend-url"
CONCURRENT_REQUESTS=10
TIMEOUT_SECONDS=30
```

## 🎯 Best Practices

### Test Coverage
- Test all critical user journeys
- Validate error handling paths
- Check performance under load
- Verify security configurations

### Test Maintenance
- Update tests when adding new features
- Review and update test data regularly
- Monitor test execution times
- Document test failures and resolutions

### Integration Testing
- Test frontend-backend integration
- Validate database queries
- Check cache behavior
- Verify file storage operations

---

**Last Updated**: September 2025  
**Version**: 1.0.0  
**Compatibility**: Cloudflare Pages + Workers + Neon + Upstash
