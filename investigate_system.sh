#!/bin/bash
# File: investigate_system.sh
# Purpose: Comprehensive investigation of PATHWAY AI frontend-backend connection issues
# Usage: chmod +x investigate_system.sh && ./investigate_system.sh

echo "================================================================"
echo "🔍 PATHWAY AI - COMPREHENSIVE SYSTEM INVESTIGATION"
echo "================================================================"
echo "Started: $(date)"
echo "================================================================"

# Configuration
PROJECT_DIR=~/projects/pathwaygh-mvp
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"
REPORT_FILE="investigation_report_$(date +%Y%m%d_%H%M%S).txt"

# Create report file
echo "================================================================" > "$REPORT_FILE"
echo "🔍 PATHWAY AI - INVESTIGATION REPORT" >> "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "================================================================" >> "$REPORT_FILE"

# Helper function to log to both console and file
log() {
    echo "$1" | tee -a "$REPORT_FILE"
}

log ""
log "📋 INVESTIGATION STEP 1: ENVIRONMENT CHECK"
log "================================================================"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    log "❌ ERROR: Project directory not found: $PROJECT_DIR"
    exit 1
fi
log "✅ Project directory found: $PROJECT_DIR"

# Check if frontend exists
if [ ! -d "$FRONTEND_DIR" ]; then
    log "❌ ERROR: Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi
log "✅ Frontend directory found: $FRONTEND_DIR"

# Check if backend exists
if [ ! -d "$BACKEND_DIR" ]; then
    log "❌ ERROR: Backend directory not found: $BACKEND_DIR"
    exit 1
fi
log "✅ Backend directory found: $BACKEND_DIR"

log ""
log "📋 INVESTIGATION STEP 2: ENVIRONMENT VARIABLES"
log "================================================================"

# Check .env files
log "Checking .env files in frontend..."
ENV_FILES=$(ls -la "$FRONTEND_DIR"/.env* 2>/dev/null)
if [ -z "$ENV_FILES" ]; then
    log "⚠️ No .env files found in frontend directory"
else
    log "✅ .env files found:"
    echo "$ENV_FILES" | tee -a "$REPORT_FILE"
fi

# Check VITE_API_URL
log ""
log "Checking VITE_API_URL values..."
for env_file in "$FRONTEND_DIR"/.env*; do
    if [ -f "$env_file" ]; then
        log "  $(basename $env_file):"
        grep -i "VITE_API_URL" "$env_file" 2>/dev/null | tee -a "$REPORT_FILE" || log "    (no VITE_API_URL found)"
    fi
done

# Check vite.config.js
log ""
log "Checking vite.config.js..."
if [ -f "$FRONTEND_DIR/vite.config.js" ]; then
    log "✅ vite.config.js found"
    log "Proxy configuration:"
    grep -A10 "proxy" "$FRONTEND_DIR/vite.config.js" 2>/dev/null | head -20 | tee -a "$REPORT_FILE"
else
    log "❌ vite.config.js not found"
fi

log ""
log "📋 INVESTIGATION STEP 3: API SERVICE"
log "================================================================"

# Check api.js
API_FILE="$FRONTEND_DIR/src/services/api.js"
if [ -f "$API_FILE" ]; then
    log "✅ API service found: $API_FILE"
    log ""
    log "API Service Content (key sections):"
    log "----------------------------------------"
    grep -v "^import\|^//\|^export\|^$" "$API_FILE" | head -50 | tee -a "$REPORT_FILE"
    
    # Check for important patterns
    log ""
    log "Checking API service patterns:"
    log "  - axios instance: $(grep -c "axios.create" "$API_FILE") instances"
    log "  - baseURL: $(grep -c "baseURL" "$API_FILE") references"
    log "  - Authorization header: $(grep -c "Authorization\|token" "$API_FILE") references"
    log "  - interceptor: $(grep -c "interceptors" "$API_FILE") references"
else
    log "❌ API service not found: $API_FILE"
fi

log ""
log "📋 INVESTIGATION STEP 4: BACKEND STATUS"
log "================================================================"

