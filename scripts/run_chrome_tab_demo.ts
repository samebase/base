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

type DemoCoords = {
  click: ScreenPoint;
  double: ScreenPoint;
  dragStart: ScreenPoint;
  dragEnd: ScreenPoint;
  tabTwo: ScreenPoint;
  right: ScreenPoint;
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
const tabOneUrl = args["url1"];
const tabTwoUrl = args["url2"];
const readyFile = args["ready-file"];
const coordsFile = args["coords-file"];

if (!profileDir || !tabOneUrl || !tabTwoUrl || !readyFile || !coordsFile) {
  throw new Error("Missing required arguments.");
}

const context = await chromium.launchPersistentContext(profileDir, {
  channel: "chrome",
  headless: false,
  viewport: null,
  args: [
    "--window-size=940,680",
    "--window-position=160,100",
    "--no-first-run",
    "--disable-default-browser-check",
  ],
});

try {
  const firstPage = context.pages()[0] ?? (await context.newPage());
  await firstPage.goto(tabOneUrl, { waitUntil: "load" });

  const secondPage = await context.newPage();
  await secondPage.goto(tabTwoUrl, { waitUntil: "load" });

  await firstPage.bringToFront();
  const firstPageCoords = await firstPage.evaluate(() => {
    const clickTarget = document.getElementById("click-target");
    const doubleTarget = document.getElementById("double-target");
    const dragTrack = document.getElementById("drag-track");

    if (!clickTarget || !doubleTarget || !dragTrack) {
      throw new Error("Tab one demo elements are missing.");
    }

    const chromeX = Math.max((window.outerWidth - window.innerWidth) / 2, 0);
    const chromeY = Math.max(window.outerHeight - window.innerHeight - chromeX, 0);
    const toScreenPoint = (left: number, top: number): ScreenPoint => ({
      x: Math.round(window.screenX + chromeX + left),
      y: Math.round(window.screenY + chromeY + top),
    });

    const clickRect = clickTarget.getBoundingClientRect();
    const doubleRect = doubleTarget.getBoundingClientRect();
    const dragRect = dragTrack.getBoundingClientRect();
    const outerWidth = window.outerWidth;
    const outerHeight = window.outerHeight;
    const screenX = window.screenX;
    const screenY = window.screenY;
    const tabStripHeight = Math.max(Math.min(chromeY * 0.42, 30), 16);
    const tabInsetLeft = Math.max(chromeX + 124, 160);
    const tabWidth = Math.max(Math.min((outerWidth - tabInsetLeft - 180) / 2, 240), 150);
    const tabCenterY = Math.round(screenY + tabStripHeight);

    return {
      click: toScreenPoint(
        clickRect.left + clickRect.width / 2,
        clickRect.top + clickRect.height / 2,
      ),
      double: toScreenPoint(
        doubleRect.left + doubleRect.width / 2,
        doubleRect.top + doubleRect.height / 2,
      ),
      dragStart: toScreenPoint(dragRect.left + 90, dragRect.top + dragRect.height / 2),
      dragEnd: toScreenPoint(dragRect.right - 110, dragRect.top + dragRect.height / 2),
      tabTwo: {
        x: Math.round(screenX + tabInsetLeft + tabWidth * 1.5),
        y: tabCenterY,
      },
      windowFrame: {
        x: Math.round(screenX),
        y: Math.round(screenY),
        width: Math.round(outerWidth),
        height: Math.round(outerHeight),
      },
    } satisfies Omit<DemoCoords, "right">;
  });

  await secondPage.bringToFront();
  const secondPageCoords = await secondPage.evaluate(() => {
    const contextZone = document.getElementById("context-zone");

    if (!contextZone) {
      throw new Error("Tab two context zone is missing.");
    }

    const chromeX = Math.max((window.outerWidth - window.innerWidth) / 2, 0);
    const chromeY = Math.max(window.outerHeight - window.innerHeight - chromeX, 0);
    const toScreenPoint = (left: number, top: number): ScreenPoint => ({
      x: Math.round(window.screenX + chromeX + left),
      y: Math.round(window.screenY + chromeY + top),
    });

    const zoneRect = contextZone.getBoundingClientRect();

    return {
      right: toScreenPoint(zoneRect.left + zoneRect.width / 2, zoneRect.top + zoneRect.height / 2),
    } satisfies Pick<DemoCoords, "right">;
  });

  const coords: DemoCoords = {
    ...firstPageCoords,
    ...secondPageCoords,
  };

  await fs.writeFile(coordsFile, JSON.stringify(coords, null, 2));

  await firstPage.bringToFront();
  await fs.writeFile(readyFile, "ready\n");
  await firstPage.waitForTimeout(14_000);
} finally {
  await context.close();
}
