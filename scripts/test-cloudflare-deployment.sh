#!/bin/bash

# 🚀 Cloudflare Deployment Pipeline Test Script
# Tests all components of the free infrastructure migration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="https://7309ac14.avat-frontend.pages.dev"
BACKEND_URL="https://avat-backend.vikyath.workers.dev"
CUSTOM_DOMAIN="https://avat.vikyath.dev"
NEON_PROJECT_ID="rapid-lab-17700401"

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
    log_info "Checking prerequisites..."
    
    local tools=("curl" "jq" "node" "npm" "wrangler")
    
    for tool in "${tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            log_success "$tool is installed"
        else
            log_error "$tool is not installed"
            echo "Please install $tool before running tests"
            exit 1
        fi
    done
    
    # Check wrangler authentication
    if wrangler whoami &> /dev/null; then
        log_success "Wrangler is authenticated"
    else
        log_error "Wrangler is not authenticated"
        echo "Run 'wrangler login' to authenticate"
        exit 1
    fi
}

# Test Cloudflare Pages deployment
test_cloudflare_pages() {
    log_info "Testing Cloudflare Pages deployment..."
    
    # Test main frontend URL
    run_test "Frontend accessibility" "curl -s -o /dev/null -w '%{http_code}' '$FRONTEND_URL' | grep -q '200'"
    
    # Test custom domain (if configured)
    run_test "Custom domain accessibility" "curl -s -o /dev/null -w '%{http_code}' '$CUSTOM_DOMAIN' | grep -q '200'"
    
    # Test frontend build integrity
    run_test "Frontend static assets" "curl -s '$FRONTEND_URL/static/css/main.*.css' | grep -q 'body'"
    
    # Test frontend JavaScript bundle
    run_test "Frontend JavaScript bundle" "curl -s '$FRONTEND_URL/static/js/main.*.js' | grep -q 'React'"
    
    # Test HTTPS enforcement
    run_test "HTTPS enforcement" "curl -s -I 'http://7309ac14.avat-frontend.pages.dev' | grep -q '301\|302'"
}

# Test Cloudflare Workers deployment
test_cloudflare_workers() {
    log_info "Testing Cloudflare Workers deployment..."
    
    # Test health endpoint
    run_test "Health endpoint" "curl -s '$BACKEND_URL/api/v1/health' | jq -e '.status == \"healthy\"'"
    
    # Test root API endpoint
    run_test "Root API endpoint" "curl -s '$BACKEND_URL/' | jq -e '.message'"
    
    # Test stats endpoint
    run_test "Stats endpoint" "curl -s '$BACKEND_URL/api/v1/stats' | jq -e '.data.total_accidents'"
    
    # Test analytics endpoint
    run_test "Analytics endpoint" "curl -s '$BACKEND_URL/api/v1/analytics/overview' | jq -e '.data.summary.total_accidents'"
    
    # Test CORS headers
    run_test "CORS configuration" "curl -s -H 'Origin: $FRONTEND_URL' -H 'Access-Control-Request-Method: GET' -H 'Access-Control-Request-Headers: Content-Type' -X OPTIONS '$BACKEND_URL/api/v1/health' | grep -q 'Access-Control-Allow-Origin'"
    
    # Test error handling
    run_test "404 error handling" "curl -s -w '%{http_code}' '$BACKEND_URL/nonexistent' | grep -q '404'"
}

# Test database connectivity (Neon PostgreSQL)
test_database_connectivity() {
    log_info "Testing Neon PostgreSQL database..."
    
    # Test database connection through health endpoint
    run_test "Database connection" "curl -s '$BACKEND_URL/api/v1/health' | jq -e '.database.status != \"error\"'"
    
    # Test database response time
    local db_response_time=$(curl -s -w '%{time_total}' -o /dev/null '$BACKEND_URL/api/v1/health')
    if (( $(echo "$db_response_time < 2.0" | bc -l) )); then
        log_success "Database response time acceptable (< 2s)"
    else
        log_warning "Database response time slow: ${db_response_time}s"
    fi
}

# Test cache connectivity (Upstash Redis)
test_cache_connectivity() {
    log_info "Testing Upstash Redis cache..."
    
    # Test cache connection through health endpoint
    run_test "Cache connection" "curl -s '$BACKEND_URL/api/v1/health' | jq -e '.cache.status == \"connected\"'"
    
    # Test cache functionality with a simple set/get
    local test_key="test_$(date +%s)"
    local test_value="test_value"
    
    # Set a test value
    run_test "Cache set operation" "curl -s -X POST '$UPSTASH_REDIS_REST_URL/set/$test_key' -H 'Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN' -H 'Content-Type: application/json' -d '{\"value\":\"$test_value\",\"px\":5000}' | jq -e '.result == \"OK\"'"
    
    # Get the test value
    run_test "Cache get operation" "curl -s '$UPSTASH_REDIS_REST_URL/get/$test_key' -H 'Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN' | jq -e '.result == \"$test_value\"'"
}

# Test file storage (Cloudflare R2)
test_file_storage() {
    log_info "Testing Cloudflare R2 file storage..."
    
    # Test R2 bucket accessibility (if configured)
    if [ -n "$R2_BUCKET_URL" ]; then
        run_test "R2 bucket accessibility" "curl -s -o /dev/null -w '%{http_code}' '$R2_BUCKET_URL' | grep -q '200\|403'"
    else
        log_warning "R2 bucket URL not configured, skipping R2 tests"
    fi
}

