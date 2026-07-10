#!/bin/bash
# Verify Database Tables

echo "========================================="
echo "  🗄️ DATABASE VERIFICATION"
echo "========================================="
echo ""

# Check SQLite database
if [ -f "backend/pathwaygh.db" ]; then
    echo "✅ SQLite database exists"
    
    # Check tables
    echo ""
    echo "📊 Tables:"
    tables=$(sqlite3 backend/pathwaygh.db ".tables" 2>/dev/null)
    if [ -n "$tables" ]; then
        echo "  $tables"
    else
        echo "  ⚠️ No tables found"
    fi
else
    echo "❌ SQLite database not found"
fi

echo ""
echo "✅ Database verification complete"
