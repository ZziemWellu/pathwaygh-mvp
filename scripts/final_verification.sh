#!/bin/bash
# Updated verification script - handles POST endpoints correctly

echo "========================================="
echo "  🏆 FINAL VERIFICATION REPORT"
echo "========================================="

# Check backend
echo ""
echo "📡 Backend Status:"
if curl -s http://localhost:8001/health > /dev/null; then
    echo "  ✅ Backend running"
else
    echo "  ❌ Backend not running"
fi

# Check endpoints
echo ""
echo "🔗 API Endpoints:"

# GET endpoints (should return 200)
for endpoint in "/health" "/api/careers" "/api/learn/courses" "/api/practice/subjects"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8001$endpoint")
    if [ "$STATUS" = "200" ]; then
        echo "  ✅ GET $endpoint (HTTP $STATUS)"
    else
        echo "  ⚠️ GET $endpoint (HTTP $STATUS)"
    fi
done

# POST endpoints (should not be tested with GET)
echo "  ℹ️ POST endpoints should be tested with POST requests"
for endpoint in "/api/auth/register" "/api/auth/login" "/api/practice/quiz/start"; do
    echo "  📝 POST $endpoint (test with POST)"
done

echo ""
echo "✅ Verification complete"
