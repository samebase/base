import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

type ParsedArgs = Record<string, string>;

type ClickEvent = {
  time: number;
  x: number;
  y: number;
};

type VideoInfo = {
  width: number;
  height: number;
  duration: number;
};

type WindowFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function parseArgs(argv: string[]): ParsedArgs {
  const values: ParsedArgs = {};

  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];

    if (!key?.startsWith("--") || value == null) {
      throw new Error(`Invalid argument pair near: ${key ?? "<end>"}`);
    }

    values[key.slice(2)] = value;
  }

  return values;
}

function parseWindowFrame(rawFrame: string): WindowFrame {
  const parts = rawFrame.split(",").map(Number);
  if (parts.length !== 4 || parts.some((value) => Number.isNaN(value))) {
    throw new Error(`Invalid --window-frame value: ${rawFrame}`);
  }

  return {
    x: parts[0],
    y: parts[1],
    width: parts[2],
    height: parts[3],
  };
}

function probeVideo(inputPath: string): VideoInfo {
  const output = execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height",
      "-show_entries",
      "format=duration",
      "-of",
      "json",
      inputPath,
    ],
    { encoding: "utf8" },
  );
  const parsed = JSON.parse(output) as {
    streams: Array<{ width: number; height: number }>;
    format: { duration: string };
  };
  const stream = parsed.streams[0];

  if (!stream) {
    throw new Error(`Could not read video stream info for ${inputPath}`);
  }

  return {
    width: stream.width,
    height: stream.height,
    duration: Number(parsed.format.duration),
  };
}

function toLocalEvents(
  events: ClickEvent[],
  windowFrame: WindowFrame,
  pad: number,
  scaleX: number,
  scaleY: number,
) {
  return events
    .map((event) => ({
      time: event.time,
      x: Math.round((event.x - windowFrame.x) * scaleX + pad),
      y: Math.round((event.y - windowFrame.y) * scaleY + pad),
    }))
    .filter((event) => event.x >= 0 && event.y >= 0);
}

function combineExpressions(parts: string[]): string {
  if (parts.length === 0) {
    return "0";
  }

  return parts.reduce((left, right) => `max(${left},${right})`);
}

function buildRingAlphaExpr(
  events: Array<{ time: number; x: number; y: number }>,
  options: {
    animationDuration: number;
    startRadius: number;
    endRadius: number;
    thickness: number;
    maxOpacity: number;
  },
): string {
  const { animationDuration, startRadius, endRadius, thickness, maxOpacity } = options;
  const amplitude = endRadius - startRadius;

  const parts = events.map((event) => {
    const start = event.time.toFixed(3);
    const end = (event.time + animationDuration).toFixed(3);
    const timeProgress = `((T-${start})/${animationDuration})`;
    const radius = `(${startRadius}+${amplitude}*${timeProgress})`;
    const distance = `hypot(X-${event.x},Y-${event.y})`;
    const ring = `max(0,1-abs(${distance}-${radius})/${thickness})`;
    const fade = `(1-${timeProgress})`;
    return `if(between(T,${start},${end}),${maxOpacity}*${ring}*${fade},0)`;
  });

  return combineExpressions(parts);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = args.input;
  const outputPath = args.output;
  const eventsPath = args.events;
  const windowFrameArg = args["window-frame"];
  const pad = Number(args.pad ?? "48");

  if (!inputPath || !outputPath || !eventsPath || !windowFrameArg || Number.isNaN(pad)) {
    throw new Error("Missing required arguments.");
  }

  const windowFrame = parseWindowFrame(windowFrameArg);
  const rawEvents = JSON.parse(await fs.readFile(eventsPath, "utf8")) as ClickEvent[];
  const videoInfo = probeVideo(inputPath);
  const scaleX = videoInfo.width / windowFrame.width;
  const scaleY = videoInfo.height / windowFrame.height;
  const localEvents = toLocalEvents(rawEvents, windowFrame, pad, scaleX, scaleY);
  const finalWidth = videoInfo.width + pad * 2;
  const finalHeight = videoInfo.height + pad * 2;

  const blackRingAlpha = buildRingAlphaExpr(localEvents, {
    animationDuration: 0.18,
    startRadius: 12,
    endRadius: 34,
    thickness: 3.3,
    maxOpacity: 210,
  });
  const whiteRingAlpha = buildRingAlphaExpr(localEvents, {
    animationDuration: 0.16,
    startRadius: 10,
    endRadius: 30,
    thickness: 2.1,
    maxOpacity: 255,
  });

  const filterScript = [
    `[0:v]pad=iw+${pad * 2}:ih+${pad * 2}:${pad}:${pad}:color=0xF3F4F6[base]`,
    `color=c=black@0.0:s=${finalWidth}x${finalHeight}:d=${videoInfo.duration.toFixed(3)},format=rgba,geq=r='0':g='0':b='0':a='${blackRingAlpha}'[black_ring]`,
    `color=c=white@0.0:s=${finalWidth}x${finalHeight}:d=${videoInfo.duration.toFixed(3)},format=rgba,geq=r='255':g='255':b='255':a='${whiteRingAlpha}'[white_ring]`,
    `[base][black_ring]overlay=format=auto[tmp]`,
    `[tmp][white_ring]overlay=format=auto,fps=30,format=yuv420p[outv]`,
  ].join(";\n");

  const filterScriptPath = path.join(
    os.tmpdir(),
    `click-rings-${Date.now()}-${Math.random().toString(16).slice(2)}.ffscript`,
  );

  try {
    await fs.writeFile(filterScriptPath, filterScript);
    execFileSync(
      "ffmpeg",
      [
        "-hide_banner",
        "-y",
        "-i",
        inputPath,
        "-filter_complex_script",
        filterScriptPath,
        "-map",
        "[outv]",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-profile:v",
        "high",
        "-preset",
        "fast",
        "-crf",
        "18",
        "-movflags",
        "+faststart",
        outputPath,
      ],
      { stdio: "pipe" },
    );
  } finally {
    await fs.rm(filterScriptPath, { force: true });
  }
}

await main();
