#!/bin/bash
# Database Verification

echo "========================================="
echo "  🗄️ DATABASE VERIFICATION"
echo "========================================="
echo ""

# Check PostgreSQL status
echo "1. Checking PostgreSQL status..."
if sudo service postgresql status > /dev/null 2>&1; then
    echo "  ✅ PostgreSQL is running"
else
    echo "  ❌ PostgreSQL is NOT running"
    echo "  Start with: sudo service postgresql start"
    exit 1
fi

# Check database exists
echo ""
echo "2. Checking database..."
sudo -u postgres psql -lqt | grep pathway_ai > /dev/null && echo "  ✅ Database 'pathway_ai' exists" || echo "  ❌ Database 'pathway_ai' missing"

# Check tables
echo ""
echo "3. Checking tables..."
sudo -u postgres psql -d pathway_ai -c "\dt" | grep -q "users" && echo "  ✅ users table exists" || echo "  ❌ users table missing"
sudo -u postgres psql -d pathway_ai -c "\dt" | grep -q "courses" && echo "  ✅ courses table exists" || echo "  ❌ courses table missing"
sudo -u postgres psql -d pathway_ai -c "\dt" | grep -q "enrollments" && echo "  ✅ enrollments table exists" || echo "  ❌ enrollments table missing"
sudo -u postgres psql -d pathway_ai -c "\dt" | grep -q "payments" && echo "  ✅ payments table exists" || echo "  ❌ payments table missing"
sudo -u postgres psql -d pathway_ai -c "\dt" | grep -q "live_classes" && echo "  ✅ live_classes table exists" || echo "  ❌ live_classes table missing"

# Check seed data
echo ""
echo "4. Checking seed data..."
sudo -u postgres psql -d pathway_ai -c "SELECT COUNT(*) FROM users;" | grep -q "0" && echo "  ⚠️ No users found (seed data may need to be added)" || echo "  ✅ Users found"
sudo -u postgres psql -d pathway_ai -c "SELECT COUNT(*) FROM courses;" | grep -q "0" && echo "  ⚠️ No courses found" || echo "  ✅ Courses found"

echo ""
echo "✅ Database verification complete"
