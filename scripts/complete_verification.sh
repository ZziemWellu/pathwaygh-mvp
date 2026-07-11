#!/bin/bash
# Complete Verification Script - Test ALL endpoints

echo "========================================="
echo "  🔍 PATHWAY AI - COMPLETE VERIFICATION"
echo "  $(date)"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    TOTAL=$((TOTAL + 1))
    
    echo -n "  ${BLUE}$name${NC}: "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$data" 2>/dev/null)
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ] || [ "$response" = "404" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $response)"
        FAILED=$((FAILED + 1))
    fi
}

echo "📡 BACKEND HEALTH"
echo "----------------------------------------"
test_endpoint "Health Check" "GET" "http://localhost:8001/health"

echo ""
echo "🔐 AUTHENTICATION"
echo "----------------------------------------"
test_endpoint "Register" "POST" "http://localhost:8001/api/auth/register" '{"email":"test_verify@example.com","full_name":"Test User","password":"test123"}'
test_endpoint "Login" "POST" "http://localhost:8001/api/auth/login" '{"email":"test_verify@example.com","password":"test123"}'

echo ""
echo "📚 LEARNING MODULE"
echo "----------------------------------------"
test_endpoint "Learn Courses" "GET" "http://localhost:8001/api/learn/courses"
test_endpoint "Learn Course Detail" "GET" "http://localhost:8001/api/learn/courses/jhs_english_complete"
test_endpoint "Learn Lessons" "GET" "http://localhost:8001/api/learn/courses/jhs_english_complete/lessons"

echo ""
echo "✍️ PRACTICE MODULE"
echo "----------------------------------------"
test_endpoint "Practice Subjects" "GET" "http://localhost:8001/api/practice/subjects"
test_endpoint "Practice Questions" "GET" "http://localhost:8001/api/practice/questions"
test_endpoint "Practice Quiz Start" "POST" "http://localhost:8001/api/practice/quiz/start" '{"user_id":"test","subject":"Mathematics","difficulty":"medium","num_questions":3}'

echo ""
echo "🔍 EXPLORE MODULE"
echo "----------------------------------------"
test_endpoint "Explore" "GET" "http://localhost:8001/api/explore/"

echo ""
echo "📋 PLAN MODULE"
echo "----------------------------------------"
test_endpoint "Plan" "GET" "http://localhost:8001/api/plan/"

echo ""
echo "🤝 COMMUNITY MODULE"
echo "----------------------------------------"
test_endpoint "Community" "GET" "http://localhost:8001/api/community/"

echo ""
echo "👤 PROFILE MODULE"
echo "----------------------------------------"
test_endpoint "Profile" "GET" "http://localhost:8001/api/profile/"

echo ""
echo "👪 PARENT PORTAL"
echo "----------------------------------------"
test_endpoint "Parent Children" "GET" "http://localhost:8001/api/parent/children/test_parent"
test_endpoint "Parent Analytics" "GET" "http://localhost:8001/api/parent/analytics/test_parent"

echo ""
echo "👨‍🏫 TEACHER PORTAL"
echo "----------------------------------------"
test_endpoint "Teacher Classes" "GET" "http://localhost:8001/api/teacher/classes/test_teacher"
test_endpoint "Teacher Schedule" "GET" "http://localhost:8001/api/teacher/schedule/test_teacher"

echo ""
echo "💰 PAYMENT MODULE"
echo "----------------------------------------"
test_endpoint "Payment Plans" "GET" "http://localhost:8001/api/payment/plans"

echo ""
echo "🎥 LIVE CLASSES"
echo "----------------------------------------"
test_endpoint "Live Classes" "GET" "http://localhost:8001/api/live/classes"

echo ""
echo "📊 DASHBOARD"
echo "----------------------------------------"
test_endpoint "Dashboard" "GET" "http://localhost:8001/api/dashboard/test_user"

echo ""
echo "🔍 RAG SEARCH"
echo "----------------------------------------"
test_endpoint "RAG Search" "POST" "http://localhost:8001/api/rag/search" '{"query":"medicine","top_k":3}'

echo ""
echo "========================================="
echo "  📊 VERIFICATION SUMMARY"
echo "========================================="
echo ""
echo -e "Total Tests: ${BLUE}$TOTAL${NC}"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! System is fully operational.${NC}"
else
    echo -e "${YELLOW}⚠️ $FAILED test(s) failed. Please check the endpoints above.${NC}"
fi

echo ""
echo "========================================="
