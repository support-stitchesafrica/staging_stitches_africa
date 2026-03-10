#!/bin/bash

# Hierarchical Referral Program - Test Runner
# This script runs all tests for the hierarchical referral system

echo "🚀 Running Hierarchical Referral Program Tests"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test categories
UNIT_TESTS="lib/hierarchical-referral/__tests__/referral-code-system.test.ts lib/hierarchical-referral/__tests__/dashboard-aggregation.test.ts"
INTEGRATION_TESTS="lib/hierarchical-referral/__tests__/end-to-end-integration.test.ts"
PERFORMANCE_TESTS="lib/hierarchical-referral/__tests__/performance-load.test.ts"

# Function to run tests and capture results
run_test_category() {
    local category=$1
    local tests=$2
    local timeout=${3:-30000}
    
    echo -e "\n${YELLOW}📋 Running $category Tests${NC}"
    echo "----------------------------------------"
    
    if npx vitest run $tests --run --testTimeout=$timeout; then
        echo -e "${GREEN}✅ $category tests passed${NC}"
        return 0
    else
        echo -e "${RED}❌ $category tests failed${NC}"
        return 1
    fi
}

# Initialize counters
total_categories=0
passed_categories=0

# Run Unit Tests
echo -e "\n${YELLOW}🧪 Starting Unit Tests${NC}"
if run_test_category "Unit" "$UNIT_TESTS" 10000; then
    ((passed_categories++))
fi
((total_categories++))

# Run Integration Tests
echo -e "\n${YELLOW}🔗 Starting Integration Tests${NC}"
if run_test_category "Integration" "$INTEGRATION_TESTS" 15000; then
    ((passed_categories++))
fi
((total_categories++))

# Run Performance Tests (with longer timeout)
echo -e "\n${YELLOW}⚡ Starting Performance Tests${NC}"
if run_test_category "Performance" "$PERFORMANCE_TESTS" 60000; then
    ((passed_categories++))
fi
((total_categories++))

# Summary
echo -e "\n=============================================="
echo -e "${YELLOW}📊 Test Summary${NC}"
echo "=============================================="
echo "Total test categories: $total_categories"
echo "Passed categories: $passed_categories"
echo "Failed categories: $((total_categories - passed_categories))"

if [ $passed_categories -eq $total_categories ]; then
    echo -e "\n${GREEN}🎉 All test categories passed!${NC}"
    echo -e "${GREEN}✨ Hierarchical Referral Program is ready for deployment${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some test categories failed${NC}"
    echo -e "${RED}🔧 Please review and fix failing tests before deployment${NC}"
    exit 1
fi