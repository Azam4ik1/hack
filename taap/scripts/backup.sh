#!/bin/sh
# Daily Postgres dump, keep 14 days. Isolated TAAP volume only.
set -eu
mkdir -p /backups
while true; do
  ts=$(date -u +%Y%m%dT%H%M%SZ)
  dest="/backups/taap-${ts}.sql.gz"
  if pg_dump -h "${PGHOST:-db}" -U "${PGUSER:-taap}" -d "${PGDATABASE:-taap}" | gzip > "${dest}.tmp"; then
    mv "${dest}.tmp" "$dest"
  else
    rm -f "${dest}.tmp"
  fi
  find /backups -name 'taap-*.sql.gz' -mtime +14 -delete 2>/dev/null || true
  sleep 86400
done
