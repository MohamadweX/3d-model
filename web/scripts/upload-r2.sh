#!/usr/bin/env bash
set -euo pipefail

: "${R2_ACCOUNT_ID:?set R2_ACCOUNT_ID}"
: "${R2_BUCKET:?set R2_BUCKET}"
: "${AWS_ACCESS_KEY_ID:?set AWS_ACCESS_KEY_ID}"
: "${AWS_SECRET_ACCESS_KEY:?set AWS_SECRET_ACCESS_KEY}"

ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
SOURCE="$(cd "$(dirname "$0")/../../3D_Asset_Library" && pwd)"

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI is required: pip install awscli" >&2
  exit 1
fi

echo "Uploading $SOURCE to s3://$R2_BUCKET via $ENDPOINT"

aws s3 cp "$SOURCE" "s3://${R2_BUCKET}/" \
  --recursive \
  --endpoint-url "$ENDPOINT" \
  --exclude "_tools/*" \
  --exclude "viewer/*" \
  --exclude "00_START_HERE/*" \
  --exclude "*.md" \
  --exclude "*.py" \
  --exclude "*.log" \
  --exclude "*.jsonl"

echo "Done. Set ASSETS_BASE to the bucket public URL, then run: npm run build"
