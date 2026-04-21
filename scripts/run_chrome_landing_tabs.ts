import { chromium } from "playwright-core";
import fs from "node:fs/promises";

type ParsedArgs = Record<string, string>;

type ScreenPoint = {
  x: number;
  y: number;
};

type WindowFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type LandingPageCoords = {
  focus: ScreenPoint;
  support: ScreenPoint;
};

type LandingCoords = {
  github: LandingPageCoords;
  convex: LandingPageCoords;
  cloudflare: LandingPageCoords;
  codex: LandingPageCoords;
  windowFrame: WindowFrame;
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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const args = parseArgs(process.argv.slice(2));
const profileDir = args["profile-dir"];
const readyFile = args["ready-file"];
const coordsFile = args["coords-file"];
const githubUrl = args["github-url"];
const convexUrl = args["convex-url"];
const cloudflareUrl = args["cloudflare-url"];
const codexUrl = args["codex-url"];

if (
  !profileDir ||
  !readyFile ||
  !coordsFile ||
  !githubUrl ||
  !convexUrl ||
  !cloudflareUrl ||
  !codexUrl
) {
  throw new Error("Missing required arguments.");
}

const context = await chromium.launchPersistentContext(profileDir, {
  channel: "chrome",
  headless: false,
  viewport: null,
  args: [
    "--window-size=980,720",
    "--window-position=120,84",
    "--no-first-run",
    "--disable-default-browser-check",
  ],
});

try {
  const githubPage = context.pages()[0] ?? (await context.newPage());
  await githubPage.goto(githubUrl, { waitUntil: "load" });

  const convexPage = await context.newPage();
  await convexPage.goto(convexUrl, { waitUntil: "load" });

  const cloudflarePage = await context.newPage();
  await cloudflarePage.goto(cloudflareUrl, { waitUntil: "load" });

  const codexPage = await context.newPage();
  await codexPage.goto(codexUrl, { waitUntil: "load" });

  async function measurePage(page: typeof githubPage) {
    await page.bringToFront();
    await page.waitForLoadState("domcontentloaded");

    return page.evaluate(() => {
      const chromeX = Math.max((window.outerWidth - window.innerWidth) / 2, 0);
      const chromeY = Math.max(window.outerHeight - window.innerHeight - chromeX, 0);
      const toScreenPoint = (left: number, top: number): ScreenPoint => ({
        x: Math.round(window.screenX + chromeX + left),
        y: Math.round(window.screenY + chromeY + top),
      });

      const innerWidth = window.innerWidth;
      const innerHeight = window.innerHeight;

      return {
        focus: toScreenPoint(
          Math.min(Math.max(innerWidth * 0.58, 320), innerWidth - 180),
          Math.min(Math.max(innerHeight * 0.38, 200), innerHeight - 150),
        ),
        support: toScreenPoint(
          Math.min(Math.max(innerWidth * 0.74, 360), innerWidth - 120),
          Math.min(Math.max(innerHeight * 0.28, 160), innerHeight - 180),
        ),
        windowFrame: {
          x: Math.round(window.screenX),
          y: Math.round(window.screenY),
          width: Math.round(window.outerWidth),
          height: Math.round(window.outerHeight),
        },
      };
    });
  }

  const githubCoords = await measurePage(githubPage);
  const convexCoords = await measurePage(convexPage);
  const cloudflareCoords = await measurePage(cloudflarePage);
  const codexCoords = await measurePage(codexPage);

  const coords: LandingCoords = {
    github: {
      focus: githubCoords.focus,
      support: githubCoords.support,
    },
    convex: {
      focus: convexCoords.focus,
      support: convexCoords.support,
    },
    cloudflare: {
      focus: cloudflareCoords.focus,
      support: cloudflareCoords.support,
    },
    codex: {
      focus: codexCoords.focus,
      support: codexCoords.support,
    },
    windowFrame: githubCoords.windowFrame,
  };

  await fs.writeFile(coordsFile, JSON.stringify(coords, null, 2));

  await githubPage.bringToFront();
  await fs.writeFile(readyFile, "ready\n");

  await wait(3200);
  await convexPage.bringToFront();
  await wait(3000);
  await cloudflarePage.bringToFront();
  await wait(3000);
  await codexPage.bringToFront();
  await wait(3400);
} finally {
  await context.close();
}
