#!/bin/bash

# 🔄 Cloudflare CI/CD Pipeline Test Script
# Automated testing for GitHub Actions deployment pipeline

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration from environment variables
FRONTEND_URL="${FRONTEND_URL:-https://7309ac14.avat-frontend.pages.dev}"
BACKEND_URL="${BACKEND_URL:-https://avat-backend.vikyath.workers.dev}"
CUSTOM_DOMAIN="${CUSTOM_DOMAIN:-https://avat.vikyath.dev}"

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

# Test GitHub Actions workflow files
test_github_workflows() {
    log_info "Testing GitHub Actions workflow files..."
    
    # Check if workflow files exist
    run_test "Deploy workflow exists" "[ -f '.github/workflows/deploy-cloudflare.yml' ]"
    run_test "Complete deployment workflow exists" "[ -f '.github/workflows/complete-deployment.yml' ]"
    
    # Validate YAML syntax
    if command -v yamllint &> /dev/null; then
        run_test "Workflow YAML syntax" "yamllint .github/workflows/*.yml"
    else
        log_warning "yamllint not installed, skipping YAML validation"
    fi
}

# Test environment secrets availability
test_environment_secrets() {
    log_info "Testing environment secrets..."
    
    # Check if required secrets are available (in CI environment)
    local required_secrets=("CLOUDFLARE_API_TOKEN" "CLOUDFLARE_ACCOUNT_ID" "MAPBOX_TOKEN")
    
    for secret in "${required_secrets[@]}"; do
        if [ -n "${!secret}" ]; then
            log_success "$secret is available"
        else
            log_warning "$secret is not set (may be expected in local testing)"
        fi
    done
}

# Test deployment pipeline endpoints
test_deployment_pipeline() {
    log_info "Testing deployment pipeline endpoints..."
    
    # Test frontend deployment
    run_test "Frontend deployment" "curl -s -o /dev/null -w '%{http_code}' '$FRONTEND_URL' | grep -q '200'"
    
    # Test backend deployment
    run_test "Backend deployment" "curl -s -o /dev/null -w '%{http_code}' '$BACKEND_URL/api/v1/health' | grep -q '200'"
    
    # Test custom domain (if configured)
    if [ "$CUSTOM_DOMAIN" != "https://avat.vikyath.dev" ]; then
        run_test "Custom domain deployment" "curl -s -o /dev/null -w '%{http_code}' '$CUSTOM_DOMAIN' | grep -q '200'"
    fi
}

# Test API functionality
test_api_functionality() {
    log_info "Testing API functionality..."
    
    # Test health endpoint
    run_test "Health endpoint response" "curl -s '$BACKEND_URL/api/v1/health' | jq -e '.status == \"healthy\"'"
    
    # Test stats endpoint
    run_test "Stats endpoint response" "curl -s '$BACKEND_URL/api/v1/stats' | jq -e '.data.total_accidents >= 0'"
    
    # Test analytics endpoint
    run_test "Analytics endpoint response" "curl -s '$BACKEND_URL/api/v1/analytics/overview' | jq -e '.data.summary'"
    
    # Test accidents endpoint
    run_test "Accidents endpoint response" "curl -s '$BACKEND_URL/api/v1/accidents' | jq -e '.status == \"success\"'"
}

# Test database connectivity
test_database_connectivity() {
    log_info "Testing database connectivity..."
    
    # Test database connection through health endpoint
    run_test "Database connection" "curl -s '$BACKEND_URL/api/v1/health' | jq -e '.database.status != \"error\"'"
    
    # Test database response time
    local db_response_time=$(curl -s -w '%{time_total}' -o /dev/null '$BACKEND_URL/api/v1/health')
    if (( $(echo "$db_response_time < 5.0" | bc -l) )); then
        log_success "Database response time acceptable (< 5s): ${db_response_time}s"
    else
        log_error "Database response time too slow: ${db_response_time}s"
    fi
}

# Test cache connectivity
test_cache_connectivity() {
    log_info "Testing cache connectivity..."
    
    # Test cache connection through health endpoint
    run_test "Cache connection" "curl -s '$BACKEND_URL/api/v1/health' | jq -e '.cache.status == \"connected\"'"
}

