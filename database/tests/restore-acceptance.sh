#!/usr/bin/env bash
set -euo pipefail
umask 077
tmp=$(mktemp -d)
trap 'rm -rf -- "$tmp"' EXIT
pg_dump -Fc "$PGDATABASE" > "$tmp/database.dump"
pg_restore -l "$tmp/database.dump" > "$tmp/catalog.txt"
(cd "$tmp"; sha256sum database.dump catalog.txt > SHA256SUMS; sha256sum -c SHA256SUMS)
# Dedicated disposable CI server only.
createdb one_restore_test
pg_restore --exit-on-error --no-owner -d one_restore_test "$tmp/database.dump"
psql -v ON_ERROR_STOP=1 -d one_restore_test -f database/tests/acceptance.sql
