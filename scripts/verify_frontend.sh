#!/bin/bash
# Verify Frontend Components

echo "========================================="
echo "  🎨 FRONTEND VERIFICATION"
echo "========================================="
echo ""

cd ~/projects/pathwaygh-mvp/frontend/src/modules

echo "📁 MODULES:"
echo "-----------------------------------------"
for module in home learn explore practice plan community profile parent teacher; do
    if [ -d "$module" ]; then
        files=$(find "$module" -name "*.jsx" 2>/dev/null | wc -l)
        echo "  ✅ $module ($files components)"
    else
        echo "  ❌ $module (missing)"
    fi
done

echo ""
echo "🎨 STYLES:"
echo "-----------------------------------------"
if [ -f "../styles/globals.css" ]; then
    lines=$(wc -l < "../styles/globals.css")
    echo "  ✅ globals.css ($lines lines)"
else
    echo "  ❌ globals.css (missing)"
fi

echo ""
echo "✅ Frontend verification complete"
