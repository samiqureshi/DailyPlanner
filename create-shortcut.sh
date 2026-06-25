#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INDEX_FILE="$SCRIPT_DIR/index.html"
LAUNCHER="$SCRIPT_DIR/run-planner.sh"
DESKTOP_DIR="${XDG_DESKTOP_DIR:-$HOME/Desktop}"
DESKTOP_FILE="$DESKTOP_DIR/daily-task-planner.desktop"
APPLICATIONS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
MENU_FILE="$APPLICATIONS_DIR/daily-task-planner.desktop"

if [ ! -f "$INDEX_FILE" ]; then
  echo "Error: index.html not found in $SCRIPT_DIR" >&2
  exit 1
fi

mkdir -p "$DESKTOP_DIR" "$APPLICATIONS_DIR"
chmod +x "$LAUNCHER"

write_desktop_file() {
  local target="$1"
  cat > "$target" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Daily Task Planner
Comment=Daily Task Planner with rolling and postponing support
Exec=bash "$LAUNCHER"
Path=$SCRIPT_DIR
Icon=web-browser
Terminal=false
StartupNotify=true
Categories=Office;Utility;
EOF
  chmod +x "$target"
}

write_desktop_file "$DESKTOP_FILE"
write_desktop_file "$MENU_FILE"

if command -v gio >/dev/null 2>&1; then
  gio set "$DESKTOP_FILE" metadata::trusted true 2>/dev/null || true
fi

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APPLICATIONS_DIR" 2>/dev/null || true
fi

echo "Shortcuts created:"
echo "  Desktop: $DESKTOP_FILE"
echo "  App menu: $MENU_FILE"
echo ""
echo "Double-click the desktop icon to open the planner in your browser."
echo "No npm or local server is required."
