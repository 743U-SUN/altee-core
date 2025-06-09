#!/bin/bash

# Database backup script for production
# Usage: ./scripts/backup-database.sh [optional-description]

set -e

DESCRIPTION=${1:-"manual"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}_${DESCRIPTION}.sql"
BACKUP_DIR="backups"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "💾 Creating database backup..."
echo "📅 Timestamp: ${TIMESTAMP}"
echo "📝 Description: ${DESCRIPTION}"

# Create backup using docker compose
docker compose -f compose.prod.yaml exec -T db pg_dump \
    -U ${POSTGRES_USER:-postgres} \
    -d ${POSTGRES_DB:-altee_prod} \
    --verbose \
    --clean \
    --no-owner \
    --no-privileges > "${BACKUP_DIR}/${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully!"
    echo "📁 Backup file: ${BACKUP_DIR}/${BACKUP_FILE}"
    
    # Compress the backup
    gzip "${BACKUP_DIR}/${BACKUP_FILE}"
    echo "🗜️  Backup compressed: ${BACKUP_DIR}/${BACKUP_FILE}.gz"
    
    # Show file size
    ls -lh "${BACKUP_DIR}/${BACKUP_FILE}.gz"
    
    # Clean up old backups (keep last 10)
    echo "🧹 Cleaning up old backups (keeping last 10)..."
    cd "${BACKUP_DIR}"
    ls -t backup_*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm
    cd ..
    
    echo "🎉 Backup process completed!"
else
    echo "❌ Backup failed!"
    exit 1
fi