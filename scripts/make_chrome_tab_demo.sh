#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$ROOT_DIR/.tmp/video-demo"
RECORDER_BIN="$TMP_DIR/window-recorder"
MOUSE_BIN="$TMP_DIR/mouse-animator"
OUTPUT_PATH="$TMP_DIR/chrome-tab-switch-demo.mp4"
TAB_ONE_URL="file://$ROOT_DIR/demo-assets/tab-one.html"
TAB_TWO_URL="file://$ROOT_DIR/demo-assets/tab-two.html"
READY_FILE="$TMP_DIR/chrome-ready.txt"
COORDS_FILE="$TMP_DIR/demo-coords.json"

mkdir -p "$TMP_DIR"
PROFILE_DIR="$(mktemp -d "$TMP_DIR/chrome-profile.XXXXXX")"
rm -f "$OUTPUT_PATH"
rm -f "$READY_FILE"
rm -f "$COORDS_FILE"

swiftc \
  -parse-as-library \
  -o "$RECORDER_BIN" \
  "$ROOT_DIR/scripts/record_chrome_window.swift" \
  -framework AppKit \
  -framework AVFoundation \
  -framework CoreMedia \
  -framework CoreVideo \
  -framework ScreenCaptureKit

swiftc \
  -parse-as-library \
  -o "$MOUSE_BIN" \
  "$ROOT_DIR/scripts/animate_mouse.swift" \
  -framework AppKit

cleanup() {
  pkill -f "Google Chrome.*$PROFILE_DIR" >/dev/null 2>&1 || true
  rm -rf "$PROFILE_DIR"
  rm -f "$READY_FILE"
  rm -f "$COORDS_FILE"
}

trap cleanup EXIT

node --experimental-strip-types "$ROOT_DIR/scripts/run_chrome_tab_demo.ts" \
  --profile-dir "$PROFILE_DIR" \
  --url1 "$TAB_ONE_URL" \
  --url2 "$TAB_TWO_URL" \
  --ready-file "$READY_FILE" \
  --coords-file "$COORDS_FILE" &
DEMO_PID=$!

for _ in $(seq 1 200); do
  if [[ -f "$READY_FILE" && -f "$COORDS_FILE" ]]; then
    break
  fi
  sleep 0.1
done

if [[ ! -f "$READY_FILE" || ! -f "$COORDS_FILE" ]]; then
  wait "$DEMO_PID"
  echo "Chrome demo did not become ready." >&2
  exit 1
fi

DEMO_ACTIONS="$(
  node -e '
    const fs = require("node:fs");
    const coords = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const parts = [
      `click:${coords.click.x},${coords.click.y}`,
      `double:${coords.double.x},${coords.double.y}`,
      `drag:${coords.dragStart.x},${coords.dragStart.y}>${coords.dragEnd.x},${coords.dragEnd.y}`,
      "scroll:0,1000",
      "wait:0.35",
      "scroll:0,-360",
      "wait:0.25",
      `click:${coords.tabTwo.x},${coords.tabTwo.y}`,
      `move:${coords.right.x},${coords.right.y}`,
      `right:${coords.right.x},${coords.right.y}`,
      "wait:1.2",
    ];
    process.stdout.write(parts.join(";"));
  ' "$COORDS_FILE"
)"

WINDOW_FRAME="$(
  node -e '
    const fs = require("node:fs");
    const coords = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    process.stdout.write(
      `${coords.windowFrame.x},${coords.windowFrame.y},${coords.windowFrame.width},${coords.windowFrame.height}`,
    );
  ' "$COORDS_FILE"
)"

"$RECORDER_BIN" \
  --bundle-id com.google.Chrome \
  --title-substring "Tab Switch Demo One" \
  --output "$OUTPUT_PATH" \
  --duration 11 \
  --fps 30 \
  --cursor true \
  --click-highlights true &
RECORDER_PID=$!

sleep 0.7
"$MOUSE_BIN" \
  --actions "$DEMO_ACTIONS" \
  --move-duration 0.75 \
  --drag-duration 0.75 \
  --pause-before-click 0.12 \
  --pause-after-click 0.65 \
  --require-frontmost-bundle com.google.Chrome \
  --require-window-owner "Google Chrome" \
  --require-window-frame "$WINDOW_FRAME" \
  --scroll-step-pause 0.02

wait "$RECORDER_PID"
wait "$DEMO_PID"
ffprobe -hide_banner "$OUTPUT_PATH" 2>&1 | sed -n '1,120p'
printf '\nSaved demo to %s\n' "$OUTPUT_PATH"
