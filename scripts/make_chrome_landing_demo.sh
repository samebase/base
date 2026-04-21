#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$ROOT_DIR/.tmp/video-demo"
RECORDER_BIN="$TMP_DIR/window-recorder"
MOUSE_BIN="$TMP_DIR/mouse-animator"
RAW_OUTPUT="$TMP_DIR/chrome-landing-tabs-demo.raw.mp4"
OUTPUT_PATH="$TMP_DIR/chrome-landing-tabs-demo.mp4"
READY_FILE="$TMP_DIR/chrome-landing-ready.txt"
COORDS_FILE="$TMP_DIR/chrome-landing-coords.json"

GITHUB_URL="https://github.com/"
CONVEX_URL="https://www.convex.dev/"
CLOUDFLARE_URL="https://www.cloudflare.com/"
CODEX_URL="https://openai.com/codex"

mkdir -p "$TMP_DIR"
PROFILE_DIR="$(mktemp -d "$TMP_DIR/chrome-profile.XXXXXX")"
rm -f "$RAW_OUTPUT" "$OUTPUT_PATH" "$READY_FILE" "$COORDS_FILE"

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
  rm -f "$READY_FILE" "$COORDS_FILE"
}

trap cleanup EXIT

node --experimental-strip-types "$ROOT_DIR/scripts/run_chrome_landing_tabs.ts" \
  --profile-dir "$PROFILE_DIR" \
  --ready-file "$READY_FILE" \
  --coords-file "$COORDS_FILE" \
  --github-url "$GITHUB_URL" \
  --convex-url "$CONVEX_URL" \
  --cloudflare-url "$CLOUDFLARE_URL" \
  --codex-url "$CODEX_URL" &
DEMO_PID=$!

for _ in $(seq 1 240); do
  if [[ -f "$READY_FILE" && -f "$COORDS_FILE" ]]; then
    break
  fi
  sleep 0.1
done

if [[ ! -f "$READY_FILE" || ! -f "$COORDS_FILE" ]]; then
  wait "$DEMO_PID"
  echo "Chrome landing demo did not become ready." >&2
  exit 1
fi

DEMO_ACTIONS="$(
  node -e '
    const fs = require("node:fs");
    const coords = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const parts = [
      `click:${coords.github.page.x},${coords.github.page.y}`,
      "wait:0.45",
      `click:${coords.tabs.convex.x},${coords.tabs.convex.y}`,
      "wait:0.65",
      `click:${coords.convex.page.x},${coords.convex.page.y}`,
      "wait:0.45",
      `click:${coords.tabs.cloudflare.x},${coords.tabs.cloudflare.y}`,
      "wait:0.65",
      `click:${coords.cloudflare.page.x},${coords.cloudflare.page.y}`,
      "wait:0.45",
      `click:${coords.tabs.codex.x},${coords.tabs.codex.y}`,
      "wait:0.65",
      `click:${coords.codex.page.x},${coords.codex.page.y}`,
      "wait:0.45",
      `click:${coords.tabs.github.x},${coords.tabs.github.y}`,
      "wait:0.65",
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
  --title-substring "GitHub" \
  --output "$RAW_OUTPUT" \
  --duration 13 \
  --fps 30 \
  --cursor true \
  --click-highlights true &
RECORDER_PID=$!

sleep 0.7
"$MOUSE_BIN" \
  --actions "$DEMO_ACTIONS" \
  --move-duration 0.6 \
  --pause-before-click 0.08 \
  --pause-after-click 0.36 \
  --require-frontmost-bundle com.google.Chrome \
  --require-window-owner "Google Chrome" \
  --require-window-frame "$WINDOW_FRAME" \
  --scroll-step-pause 0.012

wait "$RECORDER_PID"
wait "$DEMO_PID"

ffmpeg -hide_banner -y \
  -i "$RAW_OUTPUT" \
  -vf "pad=iw+96:ih+96:48:48:color=0xF3F4F6" \
  -c:v libx264 \
  -preset fast \
  -crf 18 \
  -movflags +faststart \
  "$OUTPUT_PATH" >/dev/null 2>&1

ffprobe -hide_banner "$OUTPUT_PATH" 2>&1 | sed -n '1,120p'
printf '\nSaved padded landing demo to %s\n' "$OUTPUT_PATH"
