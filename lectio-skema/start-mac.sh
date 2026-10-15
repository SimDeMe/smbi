#!/bin/bash
# Used by Lectio.app; no terminal or interactive shell configuration needed.
set -eu
umask 077
cd "$(dirname "$0")"
app_dir="$PWD"
node_bin="$(command -v node || true)"
if [ -z "$node_bin" ]; then
  for candidate in /opt/homebrew/bin/node /usr/local/bin/node "$HOME"/.nvm/versions/node/*/bin/node; do
    if [ -x "$candidate" ]; then node_bin="$candidate"; fi
  done
fi
if [ -z "$node_bin" ]; then
  echo 'Lectio kan ikke finde Node.js på computeren.' >&2
  exit 1
fi
url='http://127.0.0.1:8787/'
ready() {
  /usr/bin/curl --fail --silent --max-time 2 "${url}api/status" |
    "$node_bin" --input-type=module -e 'let s=""; for await (const c of process.stdin) s+=c; try {const v=JSON.parse(s); process.exit(v.config && typeof v.needsLogin === "boolean" && typeof v.syncing === "boolean" ? 0 : 1);} catch {process.exit(1);}'
}
if ! ready; then
  if /usr/sbin/lsof -nP -iTCP:8787 -sTCP:LISTEN >/dev/null 2>&1; then
    echo 'Et andet program bruger port 8787. Luk det, og åbn Lectio igen.' >&2
    exit 1
  fi
  mkdir -p .local
  chmod 700 .local
  PORT=8787 /usr/bin/nohup "$node_bin" "$app_dir/server.mjs" </dev/null >>.local/server.log 2>&1 &
  server_pid=$!
  for attempt in {1..40}; do
    if ready; then break; fi
    if ! kill -0 "$server_pid" 2>/dev/null; then break; fi
    /bin/sleep 0.25
  done
  if ! ready; then
    echo "Lectio kunne ikke starte. Fejloplysninger ligger i $app_dir/.local/server.log." >&2
    exit 1
  fi
fi
if [ -d '/Applications/Brave Browser.app' ]; then
  /usr/bin/open -a '/Applications/Brave Browser.app' "$url"
else
  /usr/bin/open "$url"
fi
