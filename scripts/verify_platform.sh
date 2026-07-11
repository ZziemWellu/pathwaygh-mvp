#!/bin/bash

# PATHWAY AI PLATFORM VERIFICATION SCRIPT
# Version: 2.0 - Fixed authentication testing

set -e

echo "========================================="
echo "🔍 PATHWAY AI PLATFORM VERIFICATION"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=${BACKEND_PORT:-8001}
FRONTEND_PORT=${FRONTEND_PORT:-5173}
BACKEND_URL="http://localhost:${BACKEND_PORT}"
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local expected=$4
    local data=$5
    
    echo -n "  Testing ${name}... "
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url" 2>/dev/null)
    elif [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$url" 2>/dev/null)
    fi
    
    if [ "$response" = "$expected" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (HTTP $response)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (Expected $expected, got $response)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "📁 Checking directory structure..."
echo ""

# Check backend directories
DIRS=(
    "backend/modules/auth"
    "backend/modules/learn"
    "backend/modules/practice"
    "backend/modules/explore"
    "backend/modules/plan"
    "backend/modules/community"
    "backend/modules/parent"
    "backend/modules/teacher"
    "backend/modules/school"
    "backend/modules/payment"
    "backend/modules/live"
    "backend/services"
    "backend/ai/orchestrator"
    "backend/ai/engines"
    "backend/core/config"
    "backend/core/logging"
    "backend/data/courses"
)

for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "  ${GREEN}✅${NC} $dir"
    else
        echo -e "  ${YELLOW}⚠️${NC} $dir (creating...)"
        mkdir -p "$dir"
    fi
done

echo ""
echo "📄 Checking key files..."
echo ""

# Check backend files
FILES=(
    "backend/main.py"
    "backend/modules/auth/router.py"
    "backend/modules/learn/router.py"
    "backend/modules/practice/router.py"
    "backend/modules/explore/router.py"
    "backend/modules/plan/router.py"
    "backend/modules/community/router.py"
    "backend/modules/parent/router.py"
    "backend/modules/teacher/router.py"
    "backend/modules/school/router.py"
    "backend/services/dashboard_service.py"
    "backend/ai/orchestrator/orchestrator.py"
    "backend/ai/engines/recommendation.py"
    "backend/ai/engines/rag.py"
    "backend/core/config/settings.py"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✅${NC} $file"
    else
        echo -e "  ${RED}❌${NC} $file (MISSING - will create)"
    fi
done

echo ""
echo "🔗 Testing API endpoints..."
echo ""

# Health Check
test_endpoint "Health Check" "GET" "${BACKEND_URL}/health" "200"

# Authentication - Using proper POST method
echo ""
echo "  Testing Authentication (POST methods)..."
test_endpoint "Auth Register" "POST" "${BACKEND_URL}/api/auth/register" "200" \
    '{"email":"test_verify@example.com","full_name":"Test User","password":"test123"}'

test_endpoint "Auth Login" "POST" "${BACKEND_URL}/api/auth/login" "200" \
    '{"email":"test_verify@example.com","password":"test123"}'

# Core Modules
echo ""
echo "  Testing Core Modules..."
test_endpoint "Dashboard API" "GET" "${BACKEND_URL}/api/dashboard/test_user" "200"
test_endpoint "Learn Courses" "GET" "${BACKEND_URL}/api/learn/courses" "200"
test_endpoint "Practice Subjects" "GET" "${BACKEND_URL}/api/practice/subjects" "200"
test_endpoint "Explore Careers" "GET" "${BACKEND_URL}/api/explore/careers" "200"

# Parent Portal
echo ""
echo "  Testing Parent Portal..."
test_endpoint "Parent Children" "GET" "${BACKEND_URL}/api/parent/children/parent_001" "200"

# Teacher Portal
echo ""
echo "  Testing Teacher Portal..."
test_endpoint "Teacher Classes" "GET" "${BACKEND_URL}/api/teacher/classes/teacher_001" "200"

# School Admin
echo ""
echo "  Testing School Administration..."
test_endpoint "School Dashboard" "GET" "${BACKEND_URL}/api/school/dashboard/school_001" "200"

# Payment Module
echo ""
echo "  Testing Payment Module..."
test_endpoint "Payment Init" "POST" "${BACKEND_URL}/api/payment/initialize" "200" \
    '{"amount":100,"email":"test@example.com"}'

# Live Classes
echo ""
echo "  Testing Live Classes..."
test_endpoint "Live Rooms" "GET" "${BACKEND_URL}/api/live/rooms" "200"

# AI Services
echo ""
echo "  Testing AI Services..."
test_endpoint "AI Recommendations" "GET" "${BACKEND_URL}/api/ai/recommendations/test_user" "200"
test_endpoint "RAG Search" "POST" "${BACKEND_URL}/api/ai/rag/search" "200" \
    '{"query":"biology"}'

echo ""
echo "📊 VERIFICATION RESULTS"
echo "========================================="
echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
echo "========================================="

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}✅ PLATFORM VERIFICATION COMPLETE${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️ Some tests failed. Check the output above.${NC}"
    exit 1
fi