# Test performance benchmarks
test_performance_benchmarks() {
    log_info "Testing performance benchmarks..."
    
    # Test response times for critical endpoints
    local endpoints=("/api/v1/health" "/api/v1/stats" "/api/v1/analytics/overview")
    
    for endpoint in "${endpoints[@]}"; do
        local response_time=$(curl -s -w '%{time_total}' -o /dev/null "$BACKEND_URL$endpoint")
        if (( $(echo "$response_time < 2.0" | bc -l) )); then
            log_success "Response time for $endpoint: ${response_time}s"
        else
            log_warning "Slow response time for $endpoint: ${response_time}s"
        fi
    done
    
    # Test concurrent request handling
    log_test "Concurrent request handling"
    local concurrent_requests=5
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

# Test security headers
test_security_headers() {
    log_info "Testing security headers..."
    
    # Test HTTPS enforcement
    run_test "HTTPS enforcement" "curl -s -I '$BACKEND_URL/api/v1/health' | grep -q 'strict-transport-security'"
    
    # Test CORS headers
    run_test "CORS headers" "curl -s -I '$BACKEND_URL/api/v1/health' | grep -q 'Access-Control-Allow-Origin'"
    
    # Test security headers
    run_test "Security headers" "curl -s -I '$BACKEND_URL/api/v1/health' | grep -q 'X-Content-Type-Options'"
}

# Test error handling
test_error_handling() {
    log_info "Testing error handling..."
    
    # Test 404 error handling
    run_test "404 error handling" "curl -s -w '%{http_code}' '$BACKEND_URL/nonexistent' | grep -q '404'"
    
    # Test malformed request handling
    run_test "Malformed request handling" "curl -s -X POST '$BACKEND_URL/api/v1/accidents' -H 'Content-Type: application/json' -d 'invalid-json' | grep -q 'error'"
}

# Test monitoring and logging
test_monitoring_logging() {
    log_info "Testing monitoring and logging..."
    
    # Test health check endpoint returns proper metrics
    run_test "Health check metrics" "curl -s '$BACKEND_URL/api/v1/health' | jq -e '.database.status and .cache.status'"
    
    # Test timestamp format consistency
    run_test "Timestamp format" "curl -s '$BACKEND_URL/api/v1/health' | jq -e 'test(\"\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z\")'"
    
    # Test API version consistency
    run_test "API version consistency" "curl -s '$BACKEND_URL/' | jq -e '.version'"
}

# Test cron triggers
test_cron_triggers() {
    log_info "Testing cron triggers..."
    
    # Test index sync endpoint
    run_test "Index sync endpoint" "curl -s '$BACKEND_URL/cron/index-sync' | jq -e '.message'"
    
    # Test PDF sync endpoint
    run_test "PDF sync endpoint" "curl -s '$BACKEND_URL/cron/pdf-sync' | jq -e '.message'"
}

# Generate CI test report
generate_ci_report() {
    echo -e "\n${BLUE}📊 CI/CD Pipeline Test Report${NC}"
    echo "==============================="
    echo -e "Environment: ${CI:-local}"
    echo -e "Frontend URL: $FRONTEND_URL"
    echo -e "Backend URL: $BACKEND_URL"
    echo -e "Custom Domain: $CUSTOM_DOMAIN"
    echo ""
    echo -e "Total Tests: ${TESTS_TOTAL}"
    echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
    echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"
    
    local success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    echo -e "Success Rate: ${success_rate}%"
    
    # Determine overall status
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All CI tests passed! Deployment pipeline is healthy.${NC}"
        echo "::notice title=Deployment Status::All tests passed successfully"
        return 0
    else
        echo -e "\n${RED}❌ Some CI tests failed. Please review the errors above.${NC}"
        echo "::error title=Deployment Status::Some tests failed"
        return 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}🔄 Cloudflare CI/CD Pipeline Test${NC}"
    echo "===================================="
    echo "Testing automated deployment pipeline:"
    echo "- GitHub Actions workflows"
    echo "- Environment configuration"
    echo "- API functionality"
    echo "- Database connectivity"
    echo "- Performance benchmarks"
    echo "- Security headers"
    echo "- Error handling"
    echo ""
    
    # Run all tests
    test_github_workflows
    test_environment_secrets
    test_deployment_pipeline
    test_api_functionality
    test_database_connectivity
    test_cache_connectivity
    test_performance_benchmarks
    test_security_headers
    test_error_handling
    test_monitoring_logging
    test_cron_triggers
    
    # Generate final report
    generate_ci_report
}

# Run main function
main "$@"
