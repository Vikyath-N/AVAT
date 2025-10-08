#!/bin/bash

# 🧪 Cloudflare Local Development Test Script
# Tests local development setup before deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOCAL_FRONTEND_URL="http://localhost:3000"
LOCAL_BACKEND_URL="http://localhost:8787"

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_test() {
    echo -e "\n${BLUE}🧪 Testing: $1${NC}"
    ((TESTS_TOTAL++))
}

# Test function wrapper
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    log_test "$test_name"
    
    if eval "$test_command"; then
        log_success "$test_name passed"
        return 0
    else
        log_error "$test_name failed"
        return 1
    fi
}

# Check if required tools are installed
check_prerequisites() {
    log_info "Checking local development prerequisites..."
    
    local tools=("node" "npm" "pnpm" "wrangler")
    
    for tool in "${tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            log_success "$tool is installed"
        else
            log_error "$tool is not installed"
            echo "Please install $tool before running tests"
            exit 1
        fi
    done
}

# Test frontend local build
test_frontend_build() {
    log_info "Testing frontend local build..."
    
    cd frontend
    
    # Test dependencies installation
    run_test "Frontend dependencies" "pnpm install --frozen-lockfile"
    
    # Test build process
    run_test "Frontend build" "pnpm run build"
    
    # Test build output exists
    run_test "Build output directory" "[ -d 'build' ]"
    
    # Test build files exist
    run_test "Build index.html" "[ -f 'build/index.html' ]"
    run_test "Build static assets" "[ -d 'build/static' ]"
    
    cd ..
}

# Test backend local development
test_backend_local() {
    log_info "Testing backend local development..."
    
    cd backend-cloudflare
    
    # Test dependencies installation
    run_test "Backend dependencies" "npm install"
    
    # Test wrangler configuration
    run_test "Wrangler configuration" "[ -f 'wrangler.toml' ]"
    
    # Test source files exist
    run_test "Source files exist" "[ -f 'src/index.js' ]"
    
    # Test environment variables (if .env exists)
    if [ -f ".env" ]; then
        run_test "Environment variables" "source .env && [ -n \"\$DATABASE_URL\" ]"
    else
        log_warning "No .env file found in backend-cloudflare"
    fi
    
    cd ..
}

# Test local development servers
test_local_servers() {
    log_info "Testing local development servers..."
    
    # Start backend server in background
    cd backend-cloudflare
    log_info "Starting backend server..."
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    sleep 5
    
    # Test backend health endpoint
    run_test "Backend health endpoint" "curl -s '$LOCAL_BACKEND_URL/api/v1/health' | grep -q 'healthy'"
    
    # Start frontend server in background
    cd frontend
    log_info "Starting frontend server..."
    pnpm start &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for frontend to start
    sleep 10
    
    # Test frontend accessibility
    run_test "Frontend accessibility" "curl -s -o /dev/null -w '%{http_code}' '$LOCAL_FRONTEND_URL' | grep -q '200'"
    
    # Clean up background processes
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
}

# Test environment configuration
test_environment_config() {
    log_info "Testing environment configuration..."
    
    # Test frontend environment
    if [ -f "frontend/.env" ]; then
        run_test "Frontend environment file" "grep -q 'REACT_APP' frontend/.env"
    else
        log_warning "No frontend/.env file found"
    fi
    
    # Test backend environment
    if [ -f "backend-cloudflare/.env" ]; then
        run_test "Backend environment file" "grep -q 'DATABASE_URL' backend-cloudflare/.env"
    else
        log_warning "No backend-cloudflare/.env file found"
    fi
    
    # Test wrangler configuration
    run_test "Wrangler configuration syntax" "cd backend-cloudflare && wrangler dev --dry-run"
    cd ..
}

# Test database connectivity (local)
test_database_local() {
    log_info "Testing local database connectivity..."
    
    # Test if database URL is configured
    if [ -f "backend-cloudflare/.env" ]; then
        source backend-cloudflare/.env
        if [ -n "$DATABASE_URL" ]; then
            run_test "Database URL configured" "echo '$DATABASE_URL' | grep -q 'postgresql://'"
        else
            log_warning "DATABASE_URL not configured"
        fi
    fi
    
    # Test Redis connectivity (if configured)
    if [ -n "$UPSTASH_REDIS_REST_URL" ]; then
        run_test "Redis URL configured" "echo '$UPSTASH_REDIS_REST_URL' | grep -q 'upstash.io'"
    else
        log_warning "UPSTASH_REDIS_REST_URL not configured"
    fi
}

# Test code quality
test_code_quality() {
    log_info "Testing code quality..."
    
    # Test frontend linting
    cd frontend
    run_test "Frontend linting" "pnpm run lint --no-fix"
    cd ..
    
    # Test backend syntax
    cd backend-cloudflare
    run_test "Backend JavaScript syntax" "node -c src/index.js"
    cd ..
}

# Test deployment readiness
test_deployment_readiness() {
    log_info "Testing deployment readiness..."
    
    # Test wrangler deployment dry run
    cd backend-cloudflare
    run_test "Wrangler deployment readiness" "wrangler deploy --dry-run"
    cd ..
    
    # Test frontend build for production
    cd frontend
    run_test "Production build" "NODE_ENV=production pnpm run build"
    cd ..
}

# Generate test report
generate_report() {
    echo -e "\n${BLUE}📊 Local Development Test Report${NC}"
    echo "=================================="
    echo -e "Total Tests: ${TESTS_TOTAL}"
    echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
    echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"
    
    local success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    echo -e "Success Rate: ${success_rate}%"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All local tests passed! Ready for deployment.${NC}"
        return 0
    else
        echo -e "\n${RED}❌ Some tests failed. Please fix issues before deploying.${NC}"
        return 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}🧪 Cloudflare Local Development Test${NC}"
    echo "======================================="
    echo "Testing local development setup:"
    echo "- Frontend build and serve"
    echo "- Backend development server"
    echo "- Environment configuration"
    echo "- Code quality"
    echo "- Deployment readiness"
    echo ""
    
    # Run all tests
    check_prerequisites
    test_frontend_build
    test_backend_local
    test_environment_config
    test_database_local
    test_code_quality
    test_deployment_readiness
    
    # Optionally test local servers (commented out to avoid port conflicts)
    # test_local_servers
    
    # Generate final report
    generate_report
}

# Run main function
main "$@"
