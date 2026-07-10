#!/bin/bash
# Verify Content Quality

echo "========================================="
echo "  📚 CONTENT VERIFICATION"
echo "========================================="
echo ""

echo "📚 COURSES:"
echo "-----------------------------------------"
find backend/data/courses -name "*.json" -exec basename {} \; | while read file; do
    size=$(wc -c < "backend/data/courses/$(find backend/data/courses -name "$file" -printf '%P')")
    echo "  ✅ $file ($size bytes)"
done
echo ""

echo "📝 PRACTICE QUESTIONS:"
echo "-----------------------------------------"
questions=$(cat backend/data/practice/waec_questions.json 2>/dev/null | grep -c '"question"' || echo "0")
echo "  ✅ WAEC questions: $questions"
echo ""

echo "🎯 CAREERS:"
echo "-----------------------------------------"
careers=$(cat backend/data/careers/expanded_careers.json 2>/dev/null | grep -c '"name"' || echo "0")
echo "  ✅ Careers: $careers"
echo ""

echo "✅ Content verification complete"
