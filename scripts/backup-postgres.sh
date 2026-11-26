#!/usr/bin/env bash
set -euo pipefail
umask 077
dest=${1:?Specify a private backup directory}
mkdir -p "$dest"
stage=$(mktemp -d "$dest/.one-backup.XXXXXXXX")
trap 'rm -rf -- "$stage"' EXIT
docker compose exec -T postgres pg_dump -U postgres -d one_dev -Fc > "$stage/database.dump"
test -s "$stage/database.dump"
docker compose exec -T postgres pg_restore -l < "$stage/database.dump" > "$stage/catalog.txt"
(cd "$stage"; if command -v sha256sum >/dev/null; then sha256sum database.dump catalog.txt > SHA256SUMS; else shasum -a 256 database.dump catalog.txt > SHA256SUMS; fi)
name="one-$(date -u +%Y%m%dT%H%M%SZ)-${stage##*.}"
mv "$stage" "$dest/$name"
printf 'Backup created (restore not verified): %s\n' "$dest/$name"
