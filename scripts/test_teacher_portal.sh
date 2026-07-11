#!/bin/bash
# Teacher Portal Test

echo "========================================="
echo "  👨‍🏫 TEACHER PORTAL TEST"
echo "========================================="
echo ""

# Test endpoints
echo "1. Testing teacher endpoints..."
curl -s http://localhost:8001/api/teacher/classes/teacher_001 | python3 -m json.tool > /dev/null && echo "  ✅ Get classes successful" || echo "  ❌ Get classes failed"

curl -s http://localhost:8001/api/teacher/class/class_001/students | python3 -m json.tool > /dev/null && echo "  ✅ Get class students successful" || echo "  ❌ Get class students failed"

curl -s http://localhost:8001/api/teacher/class/class_001/analytics | python3 -m json.tool > /dev/null && echo "  ✅ Get class analytics successful" || echo "  ❌ Get class analytics failed"

echo ""
echo "📋 Manual Teacher Portal Test:"
echo "  1. Login with teacher account"
echo "  2. Click on 'Teacher Portal' in navigation"
echo "  3. Verify class list appears"
echo "  4. Click on a class to view students"
echo "  5. Check student progress and grades"
echo "  6. View class analytics dashboard"
echo "  7. Create a new assignment"
echo "  8. Post an announcement to the class"
echo ""
