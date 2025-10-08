#!/bin/bash

# 🎯 Cloudflare Test Suite Runner
# Runs all test scripts and generates comprehensive report

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Test results tracking
TOTAL_TESTS=0
TOTAL_PASSED=0
TOTAL_FAILED=0

# Helper functions
log_header() {
    echo -e "\n${PURPLE}════════════════════════════════════════${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}════════════════════════════════════════${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Run a test script and capture results
run_test_suite() {
    local test_name="$1"
    local test_script="$2"
    local test_args="${3:-}"
    
    log_header "Running $test_name"
    
    if [ ! -f "$test_script" ]; then
        log_error "Test script not found: $test_script"
        return 1
    fi
    
    # Make script executable
    chmod +x "$test_script"
    
    # Run the test and capture output
    local test_output
    if test_output=$(cd "$PROJECT_ROOT" && "$test_script" $test_args 2>&1); then
        log_success "$test_name completed successfully"
        echo "$test_output"
        return 0
    else
        log_error "$test_name failed"
        echo "$test_output"
        return 1
    fi
}

# Parse test results from output
parse_test_results() {
    local output="$1"
    
    # Extract test counts from output
    local passed=$(echo "$output" | grep -o "Passed: [0-9]*" | grep -o "[0-9]*" | tail -1)
    local failed=$(echo "$output" | grep -o "Failed: [0-9]*" | grep -o "[0-9]*" | tail -1)
    local total=$(echo "$output" | grep -o "Total Tests: [0-9]*" | grep -o "[0-9]*" | tail -1)
    
    # Update totals
    if [ -n "$total" ]; then
        TOTAL_TESTS=$((TOTAL_TESTS + total))
    fi
    if [ -n "$passed" ]; then
        TOTAL_PASSED=$((TOTAL_PASSED + passed))
    fi
    if [ -n "$failed" ]; then
        TOTAL_FAILED=$((TOTAL_FAILED + failed))
    fi
}

# Main execution
main() {
    echo -e "${BLUE}🎯 Cloudflare Test Suite Runner${NC}"
    echo "=================================="
    echo "Running comprehensive test suite for Cloudflare deployment"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    # Test results storage
    local local_test_result=""
    local ci_test_result=""
    local deployment_test_result=""
    
    # Run local development tests
    log_info "Starting local development tests..."
    if local_test_result=$(run_test_suite "Local Development Tests" "$SCRIPT_DIR/test-cloudflare-local.sh"); then
        log_success "Local tests completed"
    else
        log_error "Local tests failed"
    fi
    parse_test_results "$local_test_result"
    
    # Run CI/CD tests
    log_info "Starting CI/CD pipeline tests..."
    if ci_test_result=$(run_test_suite "CI/CD Pipeline Tests" "$SCRIPT_DIR/test-cloudflare-ci.sh"); then
        log_success "CI/CD tests completed"
    else
        log_error "CI/CD tests failed"
    fi
    parse_test_results "$ci_test_result"
    
    # Run deployment tests (optional - only if deployed)
    if [ "${SKIP_DEPLOYMENT_TESTS:-false}" != "true" ]; then
        log_info "Starting deployment tests..."
        if deployment_test_result=$(run_test_suite "Deployment Tests" "$SCRIPT_DIR/test-cloudflare-deployment.sh"); then
            log_success "Deployment tests completed"
        else
            log_error "Deployment tests failed"
            log_warning "This is expected if your deployment is not yet live"
        fi
        parse_test_results "$deployment_test_result"
    else
        log_warning "Skipping deployment tests (SKIP_DEPLOYMENT_TESTS=true)"
    fi
    
    # Generate comprehensive report
    log_header "Comprehensive Test Report"
    
    echo -e "📊 ${BLUE}Overall Results:${NC}"
    echo -e "Total Tests Run: ${TOTAL_TESTS}"
    echo -e "${GREEN}Total Passed: ${TOTAL_PASSED}${NC}"
    echo -e "${RED}Total Failed: ${TOTAL_FAILED}${NC}"
    
    if [ $TOTAL_TESTS -gt 0 ]; then
        local success_rate=$((TOTAL_PASSED * 100 / TOTAL_TESTS))
        echo -e "Overall Success Rate: ${success_rate}%"
        
        if [ $TOTAL_FAILED -eq 0 ]; then
            echo -e "\n${GREEN}🎉 All tests passed! Your Cloudflare deployment is ready.${NC}"
            echo -e "${GREEN}✅ Local development setup is working${NC}"
            echo -e "${GREEN}✅ CI/CD pipeline is configured correctly${NC}"
            if [ "${SKIP_DEPLOYMENT_TESTS:-false}" != "true" ]; then
                echo -e "${GREEN}✅ Production deployment is healthy${NC}"
            fi
        else
            echo -e "\n${YELLOW}⚠️  Some tests failed. Please review the errors above.${NC}"
            if [ $TOTAL_FAILED -lt $((TOTAL_TESTS / 4)) ]; then
                echo -e "${YELLOW}Most tests passed - minor issues to fix${NC}"
            else
                echo -e "${RED}Multiple test failures - significant issues to address${NC}"
            fi
        fi
    else
        echo -e "\n${RED}❌ No tests were executed. Please check your setup.${NC}"
    fi
    
    # Recommendations
    echo -e "\n${BLUE}📋 Next Steps:${NC}"
    if [ $TOTAL_FAILED -eq 0 ]; then
        echo "1. ✅ Deploy to production if not already done"
        echo "2. ✅ Set up monitoring and alerting"
        echo "3. ✅ Configure custom domain"
        echo "4. ✅ Update DNS records"
    else
        echo "1. 🔧 Fix failing tests (see output above)"
        echo "2. 🔧 Check environment configuration"
        echo "3. 🔧 Verify service connectivity"
        echo "4. 🔧 Review deployment logs"
    fi
    
    echo -e "\n${BLUE}📚 Documentation:${NC}"
    echo "- Test documentation: scripts/README-testing.md"
    echo "- Deployment guide: DEPLOYMENT-FREE.md"
    echo "- Project README: README.md"
    
    # Exit with appropriate code
    if [ $TOTAL_FAILED -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    --skip-deployment)
        export SKIP_DEPLOYMENT_TESTS=true
        ;;
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --skip-deployment    Skip deployment tests (useful for local testing)"
        echo "  --help, -h          Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                  Run all tests"
        echo "  $0 --skip-deployment  Run local and CI tests only"
        exit 0
        ;;
esac

# Run main function
main "$@"
