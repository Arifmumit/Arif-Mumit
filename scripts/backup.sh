#!/usr/bin/env bash
set -e

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
TAG_DATE=$(date +"%Y%m%d_%H%M%S")
MESSAGE="${1:-"Auto-backup checkpoint: $TIMESTAMP"}"

mkdir -p backups

ARCHIVE_NAME="backups/pixelforge_backup_${TIMESTAMP}.tar.gz"

echo "Creating compressed codebase archive: $ARCHIVE_NAME"
tar --exclude='./node_modules' \
    --exclude='./dist' \
    --exclude='./.git' \
    --exclude='./backups' \
    -czf "$ARCHIVE_NAME" .

ARCHIVE_SIZE=$(ls -lh "$ARCHIVE_NAME" | awk '{print $5}')

# Update git tracking
git config user.name "PixelForge Backup" || true
git config user.email "backup@pixelforge.local" || true
git add .
git commit -m "$MESSAGE" || true
git tag "checkpoint-${TAG_DATE}" || true

# Append to history
echo "| $TIMESTAMP | \`$ARCHIVE_NAME\` | $ARCHIVE_SIZE | $MESSAGE |" >> backups/BACKUP_HISTORY.md

echo "✅ Backup created successfully: $ARCHIVE_NAME ($ARCHIVE_SIZE)"
