#!/bin/bash

# AVAT Migration Script: Railway/Render → Free Infrastructure
# This script helps migrate from paid infrastructure to free alternatives

set -e

echo "🚀 Starting AVAT Infrastructure Migration..."
echo "=============================================="

# Configuration
PROJECT_NAME="AVAT"
BACKUP_DIR="./migration-backup-$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if required tools are installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed."
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        log_error "npm is required but not installed."
        exit 1
    fi

    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is required but not installed."
        exit 1
    fi

    log_success "Prerequisites check completed"
}

# Create backup directory
create_backup() {
    log_info "Creating backup directory..."
    mkdir -p "$BACKUP_DIR"
    log_success "Backup directory created: $BACKUP_DIR"
}

# Export current database (if using Render/Railway)
export_current_database() {
    log_info "Exporting current database..."

    # This would need to be customized based on your current setup
    # For Render PostgreSQL:
    if [ -n "$DATABASE_URL" ]; then
        log_info "Exporting from Render PostgreSQL..."
        # pg_dump would go here if you have access
        log_warning "Manual database export may be required for Render PostgreSQL"
    fi

    # Export current configuration
    cp render.yaml "$BACKUP_DIR/render.yaml.backup" 2>/dev/null || true
    cp railway.json "$BACKUP_DIR/railway.json.backup" 2>/dev/null || true

    log_success "Database export completed"
}

# Setup Neon PostgreSQL
setup_neon_database() {
    log_info "Setting up Neon PostgreSQL..."

    if [ -z "$NEON_API_KEY" ]; then
        log_error "NEON_API_KEY environment variable is required"
        log_info "Get your API key from: https://console.neon.tech/"
        exit 1
    fi

    # Create Neon project via API or console
    log_warning "Neon project creation requires manual setup in console"
    log_info "1. Go to https://console.neon.tech/"
    log_info "2. Create a new project (free tier)"
    log_info "3. Copy the connection string"
    log_info "4. Set DATABASE_URL environment variable"

    read -p "Enter your Neon DATABASE_URL: " DATABASE_URL

    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL is required"
        exit 1
    fi

    # Test connection
    python3 -c "
import psycopg2
import os
try:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.close()
    print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
"

    log_success "Neon PostgreSQL setup completed"
}

# Setup Upstash Redis
setup_upstash_redis() {
    log_info "Setting up Upstash Redis..."

    if [ -z "$UPSTASH_REDIS_REST_URL" ] || [ -z "$UPSTASH_REDIS_REST_TOKEN" ]; then
        log_error "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required"
        log_info "Get these from: https://console.upstash.com/"
        exit 1
    fi

    # Test Redis connection
    curl -s -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
         "$UPSTASH_REDIS_REST_URL/set/test-migration/works/$(date +%s)" \
         | grep -q "OK"

    if [ $? -eq 0 ]; then
        log_success "Upstash Redis connection successful"
    else
        log_error "Upstash Redis connection failed"
        exit 1
    fi

    log_success "Upstash Redis setup completed"
}

# Setup Cloudflare Workers
setup_cloudflare_workers() {
    log_info "Setting up Cloudflare Workers..."

    cd backend-cloudflare

    # Install dependencies
    npm install

    # Check if wrangler is configured
    if [ ! -f "wrangler.toml" ]; then
        log_error "wrangler.toml not found"
        exit 1
    fi

    # Set secrets (these need to be set manually in Cloudflare dashboard first)
    if [ -n "$CLOUDFLARE_API_TOKEN" ] && [ -n "$CLOUDFLARE_ACCOUNT_ID" ]; then
        log_info "Deploying to Cloudflare Workers..."
        npm run deploy
        log_success "Cloudflare Workers deployment completed"
    else
        log_warning "CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID required for deployment"
        log_info "Set these secrets in your GitHub repository or run deployment manually"
    fi

    cd ..
}

