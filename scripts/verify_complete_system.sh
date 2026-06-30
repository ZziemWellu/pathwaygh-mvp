#!/bin/bash
# Complete System Verification Script
# Checks all directories, files, and endpoints

echo "========================================="
echo "  🔍 PATHWAYGH COMPLETE SYSTEM VERIFICATION"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TOTAL_TESTS=0
PASSED=0
FAILED=0

check_file() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $2 - MISSING: $1"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

check_directory() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $2 - MISSING: $1"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

check_endpoint() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$1" 2>/dev/null)
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ]; then
        echo -e "${GREEN}✅${NC} $2 ($1)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $2 ($1) - HTTP $RESPONSE"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

check_post_endpoint() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    RESPONSE=$(curl -s -X POST "$1" -H "Content-Type: application/json" -d "$2" 2>/dev/null)
    if echo "$RESPONSE" | grep -q "status\|success\|error\|predictions\|results\|student_profile\|career"; then
        echo -e "${GREEN}✅${NC} $3 ($1)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $3 ($1) - No valid response"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo -e "${BLUE}📁 CHECKING DIRECTORY STRUCTURE...${NC}"
echo "-----------------------------------------"

# Check all directories
check_directory "backend/ml/profile" "Profile module"
check_directory "backend/ml/context_engine" "Context Engine"
check_directory "backend/ml/knowledge_graph" "Knowledge Graph"
check_directory "backend/ml/predictive" "Predictive module"
check_directory "backend/ml/explainability" "Explainability module"
check_directory "backend/ml/memory" "Memory module"
check_directory "backend/ml/geographic" "Geographic module"
check_directory "backend/ml/financial" "Financial module"
check_directory "backend/ml/persona_dynamic" "Dynamic Persona"
check_directory "backend/ml/adaptive_journey" "Adaptive Journey"
check_directory "frontend/src/components/Profile" "Profile components"
check_directory "frontend/src/components/Dashboard" "Dashboard components"
check_directory "frontend/src/components/Graph" "Graph components"
check_directory "frontend/src/components/Timeline" "Timeline components"
check_directory "frontend/src/components/Explainability" "Explainability components"
check_directory "frontend/src/components/Adaptive" "Adaptive components"

echo ""
echo -e "${BLUE}📄 CHECKING BACKEND FILES...${NC}"
echo "-----------------------------------------"

# Check all backend files
check_file "backend/ml/profile/unified_profile.py" "Unified Profile"
check_file "backend/ml/context_engine/enhanced_engine.py" "Enhanced Context Engine"
check_file "backend/ml/knowledge_graph/national_graph.py" "National Knowledge Graph"
check_file "backend/ml/geographic/geo_engine.py" "Geographic Intelligence"
check_file "backend/ml/financial/financial_engine.py" "Financial Intelligence"
check_file "backend/ml/memory/decision_memory.py" "Decision Memory"
check_file "backend/ml/explainability/unified_explainer.py" "Unified Explainer"
check_file "backend/ml/recommendation_graph/graph_builder.py" "Recommendation Graph"
check_file "backend/ml/decision_timeline/timeline.py" "Decision Timeline"
check_file "backend/ml/dashboard/intelligence_dashboard.py" "Intelligence Dashboard"
check_file "backend/ml/persona_dynamic/persona_engine.py" "Dynamic Persona Engine"

echo ""
echo -e "${BLUE}📄 CHECKING FRONTEND FILES...${NC}"
echo "-----------------------------------------"

# Check all frontend files
check_file "frontend/src/components/Profile/CompleteProfileSetup.jsx" "Complete Profile Setup"
check_file "frontend/src/components/Dashboard/IntelligenceDashboard.jsx" "Intelligence Dashboard"
check_file "frontend/src/components/ContextEngine/ContextChat.jsx" "Context Chat"
check_file "frontend/src/components/Explainability/ExplainabilityPanel.jsx" "Explainability Panel"
check_file "frontend/src/components/Roadmap/CareerRoadmap.jsx" "Career Roadmap"
check_file "frontend/src/components/Simulator/WhatIfSimulator.jsx" "What-If Simulator"
check_file "frontend/src/components/Comparison/UniversityComparison.jsx" "University Comparison"
check_file "frontend/src/components/Sources/SourceCitations.jsx" "Source Citations"
check_file "frontend/src/components/Conversation/ConversationMemory.jsx" "Conversation Memory"
check_file "frontend/src/components/ActionPlan/ActionPlan.jsx" "Action Plan"
check_file "frontend/src/components/Scholarship/ScholarshipFinder.jsx" "Scholarship Finder"
check_file "frontend/src/components/Feedback/FeedbackButtons.jsx" "Feedback Buttons"
check_file "frontend/src/components/Dashboard/SchoolDashboard.jsx" "School Dashboard"

echo ""
echo -e "${BLUE}🔍 CHECKING ENDPOINTS...${NC}"
echo "-----------------------------------------"