# Check local backend
log "Checking local backend (http://localhost:8001)..."
LOCAL_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health 2>/dev/null)
if [ "$LOCAL_HEALTH" = "200" ]; then
    log "✅ Local backend is running (HTTP $LOCAL_HEALTH)"
    
    # Test specific endpoints
    log ""
    log "Testing local endpoints:"
    
    LEARN_RESPONSE=$(curl -s http://localhost:8001/api/learn/courses 2>/dev/null)
    if [ -n "$LEARN_RESPONSE" ] && [ "$LEARN_RESPONSE" != "null" ]; then
        log "  ✅ /api/learn/courses - Working (returns data)"
        log "     Preview: $(echo "$LEARN_RESPONSE" | head -c 200)..."
    else
        log "  ❌ /api/learn/courses - Not working or empty"
    fi
    
    EXPLORE_RESPONSE=$(curl -s http://localhost:8001/api/explore/careers 2>/dev/null)
    if [ -n "$EXPLORE_RESPONSE" ] && [ "$EXPLORE_RESPONSE" != "null" ]; then
        log "  ✅ /api/explore/careers - Working (returns data)"
        log "     Preview: $(echo "$EXPLORE_RESPONSE" | head -c 200)..."
    else
        log "  ❌ /api/explore/careers - Not working or empty"
    fi
    
    PRACTICE_RESPONSE=$(curl -s http://localhost:8001/api/practice/subjects 2>/dev/null)
    if [ -n "$PRACTICE_RESPONSE" ] && [ "$PRACTICE_RESPONSE" != "null" ]; then
        log "  ✅ /api/practice/subjects - Working (returns data)"
        log "     Preview: $(echo "$PRACTICE_RESPONSE" | head -c 200)..."
    else
        log "  ❌ /api/practice/subjects - Not working or empty"
    fi
    
    DASHBOARD_RESPONSE=$(curl -s http://localhost:8001/api/dashboard/ 2>/dev/null)
    if [ -n "$DASHBOARD_RESPONSE" ] && [ "$DASHBOARD_RESPONSE" != "null" ]; then
        log "  ✅ /api/dashboard - Working (returns data)"
    else
        log "  ❌ /api/dashboard - Not working or empty"
    fi
else
    log "❌ Local backend is not running (HTTP $LOCAL_HEALTH)"
fi

# Check Render backend
log ""
log "Checking Render backend (https://pathwaygh-backend.onrender.com)..."
RENDER_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://pathwaygh-backend.onrender.com/health 2>/dev/null)
if [ "$RENDER_HEALTH" = "200" ]; then
    log "✅ Render backend is running (HTTP $RENDER_HEALTH)"
else
    log "❌ Render backend is not responding (HTTP $RENDER_HEALTH)"
fi

log ""
log "📋 INVESTIGATION STEP 5: FRONTEND MODULES"
log "================================================================"

# Function to check a module
check_module() {
    local module_name=$1
    local module_dir="$FRONTEND_DIR/src/modules/$module_name"
    
    log ""
    log "Checking $module_name module:"
    
    if [ ! -d "$module_dir" ]; then
        log "  ❌ Module directory not found: $module_dir"
        return
    fi
    log "  ✅ Module directory exists"
    
    # Check for index.jsx
    if [ -f "$module_dir/index.jsx" ]; then
        log "  ✅ index.jsx found"
        # Check exports
        if grep -q "export default" "$module_dir/index.jsx"; then
            log "  ✅ Has default export"
        else
            log "  ⚠️ No default export found"
        fi
    else
        log "  ❌ index.jsx not found"
    fi
    
    # Check main module file
    local main_file="$module_dir/${module_name^}Module.jsx"
    if [ ! -f "$main_file" ]; then
        main_file="$module_dir/${module_name}.jsx"
    fi
    if [ ! -f "$main_file" ]; then
        main_file="$module_dir/${module_name}Module.jsx"
    fi
    if [ ! -f "$main_file" ]; then
        main_file="$module_dir/${module_name^}.jsx"
    fi
    
    if [ -f "$main_file" ]; then
        log "  ✅ Main module file found: $(basename $main_file)"
        
        # Check for API calls
        log "  Checking for API calls:"
        API_CALLS=$(grep -c "api\\.\|axios\|fetch" "$main_file")
        log "    - API calls: $API_CALLS"
        
        # Check for useEffect
        USE_EFFECT=$(grep -c "useEffect" "$main_file")
        log "    - useEffect hooks: $USE_EFFECT"
        
        # Check for useState
        USE_STATE=$(grep -c "useState" "$main_file")
        log "    - useState hooks: $USE_STATE"
        
        # Check for loading state
        if grep -q "loading" "$main_file"; then
            log "    - Loading state: ✅"
        else
            log "    - Loading state: ❌"
        fi
        
        # Check for error state
        if grep -q "error" "$main_file"; then
            log "    - Error state: ✅"
        else
            log "    - Error state: ❌"
        fi
        
        # Check for conditional rendering
        if grep -q "if.*loading\|loading &&\|!loading" "$main_file"; then
            log "    - Conditional rendering: ✅"
        else
            log "    - Conditional rendering: ❌"
        fi
    else
        log "  ❌ Main module file not found"
        log "     Searched for: ${module_name^}Module.jsx, ${module_name}.jsx"
    fi
}

# Check all modules
check_module "home"
check_module "learn"
check_module "explore"
check_module "practice"
check_module "plan"
check_module "profile"

log ""
log "📋 INVESTIGATION STEP 6: ROUTING"
log "================================================================"

# Check App.jsx
APP_FILE="$FRONTEND_DIR/src/App.jsx"
if [ -f "$APP_FILE" ]; then
    log "✅ App.jsx found"
    
    log ""
    log "Checking routes in App.jsx:"
    log "----------------------------------------"
    grep -E "Route|path=|\"learn\"|\"explore\"|\"practice\"|\"plan\"|\"profile\"|\"home\"" "$APP_FILE" | head -20 | tee -a "$REPORT_FILE"
    
    log ""
    log "Checking imports in App.jsx:"
    log "----------------------------------------"
    grep -E "import.*Module|import.*from.*modules" "$APP_FILE" | head -20 | tee -a "$REPORT_FILE"
    
    log ""
    log "Checking navigation in App.jsx:"
    log "----------------------------------------"
    grep -E "navigate|useNavigate|<Link|NavLink" "$APP_FILE" | head -20 | tee -a "$REPORT_FILE"
else
    log "❌ App.jsx not found"
fi

# Check navigation component
log ""
log "Checking navigation component..."
NAV_FILE=$(find "$FRONTEND_DIR/src" -name "*Navigation*" -type f 2>/dev/null | head -1)
if [ -n "$NAV_FILE" ]; then
    log "✅ Navigation component found: $NAV_FILE"
    log ""
    log "Navigation links:"
    grep -E "to=|href=|path=" "$NAV_FILE" | head -20 | tee -a "$REPORT_FILE"
else
    log "❌ No navigation component found"
fi

log ""
log "📋 INVESTIGATION STEP 7: AUTHENTICATION"
log "================================================================"

# Check for auth handling
log "Checking authentication implementation..."
AUTH_FILE="$FRONTEND_DIR/src/services/auth.js"
if [ -f "$AUTH_FILE" ]; then
    log "✅ Auth service found: $AUTH_FILE"
else
    log "⚠️ Auth service not found (may be integrated in api.js or App.jsx)"
fi

# Check for localStorage usage
log ""
log "Checking for localStorage usage (token storage):"
grep -r "localStorage\|sessionStorage" "$FRONTEND_DIR/src" 2>/dev/null | grep -v "node_modules" | head -10 | tee -a "$REPORT_FILE"

log ""
log "📋 INVESTIGATION STEP 8: RENDER CONDITIONS"
log "================================================================"

# Check for common rendering issues
log "Checking for potential rendering issues:"
log "----------------------------------------"

for module in home learn explore practice plan profile; do
    module_file="$FRONTEND_DIR/src/modules/$module/${module^}Module.jsx"
    if [ ! -f "$module_file" ]; then
        module_file="$FRONTEND_DIR/src/modules/$module/${module}.jsx"
    fi
    if [ -f "$module_file" ]; then
        log ""
        log "Module: $module"
        if grep -q "return null" "$module_file"; then
            log "  ⚠️ Has 'return null' - may hide content"
        fi
        if grep -q "return <div>Loading" "$module_file"; then
            log "  ✅ Has loading state"
        fi
        if grep -q "return <div>Error" "$module_file"; then
            log "  ✅ Has error state"
        fi
        if grep -q "if (!.*\\.length)" "$module_file"; then
            log "  ⚠️ Has length check - may hide content if empty"
        fi
    fi
done

log ""
log "📋 INVESTIGATION STEP 9: DATA FILES"
log "================================================================"

# Check data files
log "Checking backend data files:"

# Courses
COURSES_DIR="$BACKEND_DIR/data/courses"
if [ -d "$COURSES_DIR" ]; then
    COURSE_COUNT=$(find "$COURSES_DIR" -name "*.json" 2>/dev/null | wc -l)
    log "  ✅ Courses directory found: $COURSES_DIR"
    log "     Course files: $COURSE_COUNT"
    find "$COURSES_DIR" -name "*.json" 2>/dev/null | head -5 | tee -a "$REPORT_FILE"
else
    log "  ❌ Courses directory not found"
fi

# Practice data
PRACTICE_DIR="$BACKEND_DIR/data/practice"
if [ -d "$PRACTICE_DIR" ]; then
    PRACTICE_COUNT=$(find "$PRACTICE_DIR" -name "*.json" 2>/dev/null | wc -l)
    log "  ✅ Practice data found: $PRACTICE_DIR"
    log "     Practice files: $PRACTICE_COUNT"
else
    log "  ❌ Practice directory not found"
fi

# Explore data
EXPLORE_DIR="$BACKEND_DIR/data/explore"
if [ -d "$EXPLORE_DIR" ]; then
    EXPLORE_COUNT=$(find "$EXPLORE_DIR" -name "*.json" 2>/dev/null | wc -l)
    log "  ✅ Explore data found: $EXPLORE_DIR"
    log "     Explore files: $EXPLORE_COUNT"
else
    log "  ❌ Explore directory not found"
fi

# Universities data
UNI_FILE="$BACKEND_DIR/data/universities.json"
if [ -f "$UNI_FILE" ]; then
    UNI_COUNT=$(grep -c "\"name\"" "$UNI_FILE" 2>/dev/null || echo "0")
    log "  ✅ Universities file found: $UNI_FILE"
    log "     Universities: $UNI_COUNT"
else
    log "  ❌ Universities file not found"
fi

# Cutoffs data
CUTOFF_FILE="$BACKEND_DIR/data/cutoffs.json"
if [ -f "$CUTOFF_FILE" ]; then
    CUTOFF_COUNT=$(grep -c "\"cutoff\"" "$CUTOFF_FILE" 2>/dev/null || echo "0")
    log "  ✅ Cutoffs file found: $CUTOFF_FILE"
    log "     Cutoffs: $CUTOFF_COUNT"
else
    log "  ❌ Cutoffs file not found"
fi

log ""
log "📋 INVESTIGATION STEP 10: BACKEND ROUTERS"
log "================================================================"

# Check main.py for router imports
MAIN_FILE="$BACKEND_DIR/main.py"
if [ -f "$MAIN_FILE" ]; then
    log "✅ main.py found"
    log ""
    log "Router imports in main.py:"
    grep -E "from modules.*router|import.*router" "$MAIN_FILE" | head -30 | tee -a "$REPORT_FILE"
    
    log ""
    log "Router registrations in main.py:"
    grep -E "app.include_router" "$MAIN_FILE" | head -30 | tee -a "$REPORT_FILE"
else
    log "❌ main.py not found"
fi

log ""
log "📋 INVESTIGATION STEP 11: SUMMARY"
log "================================================================"

log "✅ INVESTIGATION COMPLETE"
log "================================================================"
log "Report saved to: $REPORT_FILE"
log "================================================================"

# Print quick summary
log ""
log "📊 QUICK STATUS SUMMARY:"
log "================================================================"

if [ "$LOCAL_HEALTH" = "200" ]; then
    log "✅ Local Backend: Running"
else
    log "❌ Local Backend: Not Running"
fi

if [ "$RENDER_HEALTH" = "200" ]; then
    log "✅ Render Backend: Running"
else
    log "❌ Render Backend: Not Running"
fi

log ""
log "🔍 MANUAL CHECKS REQUIRED:"
log "================================================================"
log "1. Open browser DevTools (F12)"
log "2. Go to Console tab - look for errors"
log "3. Go to Network tab - look for API requests"
log "4. Install React DevTools if not installed"
log "5. Inspect components in React DevTools"
log "6. Check props and state of each module"
log "7. Test each tab (Learn, Explore, Practice, Plan, Profile)"
log "8. Take screenshots of Console and Network tabs"
log "================================================================"

echo ""
echo "================================================================"
echo "✅ Investigation complete!"
echo "📄 Report saved to: $REPORT_FILE"
echo "================================================================"
echo ""
echo "Next steps:"
echo "1. Review the report at: $REPORT_FILE"
echo "2. Open browser and perform manual checks"
echo "3. Share the report and browser findings"
echo "================================================================"
# Quick backend verification
echo "=== BACKEND VERIFICATION ==="

# Health check
curl -s http://localhost:8001/health | python -m json.tool

# Learn endpoints
curl -s http://localhost:8001/api/learn/courses | python -m json.tool | head -50

# Explore endpoints
curl -s http://localhost:8001/api/explore/careers | python -m json.tool | head -50

# Practice endpoints
curl -s http://localhost:8001/api/practice/subjects | python -m json.tool | head -50

# Dashboard endpoints (with user ID)
curl -s http://localhost:8001/api/dashboard/user_test | python -m json.tool | head -50
# Check if modules have proper structure
cd ~/projects/pathwaygh-mvp/frontend/src/modules

echo "=== MODULE STRUCTURE CHECK ==="
for module in home learn explore practice plan profile; do
    echo ""
    echo "$module:"
    ls -la "$module/" 2>/dev/null | head -5 || echo "  ❌ Not found"
    if [ -f "$module/index.jsx" ]; then
        echo "  ✅ index.jsx"
    else
        echo "  ❌ Missing index.jsx"
    fi
done

