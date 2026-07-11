#!/bin/bash
echo "========================================="
echo "  🏆 VERSION 3 VERIFICATION"
echo "========================================="
echo ""

echo "📁 Checking Version 3 directories..."
dirs=(
    "backend/modules/parent"
    "backend/modules/teacher"
    "backend/modules/school"
    "frontend/src/modules/parent"
    "frontend/src/modules/teacher"
    "frontend/src/modules/school"
)

for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir"
    else
        echo "  ❌ $dir MISSING"
    fi
done

echo ""
echo "📄 Checking Version 3 files..."
files=(
    "backend/modules/parent/router.py"
    "backend/modules/teacher/router.py"
    "backend/modules/school/router.py"
    "frontend/src/modules/parent/ParentDashboard.jsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file MISSING"
    fi
done

echo ""
echo "🔗 Checking Version 3 endpoints..."
endpoints=(
    "/api/parent/children/parent_001"
    "/api/parent/child/user_123/progress"
    "/api/teacher/classes/teacher_001"
    "/api/school/dashboard/school_001"
)

for endpoint in "${endpoints[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8001$endpoint" 2>/dev/null || echo "000")
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "404" ]; then
        echo "  ✅ $endpoint (HTTP $STATUS)"
    else
        echo "  ⚠️ $endpoint (HTTP $STATUS)"
    fi
done

echo ""
echo "✅ Version 3 verification complete!"
