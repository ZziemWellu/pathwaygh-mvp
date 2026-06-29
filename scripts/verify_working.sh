#!/bin/bash
# Complete working verification script

echo "========================================="
echo "  🔍 PATHWAYGH COMPLETE VERIFICATION"
echo "========================================="
echo ""

# Check backend
echo "📡 CHECKING BACKEND..."
if curl -s http://localhost:8001/health > /dev/null; then
    echo "✅ Backend is running on port 8001"
    
    # Test each endpoint
    echo -e "\n📊 TESTING ENDPOINTS:"
    
    # Health
    if curl -s http://localhost:8001/health | grep -q "healthy"; then
        echo "  ✅ /health - Working"
    else
        echo "  ❌ /health - Failed"
    fi
    
    # Careers
    if curl -s http://localhost:8001/api/careers | grep -q "Medical Doctor"; then
        echo "  ✅ /api/careers - Working"
    else
        echo "  ❌ /api/careers - Failed"
    fi
    
    # Smart recommend
    if curl -s -X POST http://localhost:8001/api/smart/recommend -H "Content-Type: application/json" -d '{"aggregate":12,"subjects":{"biology":85},"interests":{"healthcare":8}}' | grep -q "confidence"; then
        echo "  ✅ /api/smart/recommend - Working"
    else
        echo "  ❌ /api/smart/recommend - Failed"
    fi
    
    # Real data
    if curl -s -X POST http://localhost:8001/api/real-data/recommend -H "Content-Type: application/json" -d '{"aggregate":12,"interests":["healthcare"],"subjects":["Biology"]}' | grep -q "Medical Doctor"; then
        echo "  ✅ /api/real-data/recommend - Working"
    else
        echo "  ❌ /api/real-data/recommend - Failed"
    fi
    
    # Admission predictor
    if curl -s -X POST http://localhost:8001/api/admission-chance -H "Content-Type: application/json" -d '{"career":"Medical Doctor","aggregate":12,"subjects":["Biology"]}' | grep -q "admission_chance"; then
        echo "  ✅ /api/admission-chance - Working"
    else
        echo "  ❌ /api/admission-chance - Failed"
    fi
    
    # RAG search
    if curl -s -X POST http://localhost:8001/api/rag/search -H "Content-Type: application/json" -d '{"query":"medicine","top_k":3}' | grep -q "results"; then
        echo "  ✅ /api/rag/search - Working"
    else
        echo "  ❌ /api/rag/search - Failed"
    fi
    
else
    echo "❌ Backend is NOT running. Start with: cd backend && uvicorn main:app --reload --port 8001"
fi

# Check frontend
echo -e "\n🎨 CHECKING FRONTEND..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend is running on http://localhost:5173"
else
    echo "❌ Frontend is NOT running. Start with: cd frontend && npm run dev"
fi

# Check components
echo -e "\n📦 CHECKING COMPONENTS..."
cd ~/projects/pathwaygh-mvp/frontend/src/components
for comp in AIRecommendation AICopilot RealRecommender AdmissionPredictor CareerCharts; do
    if [ -f "$comp.jsx" ]; then
        echo "✅ $comp.jsx exists"
    else
        echo "❌ $comp.jsx missing"
    fi
done

# Check PWA files
echo -e "\n📱 CHECKING PWA FILES..."
cd ~/projects/pathwaygh-mvp/frontend/public
for file in manifest.json sw.js _redirects; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "========================================="
echo "  🎯 VERIFICATION COMPLETE"
echo "========================================="
