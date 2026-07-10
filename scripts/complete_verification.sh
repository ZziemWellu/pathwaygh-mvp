#!/bin/bash
# Complete System Verification - Tests ALL Features

echo "========================================="
echo "  🔍 PATHWAY AI - COMPLETE VERIFICATION"
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
    TOTAL=$((TOTAL + 1))
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8001$url")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:8001$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "  ${GREEN}✅${NC} $name (HTTP $response)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "  ${RED}❌${NC} $name (HTTP $response)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to check file exists
check_file() {
    TOTAL=$((TOTAL + 1))
    if [ -f "$1" ]; then
        echo -e "  ${GREEN}✅${NC} $2"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "  ${RED}❌${NC} $2 - MISSING"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    TOTAL=$((TOTAL + 1))
    if [ -d "$1" ]; then
        echo -e "  ${GREEN}✅${NC} $2"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "  ${RED}❌${NC} $2 - MISSING"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo -e "${BLUE}📁 CHECKING DIRECTORIES...${NC}"
echo "-----------------------------------------"
check_dir "backend/modules/parent" "Parent Portal module"
check_dir "backend/modules/teacher" "Teacher Portal module"
check_dir "frontend/src/modules/parent" "Parent Portal frontend"
check_dir "frontend/src/modules/teacher" "Teacher Portal frontend"
check_dir "backend/data/careers" "Careers data directory"
check_dir "backend/data/migration" "Migration directory"

echo ""
echo -e "${BLUE}📄 CHECKING FILES...${NC}"
echo "-----------------------------------------"
check_file "backend/modules/parent/router.py" "Parent Portal router"
check_file "backend/modules/teacher/router.py" "Teacher Portal router"
check_file "backend/data/courses/shs/shs_mathematics.json" "SHS Mathematics course"
check_file "backend/data/courses/shs/shbs_biology.json" "SHS Biology course"
check_file "backend/data/practice/waec_questions.json" "WAEC questions"
check_file "backend/data/careers/expanded_careers.json" "Expanded careers"
check_file "frontend/src/styles/globals.css" "Enhanced global styles"
check_file "scripts/migrate_to_postgres.py" "PostgreSQL migration script"
check_file "frontend/src/modules/parent/ParentDashboard.jsx" "Parent Dashboard"

echo ""
echo -e "${BLUE}🔗 TESTING BACKEND ENDPOINTS...${NC}"
echo "-----------------------------------------"

# Backend health
test_endpoint "Health Check" "GET" "/health"

# Courses endpoints
test_endpoint "Learn Courses" "GET" "/api/learn/courses"
test_endpoint "Course Detail" "GET" "/api/learn/courses/jhs_english_complete"

# Practice endpoints
test_endpoint "Practice Subjects" "GET" "/api/practice/subjects"
test_endpoint "Start Quiz" "POST" "/api/practice/quiz/start" '{"user_id":"test","subject":"Mathematics","difficulty":"medium","num_questions":3}'

# Explore endpoints
test_endpoint "Careers API" "GET" "/api/careers"
test_endpoint "Universities API" "GET" "/api/real-data/universities"

# Parent Portal endpoints
test_endpoint "Parent Children" "GET" "/api/parent/parent_001/children"
test_endpoint "Child Progress" "GET" "/api/parent/parent_001/child/child_001/progress"
test_endpoint "Parent Notifications" "GET" "/api/parent/parent_001/notifications"

# Teacher Portal endpoints
test_endpoint "Teacher Classes" "GET" "/api/teacher/teacher_001/classes"
test_endpoint "Teacher Analytics" "GET" "/api/teacher/teacher_001/analytics"
test_endpoint "Class Students" "GET" "/api/teacher/teacher_001/class/class_001/students"

# Authentication endpoints
test_endpoint "Register" "POST" "/api/auth/register" '{"email":"test_verify@example.com","full_name":"Test User","password":"test123","role":"student"}'
test_endpoint "Login" "POST" "/api/auth/login" '{"email":"test_verify@example.com","password":"test123"}'

echo ""
echo -e "${BLUE}📊 VERIFICATION SUMMARY${NC}"
echo "========================================="
echo ""
echo -e "Total tests: $TOTAL"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! System is fully operational.${NC}"
else
    echo -e "${YELLOW}⚠️ Some tests failed. Please review above.${NC}"
fi

echo ""
echo "========================================="