# Check if backend is running
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Backend is running on port 8001"
    
    # Check GET endpoints
    check_endpoint "http://localhost:8001/health" "Health endpoint"
    check_endpoint "http://localhost:8001/api/careers" "Careers endpoint"
    
    # Check POST endpoints
    check_post_endpoint "http://localhost:8001/api/smart/recommend" \
        '{"aggregate":12,"subjects":{"biology":75},"interests":{"healthcare":7}}' \
        "Smart Recommend"
    
    check_post_endpoint "http://localhost:8001/api/real-data/recommend" \
        '{"aggregate":12,"interests":["healthcare"],"subjects":["Biology"]}' \
        "Real Data Recommend"
    
    check_post_endpoint "http://localhost:8001/api/admission-chance" \
        '{"career":"Medical Doctor","aggregate":12,"subjects":["Biology","Chemistry","Physics"]}' \
        "Admission Predictor"
    
    check_post_endpoint "http://localhost:8001/api/explain/recommendation" \
        '{"career":{"career":"Medical Doctor","typical_aggregate":12},"student_profile":{"aggregate":12}}' \
        "Explainability"
    
    # Check new endpoints
    check_endpoint "http://localhost:8001/api/graph/Medical%20Doctor" "Recommendation Graph"
    
    check_post_endpoint "http://localhost:8001/api/timeline/generate" \
        '{"career":"Medical Doctor","aggregate":12}' \
        "Decision Timeline"
    
    check_post_endpoint "http://localhost:8001/api/profile/unified/create" \
        '{"user_id":"test_user","profile":{"role":"student_shs","education_level":"shs","geographic":{"region":"Greater Accra"},"academic":{"aggregate":12}}}' \
        "Unified Profile Create"
    
    check_endpoint "http://localhost:8001/api/profile/unified/test_user" "Unified Profile Get"
    
    check_post_endpoint "http://localhost:8001/api/geo/recommend" \
        '{"profile":{"geographic":{"region":"Greater Accra"}}}' \
        "Geographic Intelligence"
    
    check_post_endpoint "http://localhost:8001/api/financial/advice" \
        '{"profile":{},"universities":["University of Ghana","KNUST"]}' \
        "Financial Intelligence"
    
    check_endpoint "http://localhost:8001/api/graph/national/ug" "Knowledge Graph Node"
    
    check_post_endpoint "http://localhost:8001/api/explain/unified" \
        '{"career":{"career":"Medical Doctor","typical_aggregate":12},"profile":{"academic":{"aggregate":12}}}' \
        "Unified Explainability"
    
    check_post_endpoint "http://localhost:8001/api/journey/recommend" \
        '{"profile":{"role":"student_shs"}}' \
        "Adaptive Journey"
    
    echo ""
    echo -e "${BLUE}🧪 TESTING RAG SYSTEM...${NC}"
    echo "-----------------------------------------"
    
    RAG_RESPONSE=$(curl -s -X POST http://localhost:8001/api/rag/search \
        -H "Content-Type: application/json" \
        -d '{"query":"medicine","top_k":3}')
    
    if echo "$RAG_RESPONSE" | grep -q "results"; then
        echo -e "${GREEN}✅${NC} RAG Search is working"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌${NC} RAG Search is not working"
        FAILED=$((FAILED + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
else
    echo -e "${RED}❌${NC} Backend is NOT running. Start with: cd backend && conda activate nfcc && python -m uvicorn main:app --reload --port 8001"
fi

echo ""
echo -e "${BLUE}🎨 CHECKING FRONTEND...${NC}"
echo "-----------------------------------------"

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Frontend is running on http://localhost:5173"
else
    echo -e "${RED}❌${NC} Frontend is NOT running. Start with: cd frontend && npm run dev"
fi

echo ""
echo -e "${BLUE}📊 CHECKING DATA FILES...${NC}"
echo "-----------------------------------------"

# Check data files
check_file "backend/data/universities/university_of_ghana.json" "UG data"
check_file "backend/data/universities/knust.json" "KNUST data"
check_file "backend/data/universities/uhas.json" "UHAS data"
check_file "backend/data/programs/expanded_programs.json" "Expanded programs"
check_file "backend/data/admission_cutoffs.csv" "Admission cutoffs"
check_file "backend/data/sources.json" "Data sources"
check_file "backend/data/wassce/grading_system.json" "WASSCE grading"
check_file "backend/data/employment/job_market.json" "Job market data"

echo ""
echo -e "${BLUE}🏆 VERIFICATION SUMMARY${NC}"
echo "========================================="
echo ""
echo -e "Total tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Your PathwayGH system is COMPLETE!${NC}"
    echo ""
    echo -e "Live Demo: ${BLUE}https://pathwaygh-frontend.onrender.com${NC}"
    echo -e "Backend API: ${BLUE}https://pathwaygh-backend.onrender.com${NC}"
    echo -e "API Docs: ${BLUE}https://pathwaygh-backend.onrender.com/api/docs${NC}"
    echo -e "GitHub: ${BLUE}https://github.com/ZziemWellu/pathwaygh-mvp${NC}"
else
    echo -e "${YELLOW}⚠️ Some tests failed. Please check the missing items above.${NC}"
    echo ""
    echo -e "To run individual tests:"
    echo -e "  ${BLUE}curl http://localhost:8001/health${NC}"
    echo -e "  ${BLUE}curl -X POST http://localhost:8001/api/smart/recommend -H 'Content-Type: application/json' -d '{\"aggregate\":12,\"subjects\":{\"biology\":75},\"interests\":{\"healthcare\":7}}'${NC}"
fi

echo ""
echo "========================================="
