#!/bin/bash
# Live Class Verification

echo "========================================="
echo "  🎥 LIVE CLASS TEST"
echo "========================================="
echo ""

# Test live classes endpoint
echo "1. Testing live classes..."
curl -s http://localhost:8001/api/live/classes | python3 -m json.tool > /dev/null && echo "  ✅ Live classes available" || echo "  ❌ Live classes failed"

# Test join live class
echo ""
echo "2. Testing join live class..."
response=$(curl -s -X POST "http://localhost:8001/api/live/classes/join?class_id=live_001&user_id=test_user")
if echo "$response" | grep -q "meeting_url"; then
    echo "  ✅ Join live class successful"
else
    echo "  ❌ Join live class failed"
fi

echo ""
echo "📋 Manual Live Class Test:"
echo "  1. Go to http://localhost:5173"
echo "  2. Login"
echo "  3. Click on 'Live Classes' in navigation"
echo "  4. Click 'Join' on an upcoming class"
echo "  5. Verify the meeting URL opens"
echo "  6. Test microphone and camera"
echo "  7. Test chat functionality"
echo "  8. End the class and verify recording"
echo ""