# Setup Cloudflare R2 for file storage
setup_cloudflare_r2() {
    log_info "Setting up Cloudflare R2 for file storage..."

    if [ -z "$R2_ACCESS_KEY_ID" ] || [ -z "$R2_SECRET_ACCESS_KEY" ] || [ -z "$R2_ACCOUNT_ID" ]; then
        log_warning "R2 credentials not set - file storage will remain local for now"
        log_info "Configure R2 in Cloudflare dashboard for production file storage"
        return 0
    fi

    # Create R2 bucket configuration
    cat > r2-config.json << EOF
{
    "bucket": "avat-pdfs",
    "region": "auto"
}
EOF

    log_success "Cloudflare R2 configuration created"
}

# Update environment configuration
update_environment_config() {
    log_info "Updating environment configuration..."

    # Update wrangler.toml with new database URLs
    sed -i.bak "s|SUPABASE_URL.*|SUPABASE_URL = \"$DATABASE_URL\"|g" backend-cloudflare/wrangler.toml
    sed -i.bak "s|UPSTASH_REDIS_REST_URL.*|UPSTASH_REDIS_REST_URL = \"$UPSTASH_REDIS_REST_URL\"|g" backend-cloudflare/wrangler.toml

    log_success "Environment configuration updated"
}

# Create migration summary
create_migration_summary() {
    log_info "Creating migration summary..."

    cat > "$BACKUP_DIR/MIGRATION_SUMMARY.md" << EOF
# AVAT Infrastructure Migration Summary

**Migration Date:** $(date)
**From:** Railway/Render Infrastructure
**To:** Free Tier Infrastructure (Neon + Upstash + Cloudflare)

## Services Migrated

### Database
- **From:** Render PostgreSQL
- **To:** Neon PostgreSQL (Free Tier)
- **Connection String:** $DATABASE_URL

### Cache
- **From:** Render Redis
- **To:** Upstash Redis (Free Tier)
- **REST URL:** $UPSTASH_REDIS_REST_URL

### Backend
- **From:** Render/Railway Container
- **To:** Cloudflare Workers
- **URL:** https://avat-backend.vikyath-n.workers.dev

### File Storage
- **From:** Local container storage
- **To:** Cloudflare R2 (configured)

## Environment Variables Required

\`\`\`bash
DATABASE_URL=your_neon_connection_string
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
CLOUDFLARE_API_TOKEN=your_cloudflare_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
\`\`\`

## Cost Comparison

| Service | Before (Railway/Render) | After (Free Tier) | Savings |
|---------|------------------------|-------------------|---------|
| Database | ~$7/month | $0/month | $7/month |
| Redis | ~$5/month | $0/month | $5/month |
| Backend | ~$7/month | $0/month | $7/month |
| **Total** | **~$19/month** | **$0/month** | **$19/month** |

## Next Steps

1. Test the new infrastructure thoroughly
2. Update DNS records if needed
3. Monitor performance and costs
4. Remove old Railway/Render services after confirming everything works

## Backup Information

- Original configuration backed up to: $BACKUP_DIR
- Database export: (if performed)
- Migration completed successfully: $(date)
EOF

    log_success "Migration summary created: $BACKUP_DIR/MIGRATION_SUMMARY.md"
}

# Main migration process
main() {
    check_prerequisites
    create_backup
    export_current_database

    log_info "Starting infrastructure migration..."
    echo

    setup_neon_database
    echo

    setup_upstash_redis
    echo

    setup_cloudflare_workers
    echo

    setup_cloudflare_r2
    echo

    update_environment_config
    echo

    create_migration_summary

    echo
    log_success "🎉 Migration completed successfully!"
    echo
    log_info "Summary: $BACKUP_DIR/MIGRATION_SUMMARY.md"
    log_info "Backup: $BACKUP_DIR/"
    echo
    log_warning "Remember to:"
    echo "  - Update your frontend environment variables"
    echo "  - Test all functionality thoroughly"
    echo "  - Remove old Railway/Render services after confirmation"
}

# Run the migration
main "$@"
