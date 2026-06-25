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

file_uri() {
  local path="$1"
  local encoded="${path// /%20}"
  echo "file://$encoded"
}

open_in_firefox() {
  local target_uri
  target_uri=$(file_uri "$INDEX_FILE")

  local candidate
  for candidate in /usr/bin/firefox firefox firefox-esr; do
    if [ -x "$candidate" ] || command -v "$candidate" >/dev/null 2>&1; then
      "$candidate" "$target_uri"
      return 0
    fi
  done

  return 1
}

if [ -t 1 ]; then
  echo "Opening Daily Task Planner in Firefox..."
else
  notify "Opening in Firefox..."
fi

if ! open_in_firefox; then
  message="Could not find Firefox."
  echo "Error: $message" >&2
  echo "Open this file manually in Firefox: $INDEX_FILE" >&2
  command -v notify-send >/dev/null 2>&1 && notify-send "Daily Task Planner" "$message" -u critical
  exit 1
fi
