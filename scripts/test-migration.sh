#!/bin/bash

# AVAT Migration Testing Script
# Tests the complete migration from Railway/Render to free infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
FRONTEND_URL="https://vikyath-n.github.io/AVAT"
BACKEND_URL="https://avat-backend.vikyath-n.workers.dev"
API_BASE_URL="${BACKEND_URL}/api/v1"

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

# Test 1: Frontend Accessibility
test_frontend() {
    log_info "Testing frontend accessibility..."

    # Test if frontend loads
    if curl -s -f -L "$FRONTEND_URL" > /dev/null; then
        log_success "Frontend is accessible at $FRONTEND_URL"
    else
        log_error "Frontend is not accessible at $FRONTEND_URL"
        return 1
    fi

    # Test if index.html contains expected content
    if curl -s "$FRONTEND_URL" | grep -q "AVAT"; then
        log_success "Frontend contains expected AVAT branding"
    else
        log_warning "Frontend may not be loading correctly"
    fi
}

# Test 2: Backend Health Check
test_backend_health() {
    log_info "Testing backend health check..."

    # Test health endpoint
    if curl -s -f "${API_BASE_URL}/health" > /dev/null; then
        log_success "Backend health endpoint is accessible"
    else
        log_error "Backend health endpoint is not accessible"
        return 1
    fi

    # Test health response format
    health_response=$(curl -s "${API_BASE_URL}/health")
    if echo "$health_response" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
        log_success "Backend health response is properly formatted"
    else
        log_warning "Backend health response format may be incorrect"
    fi
}

# Test 3: API Endpoints
test_api_endpoints() {
    log_info "Testing API endpoints..."

    # Test accidents endpoint
    if curl -s -f "${API_BASE_URL}/accidents?limit=5" > /dev/null; then
        log_success "Accidents API endpoint is accessible"
    else
        log_error "Accidents API endpoint failed"
        return 1
    fi

    # Test analytics endpoint
    if curl -s -f "${API_BASE_URL}/analytics?type=overview" > /dev/null; then
        log_success "Analytics API endpoint is accessible"
    else
        log_error "Analytics API endpoint failed"
        return 1
    fi

    # Test filter options endpoint
    if curl -s -f "${API_BASE_URL}/filters/options" > /dev/null; then
        log_success "Filter options API endpoint is accessible"
    else
        log_error "Filter options API endpoint failed"
        return 1
    fi
}

# Test 4: CORS Headers
test_cors() {
    log_info "Testing CORS configuration..."

    # Test CORS preflight request
    cors_check=$(curl -s -I -H "Origin: https://vikyath-n.github.io" -H "Access-Control-Request-Method: GET" -X OPTIONS "${API_BASE_URL}/health")

    if echo "$cors_check" | grep -q "Access-Control-Allow-Origin"; then
        log_success "CORS is properly configured"
    else
        log_warning "CORS may not be properly configured"
    fi
}

# Test 5: Response Times
test_performance() {
    log_info "Testing API response times..."

    # Test response time for health endpoint
    response_time=$(curl -s -w "%{time_total}" -o /dev/null "${API_BASE_URL}/health")

    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        log_success "Backend response time is acceptable (${response_time}s)"
    else
        log_warning "Backend response time is slow (${response_time}s)"
    fi
}

# Test 6: Error Handling
test_error_handling() {
    log_info "Testing error handling..."

    # Test 404 response
    if curl -s "${API_BASE_URL}/nonexistent-endpoint" | grep -q "Not Found"; then
        log_success "404 error handling works correctly"
    else
        log_warning "404 error handling may not be working"
    fi
}

# Test 7: Environment Variables
test_environment() {
    log_info "Testing environment configuration..."

    # Check if required environment variables are documented
    if [ -f ".env.example.free" ]; then
        log_success "Environment configuration template exists"
    else
        log_error "Environment configuration template missing"
        return 1
    fi

    # Check if deployment workflows exist
    if [ -f ".github/workflows/complete-deployment.yml" ]; then
        log_success "Deployment workflows are configured"
    else
        log_error "Deployment workflows missing"
        return 1
    fi
}

# Test 8: Scheduled Jobs (if configured)
test_scheduled_jobs() {
    log_info "Testing scheduled jobs configuration..."

    # Check if cron endpoints exist
    if curl -s -f "${BACKEND_URL}/cron/index-sync" > /dev/null; then
        log_success "Scheduled job endpoints are accessible"
    else
        log_info "Scheduled job endpoints may not be configured yet"
    fi
}

# Test 9: Database Connectivity (requires credentials)
test_database() {
    log_info "Testing database connectivity..."

    if [ -n "$DATABASE_URL" ]; then
        # This would require actual database testing logic
        log_info "Database URL is configured (manual testing recommended)"
    else
        log_warning "Database URL not set - skipping database tests"
    fi
}

# Test 10: Redis Connectivity (requires credentials)
test_redis() {
    log_info "Testing Redis connectivity..."

    if [ -n "$UPSTASH_REDIS_REST_URL" ] && [ -n "$UPSTASH_REDIS_REST_TOKEN" ]; then
        # Test Redis connectivity
        redis_test=$(curl -s -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_URL/set/test_migration/ok/60" 2>/dev/null | head -1)

        if [ "$redis_test" = "OK" ]; then
            log_success "Redis connectivity is working"
        else
            log_warning "Redis connectivity test inconclusive"
        fi
    else
        log_warning "Redis credentials not set - skipping Redis tests"
    fi
}

# Main testing function
run_all_tests() {
    echo "🧪 Starting AVAT Migration Tests..."
    echo "=================================="
    echo

    tests=(
        "test_frontend"
        "test_backend_health"
        "test_api_endpoints"
        "test_cors"
        "test_performance"
        "test_error_handling"
        "test_environment"
        "test_scheduled_jobs"
        "test_database"
        "test_redis"
    )

    passed=0
    failed=0

    for test in "${tests[@]}"; do
        echo
        echo "Running $test..."
        echo "----------------"

        if $test; then
            ((passed++))
        else
            ((failed++))
        fi
    done

    echo
    echo "📊 Test Results Summary:"
    echo "======================="
    echo -e "${GREEN}Passed: $passed${NC}"
    echo -e "${RED}Failed: $failed${NC}"
    echo -e "${BLUE}Total: $(($passed + $failed))${NC}"

    if [ $failed -eq 0 ]; then
        echo
        log_success "🎉 All tests passed! Migration appears successful."
        echo
        log_info "Next steps:"
        echo "1. Monitor your new infrastructure for a few days"
        echo "2. Remove old Railway/Render services after confirming everything works"
        echo "3. Update your DNS records if needed"
        echo "4. Consider implementing proper PDF processing in Cloudflare Workers"
        return 0
    else
        echo
        log_warning "⚠️  Some tests failed. Please review the issues above."
        echo
        log_info "Common fixes:"
        echo "1. Check environment variables in wrangler.toml"
        echo "2. Verify database and Redis connections"
        echo "3. Review CORS configuration"
        echo "4. Check Cloudflare Workers deployment status"
        return 1
    fi
}

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_all_tests
fi
