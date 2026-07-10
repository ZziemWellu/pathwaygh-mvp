#!/bin/bash
# Quick Manual Tests

echo "========================================="
echo "  🚀 QUICK TESTS"
echo "========================================="
echo ""

echo "1️⃣ Testing Authentication..."
echo "Register:"
curl -s -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test_quick@example.com","full_name":"Quick Test","password":"test123"}' \
  | python3 -m json.tool

echo ""
echo "Login:"
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test_quick@example.com","password":"test123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))")
echo "Token: ${TOKEN:0:20}..."

echo ""
echo "2️⃣ Testing Practice Module..."
echo "Subjects:"
curl -s http://localhost:8001/api/practice/subjects | python3 -m json.tool

echo ""
echo "Start Quiz:"
curl -s -X POST http://localhost:8001/api/practice/quiz/start \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","subject":"Mathematics","difficulty":"medium","num_questions":3}' \
  | python3 -m json.tool

echo ""
echo "3️⃣ Testing Parent Portal..."
echo "Children:"
curl -s http://localhost:8001/api/parent/parent_001/children | python3 -m json.tool

echo ""
echo "4️⃣ Testing Teacher Portal..."
echo "Classes:"
curl -s http://localhost:8001/api/teacher/teacher_001/classes | python3 -m json.tool

echo ""
echo "✅ Quick tests complete"
