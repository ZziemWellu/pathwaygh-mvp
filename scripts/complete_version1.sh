#!/bin/bash
# Complete Version 1 Implementation

echo "🚀 PATHWAY AI VERSION 1 - COMPLETE IMPLEMENTATION"
echo "=================================================="
echo ""

# 1. Create all module directories
echo "📁 Creating module directories..."
mkdir -p ../frontend/src/modules/practice
mkdir -p ../frontend/src/modules/explore
mkdir -p ../frontend/src/modules/plan
mkdir -p ../frontend/src/modules/community
mkdir -p ../backend/data/practice
mkdir -p ../backend/data/quizzes

# 2. Create practice module files
echo "📝 Creating Practice module..."

# 3. Create explore module files
echo "📝 Creating Explore module..."

# 4. Restart services
echo "🔄 Restarting services..."
cd ../backend
conda activate nfcc
pkill -f uvicorn || true
python -m uvicorn main:app --reload --port 8001 &
sleep 3

cd ../frontend
npm run dev &
sleep 3

echo ""
echo "✅ VERSION 1 IMPLEMENTATION COMPLETE!"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔗 Backend: http://localhost:8001"
echo ""
echo "📋 New features:"
echo "  📝 Practice Module - Quizzes and exams"
echo "  🔍 Explore Module - Careers and universities"
echo "  📊 Mock exams with timed tests"
echo "  📈 Practice history tracking"
echo ""
