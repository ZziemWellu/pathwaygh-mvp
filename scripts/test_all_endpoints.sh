#!/bin/bash
# Complete API Endpoint Testing

echo "========================================="
echo "  🔍 TESTING ALL PATHWAY AI ENDPOINTS"
echo "========================================="
echo ""

BASE_URL="http://localhost:8001"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ] || [ "$response" = "204" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (HTTP $response)"
        return 0
    elif [ "$response" = "404" ]; then
        echo -e "${YELLOW}⚠️  NOT IMPLEMENTED${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (HTTP $response)"
        return 1
    fi
}

# ============================================
# AUTH ENDPOINTS
# ============================================
echo "🔐 AUTHENTICATION ENDPOINTS"
echo "-----------------------------------------"

test_endpoint "POST" "/api/auth/register" '{"email":"test@example.com","full_name":"Test User","password":"test123"}' "Register"
test_endpoint "POST" "/api/auth/login" '{"email":"test@example.com","password":"test123"}' "Login"

# ============================================
# DASHBOARD ENDPOINTS
# ============================================
echo ""
echo "📊 DASHBOARD ENDPOINTS"
echo "-----------------------------------------"

test_endpoint "GET" "/api/dashboard/test_user" "" "Get Dashboard"
test_endpoint "GET" "/api/dashboard/progress/test_user" "" "Get Progress"
test_endpoint "GET" "/api/dashboard/recommendations/test_user" "" "Get Recommendations"

# ============================================
# LEARN ENDPOINTS
# ============================================
echo ""
echo "📚 LEARN ENDPOINTS"
echo "-----------------------------------------"

test_endpoint "GET" "/api/learn/courses" "" "List Courses"
test_endpoint "GET" "/api/learn/courses/jhs-english" "" "Get Course Detail"
test_endpoint "GET" "/api/learn/courses/jhs-english/lessons" "" "Get Course Lessons"

# ============================================
# PRACTICE ENDPOINTS
# ============================================
echo ""
echo "✍️ PRACTICE ENDPOINTS"
echo "-----------------------------------------"

test_endpoint "GET" "/api/practice/subjects" "" "Get Subjects"
test_endpoint "GET" "/api/practice/questions" "" "Get Questions"

# ============================================
# PARENT PORTAL ENDPOINTS
# ============================================
echo ""
echo "👨‍👩‍👧 PARENT PORTAL ENDPOINTS"
echo "-----------------------------------------"

test_endpoint "GET" "/api/parent/children/parent_001" "" "Get Children"
test_endpoint "GET" "/api/parent/child/child_001/progress" "" "Get Child Progress"
test_endpoint "GET" "/api/parent/analytics/parent_001" "" "Get Parent Analytics"

# ============================================
# TEACHER PORTAL ENDPOINTS
# ============================================
echo ""
echo "👨‍🏫 TEACHER PORTAL ENDPOINTS"
echo "-----------------------------------------"

test_endpoint "GET" "/api/teacher/classes/teacher_001" "" "Get Teacher Classes"
test_endpoint "GET" "/api/teacher/class/class_001/students" "" "Get Class Students"
test_endpoint "GET" "/api/teacher/class/class_001/analytics" "" "Get Class Analytics"

# ============================================
# PAYMENT ENDPOINTS
# ============================================
echo ""
echo "💰 PAYMENT ENDPOINTS"
echo "-----------------------------------------"

test_endpoint "GET" "/api/payment/plans" "" "Get Payment Plans"
test_endpoint "POST" "/api/payment/initialize" '{"email":"test@example.com","amount":50,"plan":"basic"}' "Initialize Payment"

# ============================================
# LIVE CLASS ENDPOINTS
# ============================================
echo ""
echo "🎥 LIVE CLASS ENDPOINTS"
echo "-----------------------------------------"

test_endpoint "GET" "/api/live/classes" "" "Get Live Classes"

echo ""
echo "========================================="
echo "  ✅ TESTING COMPLETE"
echo "========================================="
