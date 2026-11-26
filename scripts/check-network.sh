#!/usr/bin/env bash
set -euo pipefail
app=$(docker compose ps -q application)
db=$(docker compose ps -q postgres)
test -n "$app" && test -n "$db"
docker inspect "$app" "$db" | python3 -c '
import json,sys
app,db=json.load(sys.stdin)
a=app["NetworkSettings"]["Networks"]
d=db["NetworkSettings"]["Networks"]
assert not set(a)&set(d), "Demo and database share network"
assert not any(db["NetworkSettings"]["Ports"].values()), "Database published"
ports=app["NetworkSettings"]["Ports"]["4173/tcp"]
assert ports and all(p["HostIp"]=="127.0.0.1" for p in ports), "Application not loopback-only"
print("Container network isolation checks passed")
'
for net in $(docker inspect --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$db"); do
  test "$(docker network inspect --format '{{.Internal}}' "$net")" = true
done
