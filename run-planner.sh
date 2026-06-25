#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INDEX_FILE="$SCRIPT_DIR/index.html"

if [ ! -f "$INDEX_FILE" ]; then
  message="index.html not found in $SCRIPT_DIR"
  echo "Error: $message" >&2
  command -v notify-send >/dev/null 2>&1 && notify-send "Daily Task Planner" "$message" -u critical
  exit 1
fi

notify() {
  command -v notify-send >/dev/null 2>&1 && notify-send "Daily Task Planner" "$1"
}

# Install dependencies if needed
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  echo "Installing dependencies..."
  (cd "$SCRIPT_DIR" && npm install)
fi

# Start the server in the background
echo "Starting Daily Task Planner server..."
(cd "$SCRIPT_DIR" && node server.js) &
SERVER_PID=$!

# Give the server a moment to start
sleep 1

# Open in browser
URL="http://localhost:3000"

open_browser() {
  for cmd in xdg-open sensible-browser firefox chromium google-chrome; do
    if command -v "$cmd" >/dev/null 2>&1; then
      "$cmd" "$URL"
      return 0
    fi
  done
  return 1
}

if [ -t 1 ]; then
  echo "Opening Daily Task Planner at $URL ..."
else
  notify "Opening at $URL ..."
fi

if ! open_browser; then
  message="Could not find a browser."
  echo "Error: $message" >&2
  echo "Open this URL manually: $URL" >&2
  command -v notify-send >/dev/null 2>&1 && notify-send "Daily Task Planner" "$message" -u critical
fi

# Wait for the server process (keeps the script alive until Ctrl+C)
wait $SERVER_PID
