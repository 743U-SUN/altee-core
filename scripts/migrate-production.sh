#!/bin/bash

# Production migration script
# This script should be run before deploying new versions with schema changes

set -e

echo "🚀 Starting production migration..."

# Check if database is accessible
echo "📋 Checking database connectivity..."
docker compose -f compose.prod.yaml exec db pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-altee_prod}

if [ $? -ne 0 ]; then
    echo "❌ Database is not ready. Please ensure PostgreSQL is running."
    exit 1
fi

# Create backup before migration
echo "💾 Creating database backup..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"

docker compose -f compose.prod.yaml exec db pg_dump -U ${POSTGRES_USER:-postgres} ${POSTGRES_DB:-altee_prod} > "backups/${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "✅ Backup created: backups/${BACKUP_FILE}"
else
    echo "❌ Backup failed. Aborting migration."
    exit 1
fi

# Run migration
echo "🔄 Running database migration..."
docker compose -f compose.prod.yaml exec app npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
else
    echo "❌ Migration failed. Please check the logs and consider restoring from backup."
    exit 1
fi

echo "🎉 Production migration completed!"