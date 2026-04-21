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
  page: ScreenPoint;
};

type LandingCoords = {
  github: LandingPageCoords;
  convex: LandingPageCoords;
  cloudflare: LandingPageCoords;
  codex: LandingPageCoords;
  tabs: {
    github: ScreenPoint;
    convex: ScreenPoint;
    cloudflare: ScreenPoint;
    codex: ScreenPoint;
  };
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
        page: toScreenPoint(
          Math.min(Math.max(innerWidth * 0.82, 540), innerWidth - 96),
          Math.min(Math.max(innerHeight * 0.36, 210), innerHeight - 150),
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
  const tabCoords = await githubPage.evaluate(() => {
    const chromeX = Math.max((window.outerWidth - window.innerWidth) / 2, 0);
    const chromeY = Math.max(window.outerHeight - window.innerHeight - chromeX, 0);
    const screenX = window.screenX;
    const screenY = window.screenY;
    const leftInset = Math.max(chromeX + 126, 164);
    const rightInset = 176;
    const availableWidth = Math.max(window.outerWidth - leftInset - rightInset, 560);
    const tabWidth = availableWidth / 4;
    const tabCenterY = Math.round(screenY + Math.max(Math.min(chromeY * 0.38, 28), 16));
    const centerAt = (index: number): ScreenPoint => ({
      x: Math.round(screenX + leftInset + tabWidth * (index + 0.5)),
      y: tabCenterY,
    });

    return {
      github: centerAt(0),
      convex: centerAt(1),
      cloudflare: centerAt(2),
      codex: centerAt(3),
    };
  });

  const coords: LandingCoords = {
    github: {
      page: githubCoords.page,
    },
    convex: {
      page: convexCoords.page,
    },
    cloudflare: {
      page: cloudflareCoords.page,
    },
    codex: {
      page: codexCoords.page,
    },
    tabs: tabCoords,
    windowFrame: githubCoords.windowFrame,
  };

  await fs.writeFile(coordsFile, JSON.stringify(coords, null, 2));

  await githubPage.bringToFront();
  await fs.writeFile(readyFile, "ready\n");
  await githubPage.waitForTimeout(16_000);
} finally {
  await context.close();
}
