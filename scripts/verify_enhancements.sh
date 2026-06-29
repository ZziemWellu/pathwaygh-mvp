#!/bin/bash
# PathwayGH Enhancement Verification Script
# This script checks if all hackathon enhancements have been properly implemented

echo "========================================="
echo "  🔍 PATHWAYGH ENHANCEMENT VERIFICATION"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to check if file exists
check_file() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2 - Found at: $1"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $2 - MISSING: $1"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to check if directory exists
check_directory() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $2 - Found at: $1"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $2 - MISSING: $1"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to check if string exists in file
check_in_file() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ -f "$1" ] && grep -q "$2" "$1"; then
        echo -e "${GREEN}✅${NC} $3 - Found in $1"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $3 - NOT FOUND in $1"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo -e "${BLUE}📁 CHECKING DIRECTORY STRUCTURE...${NC}"
echo "-----------------------------------------"

# Check main directories
check_directory "backend" "Backend directory"
check_directory "frontend" "Frontend directory"
check_directory "docs" "Documentation directory"
check_directory "scripts" "Scripts directory"
check_directory "frontend/src/components" "Components directory"
check_directory "frontend/public" "Public directory"
check_directory "frontend/public/icons" "Icons directory"

echo ""
echo -e "${BLUE}📄 CHECKING BACKEND FILES...${NC}"
echo "-----------------------------------------"

# Backend files
check_file "backend/main.py" "Main FastAPI application"
check_file "backend/requirements.txt" "Python dependencies"
check_file "backend/.env.example" "Environment variables template"
check_file "backend/ml/lazy_rag_system.py" "RAG system"
check_file "backend/ml/enhanced_copilot.py" "Enhanced AI Copilot"
check_file "backend/ml/admission_predictor.py" "Admission predictor"
check_file "backend/ml/prestige_scores.json" "Prestige scores"
check_file "backend/data/programs/expanded_programs.json" "Expanded programs data"
check_file "backend/data/admission_cutoffs.csv" "Admission cutoffs"
check_file "backend/data/sources.json" "Data sources"

echo ""
echo -e "${BLUE}📄 CHECKING FRONTEND FILES...${NC}"
echo "-----------------------------------------"

# Frontend files
check_file "frontend/package.json" "Frontend package.json"
check_file "frontend/vite.config.js" "Vite configuration"
check_file "frontend/index.html" "Main HTML"
check_file "frontend/src/main.jsx" "Main React entry"
check_file "frontend/src/App.jsx" "Main React App"
check_file "frontend/src/components/AIRecommendation.jsx" "AI Recommendation component"
check_file "frontend/src/components/AICopilot.jsx" "AI Copilot component"
check_file "frontend/src/components/RealRecommender.jsx" "Real Recommender component"
check_file "frontend/src/components/AdmissionPredictor.jsx" "Admission Predictor component"
check_file "frontend/src/components/CareerCharts.jsx" "Career Charts component"
check_file "frontend/public/manifest.json" "PWA manifest"
check_file "frontend/public/sw.js" "Service Worker"
check_file "frontend/public/_redirects" "Redirect configuration"

echo ""
echo -e "${BLUE}📄 CHECKING DOCUMENTATION...${NC}"
echo "-----------------------------------------"

# Documentation
check_file "docs/DEMO_SCRIPT.md" "Demo script"
check_file "docs/PITCH_DECK.md" "Pitch deck"
check_file "docs/SUBMISSION_GUIDE.md" "Submission guide"
check_file "README.md" "Main README"
check_file ".gitignore" "Git ignore file"

echo ""
echo -e "${BLUE}🔍 CHECKING CODE IMPLEMENTATIONS...${NC}"
echo "-----------------------------------------"

# Check for key implementations
check_in_file "backend/main.py" "admission-chance" "Admission Predictor endpoint"
check_in_file "backend/ml/enhanced_copilot.py" "EnhancedCareerCopilot" "Enhanced Copilot class"
check_in_file "backend/ml/admission_predictor.py" "AdmissionPredictor" "Admission Predictor class"
check_in_file "frontend/src/components/AdmissionPredictor.jsx" "AdmissionPredictor" "Admission Predictor component"
check_in_file "frontend/src/components/CareerCharts.jsx" "BarChart" "Charts component"
check_in_file "frontend/public/manifest.json" "PathwayGH" "PWA manifest"
check_in_file "frontend/public/sw.js" "CACHE_NAME" "Service Worker"
check_in_file "frontend/src/main.jsx" "serviceWorker" "PWA registration"

echo ""
echo -e "${BLUE}🔍 CHECKING ENVIRONMENT VARIABLES...${NC}"
echo "-----------------------------------------"

if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✅${NC} .env file exists"
    if grep -q "OPENAI_API_KEY" backend/.env; then
        echo -e "${GREEN}✅${NC} OPENAI_API_KEY is set"
    else
        echo -e "${YELLOW}⚠️${NC} OPENAI_API_KEY not set in .env (optional for hackathon)"
    fi
else
    echo -e "${YELLOW}⚠️${NC} .env file not found (copy from .env.example)"
fi

echo ""
echo -e "${BLUE}🚀 CHECKING RENDER DEPLOYMENT...${NC}"
echo "-----------------------------------------"

# Check Render deployment
BACKEND_URL="https://pathwaygh-backend.onrender.com"
FRONTEND_URL="https://pathwaygh-frontend.onrender.com"

echo -e "Backend URL: ${BLUE}$BACKEND_URL${NC}"
echo -e "Frontend URL: ${BLUE}$FRONTEND_URL${NC}"

# Test backend health
echo ""
echo -e "${BLUE}Testing backend health...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health" | grep -q "200"; then
    echo -e "${GREEN}✅${NC} Backend is live and healthy!"
else
    echo -e "${YELLOW}⚠️${NC} Backend health check failed (may not be deployed yet)"
fi

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}           VERIFICATION SUMMARY          ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo -e "Total tests: $TOTAL_TESTS"
echo -e "${GREEN}✅ Passed: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED! Your PathwayGH enhancements are complete!${NC}"
    echo ""
    echo -e "${GREEN}Your project is ready for hackathon submission!${NC}"
    echo ""
    echo -e "Live Demo: ${BLUE}https://pathwaygh-frontend.onrender.com${NC}"
    echo -e "API Docs: ${BLUE}https://pathwaygh-backend.onrender.com/api/docs${NC}"
    echo -e "GitHub: ${BLUE}https://github.com/ZziemWellu/pathwaygh-mvp${NC}"
else
    echo -e "${YELLOW}⚠️ Some checks failed. Please review the missing items above.${NC}"
    echo ""
    echo -e "To fix missing files, run:"
    echo -e "${BLUE}./scripts/fix_enhancements.sh${NC}"
fi

echo ""
echo -e "${BLUE}=========================================${NC}"
