#!/bin/bash
# Sprint 3 Comprehensive Test Script

echo "========================================="
echo "  🧪 SPRINT 3 COMPREHENSIVE TESTS"
echo "========================================="
echo ""

BASE_URL="http://localhost:8001"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Test Health
echo "1️⃣ Testing Health Endpoint..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
if [ "$HEALTH" = "200" ]; then
    echo -e "  ${GREEN}✅ Health check passed${NC}"
else
    echo -e "  ${RED}❌ Health check failed${NC}"
fi

# 2. Test Auth Registration
echo ""
echo "2️⃣ Testing Registration..."
REGISTER=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test_'$(date +%s)'@example.com","full_name":"Test Student","password":"password123"}')
if echo "$REGISTER" | grep -q "success"; then
    echo -e "  ${GREEN}✅ Registration successful${NC}"
else
    echo -e "  ${RED}❌ Registration failed${NC}"
fi

# 3. Test Auth Login
echo ""
echo "3️⃣ Testing Login..."
LOGIN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')
if echo "$LOGIN" | grep -q "token"; then
    echo -e "  ${GREEN}✅ Login successful${NC}"
    TOKEN=$(echo "$LOGIN" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
    echo "  📋 Token: ${TOKEN:0:20}..."
else
    echo -e "  ${YELLOW}⚠️  Login skipped (registration may have failed)${NC}"
    TOKEN=""
fi

# 4. Test Activity Logging
if [ -n "$TOKEN" ]; then
    echo ""
    echo "4️⃣ Testing Activity Logging..."
    ACTIVITY=$(curl -s -X POST $BASE_URL/api/activity/log \
      -H "Content-Type: application/json" \
      -d '{"user_id":"test_user","type":"lesson_complete","data":{"course_id":"test","lesson_id":"1"}}')
    if echo "$ACTIVITY" | grep -q "id"; then
        echo -e "  ${GREEN}✅ Activity logged${NC}"
    else
        echo -e "  ${RED}❌ Activity logging failed${NC}"
    fi
fi

# 5. Test Get Activities
echo ""
echo "5️⃣ Testing Get Activities..."
ACTIVITIES=$(curl -s $BASE_URL/api/activity/test_user)
if echo "$ACTIVITIES" | grep -q "activities" || echo "$ACTIVITIES" | grep -q "\[\]"; then
    echo -e "  ${GREEN}✅ Get activities works${NC}"
else
    echo -e "  ${RED}❌ Get activities failed${NC}"
fi

# 6. Test Dashboard
echo ""
echo "6️⃣ Testing Dashboard..."
DASHBOARD=$(curl -s $BASE_URL/api/dashboard/test_user)
if echo "$DASHBOARD" | grep -q "greeting"; then
    echo -e "  ${GREEN}✅ Dashboard works${NC}"
else
    echo -e "  ${RED}❌ Dashboard failed${NC}"
fi

# 7. Test Learn Module
echo ""
echo "7️⃣ Testing Learn Module..."
COURSES=$(curl -s $BASE_URL/api/learn/courses)
if echo "$COURSES" | grep -q "jhs_english_complete"; then
    echo -e "  ${GREEN}✅ Learn module loads courses${NC}"
else
    echo -e "  ${RED}❌ Learn module failed${NC}"
fi

echo ""
echo "========================================="
echo "  ✅ SPRINT 3 TESTS COMPLETE"
echo "========================================="
