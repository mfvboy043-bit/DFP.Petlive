#!/bin/zsh
# Start Petlive preview as a double-fork daemon (survives Cursor).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-5173}"
UID_NUM="$(id -u)"
LABEL="app.petlive.preview"

# Unload broken LaunchAgent if present (Desktop TCC often makes it exit 78).
launchctl bootout "gui/${UID_NUM}/${LABEL}" 2>/dev/null || true
launchctl unload "$HOME/Library/LaunchAgents/${LABEL}.plist" 2>/dev/null || true

"$ROOT/deploy/stop-preview.sh" >/dev/null 2>&1 || true
if lsof -tiTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  lsof -tiTCP:"$PORT" -sTCP:LISTEN | xargs kill -9 2>/dev/null || true
  sleep 0.3
fi

: >"$ROOT/deploy/preview-server.out"
: >"$ROOT/deploy/preview-access.log"

# Start via osascript so the job is owned by the GUI user session, not Cursor.
osascript <<EOF
do shell script "cd '$ROOT' && /usr/bin/python3 '$ROOT/deploy/serve-preview.py' --port $PORT --daemon >>'$ROOT/deploy/preview-server.out' 2>&1"
EOF

ok=0
for _ in {1..30}; do
  sleep 0.2
  if /usr/bin/python3 "$ROOT/deploy/serve-preview.py" --port "$PORT" --check; then
    ok=1
    break
  fi
done

if [[ "$ok" != "1" ]]; then
  echo "Daemon start failed. See $ROOT/deploy/preview-server.out"
  tail -30 "$ROOT/deploy/preview-server.out" || true
  exit 1
fi

WIFI="$(ipconfig getifaddr en1 2>/dev/null || true)"
TS="/Applications/Tailscale.app/Contents/MacOS/Tailscale"
TSIP=""
[[ -x "$TS" ]] && TSIP="$("$TS" ip -4 2>/dev/null | head -1 || true)"

echo "OK — daemon preview up (survives Cursor)"
[[ -n "$WIFI" ]] && echo "Phone Wi‑Fi:  http://${WIFI}:${PORT}/apps/web/"
[[ -n "$TSIP" ]] && echo "Tailscale:    http://${TSIP}:${PORT}/apps/web/"
if [[ -x "$TS" ]]; then
  "$TS" status 2>/dev/null | grep -i iphone || true
fi
echo "PID file:    $ROOT/deploy/preview-server.pid"
echo "Access log:  $ROOT/deploy/preview-access.log"
echo "Stop with:   ./deploy/stop-preview.sh"
