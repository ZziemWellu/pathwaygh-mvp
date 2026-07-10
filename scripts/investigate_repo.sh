#!/bin/bash
# Comprehensive Repository Investigation Script

echo "========================================="
echo "  🔍 PATHWAYGH REPOSITORY INVESTIGATION"
echo "========================================="
echo ""

echo "📊 REPOSITORY STATISTICS"
echo "-----------------------------------------"
echo "Total directories: $(find . -type d -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/__pycache__/*" | wc -l)"
echo "Total files: $(find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/__pycache__/*" | wc -l)"
echo "Python files: $(find . -name "*.py" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/__pycache__/*" | wc -l)"
echo "JSX files: $(find . -name "*.jsx" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)"
echo "JSON files: $(find . -name "*.json" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l)"
echo ""

echo "📁 DIRECTORY STRUCTURE"
echo "-----------------------------------------"
ls -la

echo ""
echo "🐍 BACKEND STRUCTURE"
echo "-----------------------------------------"
ls -la backend/

echo ""
echo "🎨 FRONTEND STRUCTURE"
echo "-----------------------------------------"
ls -la frontend/

echo ""
echo "📊 DATA STRUCTURE"
echo "-----------------------------------------"
ls -la backend/data/

echo ""
echo "🤖 ML MODULES"
echo "-----------------------------------------"
ls -la backend/ml/

echo ""
echo "🔗 API ENDPOINTS"
echo "-----------------------------------------"
echo "Total endpoints: $(grep -c '@app\.' backend/main.py)"
echo "GET: $(grep -c '@app\.get' backend/main.py)"
echo "POST: $(grep -c '@app\.post' backend/main.py)"
echo ""

echo "📦 DEPENDENCIES"
echo "-----------------------------------------"
echo "Python packages: $(cat backend/requirements.txt | wc -l)"
echo "Node packages: $(cat frontend/package.json | grep -c '"@' || echo "0")"

echo ""
echo "========================================="
echo "  ✅ INVESTIGATION COMPLETE"
echo "========================================="
