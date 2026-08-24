#!/bin/zsh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-5173}"
PIDFILE="$ROOT/deploy/preview-server.pid"
UID_NUM="$(id -u)"
LABEL="app.petlive.preview"

launchctl bootout "gui/${UID_NUM}/${LABEL}" 2>/dev/null || true
launchctl unload "$HOME/Library/LaunchAgents/${LABEL}.plist" 2>/dev/null || true

if [[ -f "$PIDFILE" ]]; then
  pid="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [[ -n "${pid}" ]] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    sleep 0.2
    kill -9 "$pid" 2>/dev/null || true
    echo "Stopped pid $pid"
  fi
  rm -f "$PIDFILE"
fi

pkill -f "deploy/serve-preview.py --port ${PORT}" 2>/dev/null || true
pkill -f "python3 -m http.server ${PORT}" 2>/dev/null || true

if lsof -tiTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  lsof -tiTCP:"$PORT" -sTCP:LISTEN | xargs kill -9 2>/dev/null || true
fi

echo "Preview stopped."