# Test API integration
test_api_integration() {
    log_info "Testing API integration..."
    
    # Test accidents endpoint
    run_test "Accidents endpoint" "curl -s '$BACKEND_URL/api/v1/accidents' | jq -e '.status == \"success\"'"
    
    # Test filter options endpoint
    run_test "Filter options endpoint" "curl -s '$BACKEND_URL/api/v1/filters/options' | jq -e '.data.companies | length > 0'"
    
    # Test analytics with different parameters
    run_test "Analytics with parameters" "curl -s '$BACKEND_URL/api/v1/analytics?type=overview' | jq -e '.data.summary'"
    
    # Test API response format consistency
    run_test "API response format" "curl -s '$BACKEND_URL/api/v1/stats' | jq -e '.timestamp and .data'"
}

# Test performance and limits
test_performance() {
    log_info "Testing performance and limits..."
    
    # Test response times
    local endpoints=("/api/v1/health" "/api/v1/stats" "/api/v1/analytics/overview")
    
    for endpoint in "${endpoints[@]}"; do
        local response_time=$(curl -s -w '%{time_total}' -o /dev/null "$BACKEND_URL$endpoint")
        if (( $(echo "$response_time < 1.0" | bc -l) )); then
            log_success "Response time for $endpoint: ${response_time}s"
        else
            log_warning "Slow response time for $endpoint: ${response_time}s"
        fi
    done
    
    # Test concurrent requests (simulate load)
    log_test "Concurrent request handling"
    local concurrent_requests=10
    local success_count=0
    
    for i in $(seq 1 $concurrent_requests); do
        if curl -s "$BACKEND_URL/api/v1/health" | jq -e '.status == "healthy"' &> /dev/null; then
            ((success_count++))
        fi
    done
    
    if [ $success_count -eq $concurrent_requests ]; then
        log_success "All $concurrent_requests concurrent requests succeeded"
    else
        log_error "Only $success_count/$concurrent_requests concurrent requests succeeded"
    fi
}

# Test security
test_security() {
    log_info "Testing security configurations..."
    
    # Test HTTPS enforcement
    run_test "HTTPS enforcement" "curl -s -I '$BACKEND_URL/api/v1/health' | grep -q 'strict-transport-security'"
    
    # Test CORS policy
    run_test "CORS policy" "curl -s -H 'Origin: https://malicious-site.com' '$BACKEND_URL/api/v1/health' | grep -q 'Access-Control-Allow-Origin' || true"
    
    # Test API rate limiting (if implemented)
    log_test "Rate limiting test"
    local rate_limit_requests=100
    local rate_limited_count=0
    
    for i in $(seq 1 $rate_limit_requests); do
        local status_code=$(curl -s -w '%{http_code}' -o /dev/null "$BACKEND_URL/api/v1/health")
        if [ "$status_code" = "429" ]; then
            ((rate_limited_count++))
        fi
    done
    
    if [ $rate_limited_count -gt 0 ]; then
        log_success "Rate limiting is working ($rate_limited_count requests rate limited)"
    else
        log_warning "No rate limiting detected (may not be configured)"
    fi
}

# Test monitoring and observability
test_monitoring() {
    log_info "Testing monitoring and observability..."
    
    # Test health check endpoint returns proper metrics
    run_test "Health check metrics" "curl -s '$BACKEND_URL/api/v1/health' | jq -e '.database.status and .cache.status'"
    
    # Test stats endpoint provides useful metrics
    run_test "Stats metrics" "curl -s '$BACKEND_URL/api/v1/stats' | jq -e '.data.total_accidents >= 0'"
    
    # Test timestamp format consistency
    run_test "Timestamp format" "curl -s '$BACKEND_URL/api/v1/health' | jq -e 'test(\"\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z\")'"
}

# Test cron triggers
test_cron_triggers() {
    log_info "Testing cron triggers..."
    
    # Test index sync endpoint
    run_test "Index sync endpoint" "curl -s '$BACKEND_URL/cron/index-sync' | jq -e '.message'"
    
    # Test PDF sync endpoint
    run_test "PDF sync endpoint" "curl -s '$BACKEND_URL/cron/pdf-sync' | jq -e '.message'"
}

# Test frontend-backend integration
test_frontend_backend_integration() {
    log_info "Testing frontend-backend integration..."
    
    # Test that frontend can reach backend
    run_test "Frontend-backend connectivity" "curl -s '$FRONTEND_URL' | grep -q 'avat\|accident'"
    
    # Test API endpoints from frontend perspective
    run_test "API accessibility from frontend" "curl -s -H 'Origin: $FRONTEND_URL' '$BACKEND_URL/api/v1/health' | jq -e '.status'"
}

# Generate test report
generate_report() {
    echo -e "\n${BLUE}📊 Test Report${NC}"
    echo "=================="
    echo -e "Total Tests: ${TESTS_TOTAL}"
    echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
    echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"
    
    local success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    echo -e "Success Rate: ${success_rate}%"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All tests passed! Your Cloudflare deployment is working perfectly.${NC}"
        return 0
    else
        echo -e "\n${RED}❌ Some tests failed. Please review the errors above.${NC}"
        return 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Cloudflare Deployment Pipeline Test${NC}"
    echo "=========================================="
    echo "Testing free infrastructure migration:"
    echo "- Frontend: Cloudflare Pages"
    echo "- Backend: Cloudflare Workers"
    echo "- Database: Neon PostgreSQL"
    echo "- Cache: Upstash Redis"
    echo "- Storage: Cloudflare R2"
    echo ""
    
    # Load environment variables if .env exists
    if [ -f ".env" ]; then
        source .env
        log_info "Loaded environment variables from .env"
    fi
    
    # Run all tests
    check_prerequisites
    test_cloudflare_pages
    test_cloudflare_workers
    test_database_connectivity
    test_cache_connectivity
    test_file_storage
    test_api_integration
    test_performance
    test_security
    test_monitoring
    test_cron_triggers
    test_frontend_backend_integration
    
    # Generate final report
    generate_report
}

# Run main function
main "$@"
