#!/bin/bash
# Complete SQLite Verification Script

echo "========================================="
echo "  🔍 SQLITE DATABASE VERIFICATION"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Check if database file exists
echo "1️⃣ Checking database file..."
if [ -f "database/sqlite/pathway_ai.db" ]; then
    echo -e "  ${GREEN}✅ Database file exists${NC}"
    ls -lh database/sqlite/pathway_ai.db
else
    echo -e "  ${RED}❌ Database file not found${NC}"
    exit 1
fi

echo ""
echo "2️⃣ Checking tables..."
TABLES=$(sqlite3 database/sqlite/pathway_ai.db ".tables")
if [ -n "$TABLES" ]; then
    echo -e "  ${GREEN}✅ Tables found:${NC}"
    echo "    $TABLES"
else
    echo -e "  ${RED}❌ No tables found${NC}"
    exit 1
fi

echo ""
echo "3️⃣ Checking table schemas..."
for table in users profiles activity_log saved_items courses lessons enrollments progress; do
    SCHEMA=$(sqlite3 database/sqlite/pathway_ai.db ".schema $table" 2>/dev/null | head -1)
    if [ -n "$SCHEMA" ]; then
        echo -e "  ${GREEN}✅ $table${NC}"
    else
        echo -e "  ${YELLOW}⚠️  $table not found${NC}"
    fi
done

echo ""
echo "4️⃣ Checking data counts..."
echo "  Table counts:"
sqlite3 database/sqlite/pathway_ai.db << 'SQL'
SELECT '    users: ' || COUNT(*) FROM users;
SELECT '    profiles: ' || COUNT(*) FROM profiles;
SELECT '    activity_log: ' || COUNT(*) FROM activity_log;
SELECT '    courses: ' || COUNT(*) FROM courses;
SELECT '    lessons: ' || COUNT(*) FROM lessons;
SQL

echo ""
echo "5️⃣ Sample data verification..."
echo "  Users:"
sqlite3 database/sqlite/pathway_ai.db "SELECT id, email, full_name, role FROM users;"

echo ""
echo "  Courses:"
sqlite3 database/sqlite/pathway_ai.db "SELECT id, title, level, subject, is_published FROM courses;"

echo ""
echo "  Lessons:"
sqlite3 database/sqlite/pathway_ai.db "SELECT id, title, lesson_type, duration_minutes, order_index FROM lessons;"

echo ""
echo "6️⃣ Testing SQLite connection..."
sqlite3 database/sqlite/pathway_ai.db "SELECT '✅ Connection successful!' as status;"

echo ""
echo "7️⃣ Testing database size..."
SIZE=$(du -h database/sqlite/pathway_ai.db | cut -f1)
echo "  Database size: $SIZE"

echo ""
echo "========================================="
echo -e "  ${GREEN}✅ VERIFICATION COMPLETE${NC}"
echo "========================================="
