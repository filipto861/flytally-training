import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.UX5_BASE_URL ?? "https://training.fly-tally.com";
const outputRoot = path.resolve(process.cwd(), "ux5-screenshots");

const routes = [
  ["aircraft", "/aircraft/learjet-35a"],
  ["procedures", "/aircraft/learjet-35a/procedures"],
  ["performance", "/aircraft/learjet-35a/performance"],
  ["training", "/aircraft/learjet-35a/training"],
  ["reference", "/aircraft/learjet-35a/reference"],
  ["flight", "/aircraft/learjet-35a/fly"],
  ["systems", "/aircraft/learjet-35a/systems"],
];

const viewports = [
  ["desktop", { width: 1664, height: 930, isMobile: false, hasTouch: false }],
  ["ipad-landscape", { width: 1112, height: 834, isMobile: true, hasTouch: true }],
  ["ipad-portrait", { width: 834, height: 1112, isMobile: true, hasTouch: true }],
  ["mobile", { width: 390, height: 844, isMobile: true, hasTouch: true }],
];

const browser = await chromium.launch();
const manifest = {
  capturedAt: new Date().toISOString(),
  baseUrl,
  entries: [],
};

try {
  for (const [viewportName, viewport] of viewports) {
    const directory = path.join(outputRoot, viewportName);
    await mkdir(directory, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.isMobile,
      hasTouch: viewport.hasTouch,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    for (const [routeName, route] of routes) {
      const url = new URL(route, baseUrl).toString();
      const startedAt = Date.now();
      let status = null;
      let error = null;

      try {
        const response = await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });
        status = response?.status() ?? null;
        await page.waitForTimeout(750);
      } catch (caught) {
        error = caught instanceof Error ? caught.message : String(caught);
      }

      const timing = await page.evaluate(() => {
        const navigation = performance.getEntriesByType("navigation")[0];
        if (!(navigation instanceof PerformanceNavigationTiming)) return null;
        return {
          domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
          loadEventMs: Math.round(navigation.loadEventEnd),
          responseEndMs: Math.round(navigation.responseEnd),
        };
      }).catch(() => null);

      const title = await page.title().catch(() => "");
      const screenshotPath = path.join(directory, `${routeName}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      manifest.entries.push({
        viewport: viewportName,
        width: viewport.width,
        height: viewport.height,
        route: routeName,
        requestedUrl: url,
        finalUrl: page.url(),
        status,
        title,
        elapsedMs: Date.now() - startedAt,
        timing,
        error,
        screenshot: path.relative(outputRoot, screenshotPath).replaceAll("\\", "/"),
      });

      console.log(`${viewportName.padEnd(15)} ${routeName.padEnd(12)} status=${String(status).padEnd(4)} ${page.url()}`);
    }

    await context.close();
  }
} finally {
  await browser.close();
}

await mkdir(outputRoot, { recursive: true });
await writeFile(
  path.join(outputRoot, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
  "utf8",
);

console.log(`UX5 capture complete: ${outputRoot}`);
