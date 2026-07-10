#!/bin/bash
# Complete Database Creation Script

echo "========================================="
echo "  🗄️ PATHWAY AI DATABASE CREATION"
echo "========================================="
echo ""

# Try to start PostgreSQL
echo "1️⃣ Starting PostgreSQL..."
sudo service postgresql start 2>/dev/null || sudo systemctl start postgresql
sleep 2

# Check if PostgreSQL is running
if sudo service postgresql status | grep -q "active"; then
    echo "  ✅ PostgreSQL is running"
else
    echo "  ❌ PostgreSQL is not running. Trying alternative..."
    sudo systemctl restart postgresql 2>/dev/null || sudo service postgresql restart
    sleep 2
    if pg_isready -q; then
        echo "  ✅ PostgreSQL is running"
    else
        echo "  ❌ PostgreSQL failed to start"
        echo "  Trying to reinstall..."
        sudo apt install --reinstall postgresql -y
        sudo service postgresql start
        sleep 2
    fi
fi

echo ""
echo "2️⃣ Creating database..."
# Check if database exists
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='pathway_ai'" 2>/dev/null)

if [ "$DB_EXISTS" = "1" ]; then
    echo "  ⚠️ Database 'pathway_ai' already exists"
    echo "  Dropping existing database..."
    sudo -u postgres psql -c "DROP DATABASE pathway_ai;" 2>/dev/null
    echo "  ✅ Database dropped"
fi

# Create database
sudo -u postgres psql -c "CREATE DATABASE pathway_ai;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "  ✅ Database 'pathway_ai' created"
else
    echo "  ❌ Failed to create database"
    exit 1
fi

echo ""
echo "3️⃣ Creating schema..."
if [ -f "database/schemas/complete_schema.sql" ]; then
    sudo -u postgres psql -d pathway_ai -f database/schemas/complete_schema.sql 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "  ✅ Schema created successfully"
    else
        echo "  ❌ Failed to create schema"
        exit 1
    fi
else
    echo "  ❌ Schema file not found: database/schemas/complete_schema.sql"
    exit 1
fi

echo ""
echo "4️⃣ Verifying tables..."
TABLES=$(sudo -u postgres psql -d pathway_ai -tAc "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;" 2>/dev/null)

if [ -n "$TABLES" ]; then
    echo "  ✅ Tables created:"
    echo "$TABLES" | while read -r table; do
        count=$(sudo -u postgres psql -d pathway_ai -tAc "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
        echo "    - $table: $count rows"
    done
else
    echo "  ❌ No tables found"
    exit 1
fi

echo ""
echo "========================================="
echo "  ✅ DATABASE SETUP COMPLETE!"
echo "========================================="
echo ""
echo "📋 Database: pathway_ai"
echo "📍 Host: localhost"
echo "🔌 Port: 5432"
echo ""

