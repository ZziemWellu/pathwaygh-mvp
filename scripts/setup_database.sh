#!/bin/bash
# Complete Database Setup Script for Pathway AI

echo "========================================="
echo "  🗄️ PATHWAY AI DATABASE SETUP"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if PostgreSQL is running
echo "1️⃣ Checking PostgreSQL status..."
if sudo service postgresql status | grep -q "online"; then
    echo -e "  ${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "  ${YELLOW}⚠️ PostgreSQL is not running. Starting...${NC}"
    sudo service postgresql start
    sleep 2
    if sudo service postgresql status | grep -q "online"; then
        echo -e "  ${GREEN}✅ PostgreSQL started${NC}"
    else
        echo -e "  ${RED}❌ Failed to start PostgreSQL${NC}"
        exit 1
    fi
fi

echo ""

# Check if database exists
echo "2️⃣ Checking if database exists..."
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='pathway_ai'")
if [ "$DB_EXISTS" = "1" ]; then
    echo -e "  ${YELLOW}⚠️ Database 'pathway_ai' already exists${NC}"
    echo "  Do you want to drop and recreate it? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "  Dropping existing database..."
        sudo -u postgres psql -c "DROP DATABASE pathway_ai;"
        echo -e "  ${GREEN}✅ Database dropped${NC}"
    else
        echo -e "  ${YELLOW}⚠️ Keeping existing database${NC}"
        exit 0
    fi
fi

# Create the database
echo ""
echo "3️⃣ Creating database..."
sudo -u postgres psql -c "CREATE DATABASE pathway_ai;"
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✅ Database 'pathway_ai' created${NC}"
else
    echo -e "  ${RED}❌ Failed to create database${NC}"
    exit 1
fi

# Create the schema
echo ""
echo "4️⃣ Creating schema..."
if [ -f "database/schemas/complete_schema.sql" ]; then
    sudo -u postgres psql -d pathway_ai -f database/schemas/complete_schema.sql
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✅ Schema created successfully${NC}"
    else
        echo -e "  ${RED}❌ Failed to create schema${NC}"
        exit 1
    fi
else
    echo -e "  ${RED}❌ Schema file not found: database/schemas/complete_schema.sql${NC}"
    exit 1
fi

# Verify tables were created
echo ""
echo "5️⃣ Verifying tables..."
TABLES=$(sudo -u postgres psql -d pathway_ai -tAc "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;")
if [ -n "$TABLES" ]; then
    echo -e "  ${GREEN}✅ Tables created:${NC}"
    echo "$TABLES" | while read -r table; do
        echo "    - $table"
    done
else
    echo -e "  ${RED}❌ No tables found${NC}"
    exit 1
fi

# Show table counts
echo ""
echo "6️⃣ Table row counts:"
for table in $TABLES; do
    count=$(sudo -u postgres psql -d pathway_ai -tAc "SELECT COUNT(*) FROM $table;")
    echo "    $table: $count rows"
done

echo ""
echo "========================================="
echo -e "  ${GREEN}✅ DATABASE SETUP COMPLETE!${NC}"
echo "========================================="
echo ""
echo "📋 Database: pathway_ai"
echo "📍 Host: localhost"
echo "🔌 Port: 5432"
echo ""
echo "🔧 To connect:"
echo "  psql -d pathway_ai -U postgres"
echo ""
echo "📊 To view tables:"
echo "  \\dt"
echo ""

