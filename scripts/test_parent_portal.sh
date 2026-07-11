#!/bin/bash
# Parent Portal Test

echo "========================================="
echo "  👨‍👩‍👧 PARENT PORTAL TEST"
echo "========================================="
echo ""

# Test endpoints
echo "1. Testing parent endpoints..."
curl -s http://localhost:8001/api/parent/children/parent_001 | python3 -m json.tool > /dev/null && echo "  ✅ Get children successful" || echo "  ❌ Get children failed"

curl -s http://localhost:8001/api/parent/child/child_001/progress | python3 -m json.tool > /dev/null && echo "  ✅ Get child progress successful" || echo "  ❌ Get child progress failed"

curl -s http://localhost:8001/api/parent/analytics/parent_001 | python3 -m json.tool > /dev/null && echo "  ✅ Get parent analytics successful" || echo "  ❌ Get parent analytics failed"

echo ""
echo "📋 Manual Parent Portal Test:"
echo "  1. Login with parent account"
echo "  2. Click on 'Parent Portal' in navigation"
echo "  3. Verify children list appears"
echo "  4. Click on a child to view progress"
echo "  5. Check course progress, grades, and activity"
echo "  6. Verify certificates section"
echo "  7. Set a reminder for a child"
echo ""
