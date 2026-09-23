import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.UX6_BASE_URL ?? "https://training.fly-tally.com";
const outputRoot = path.resolve(process.cwd(), "ux6-screenshots");

const routes = [
  ["library", "/"],
  ["aircraft", "/aircraft/learjet-35a"],
  ["procedures", "/aircraft/learjet-35a/procedures"],
  ["performance", "/aircraft/learjet-35a/performance"],
  ["training", "/aircraft/learjet-35a/training"],
  ["reference", "/aircraft/learjet-35a/reference"],
  ["flight", "/aircraft/learjet-35a/flight"],
  ["systems", "/aircraft/learjet-35a/systems"],
];

const themes = ["light", "dark"];

const viewports = [
  ["desktop", { width: 1664, height: 930, isMobile: false, hasTouch: false }],
  ["ipad-landscape", { width: 1112, height: 834, isMobile: true, hasTouch: true }],
  ["ipad-portrait", { width: 834, height: 1112, isMobile: true, hasTouch: true }],
  ["mobile", { width: 390, height: 844, isMobile: true, hasTouch: true }],
];

await rm(outputRoot, { recursive: true, force: true });
const browser = await chromium.launch();
const manifest = {
  version: 1,
  capturedAt: new Date().toISOString(),
  baseUrl,
  entries: [],
};

try {
  for (const theme of themes) {
    for (const [viewportName, viewport] of viewports) {
      const directory = path.join(outputRoot, theme, viewportName);
      await mkdir(directory, { recursive: true });

      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.isMobile,
        hasTouch: viewport.hasTouch,
        deviceScaleFactor: 1,
        colorScheme: theme,
      });

      await context.addInitScript((selectedTheme) => {
        try {
          window.localStorage.setItem(
            "flytally-training-workspace-theme",
            selectedTheme,
          );
        } catch {
          // MatchMedia remains the deterministic fallback.
        }
      }, theme);

      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];

      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => pageErrors.push(error.message));

      for (const [routeName, route] of routes) {
        consoleErrors.length = 0;
        pageErrors.length = 0;

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

        const diagnostics = await page.evaluate(() => {
          const root = document.documentElement;
          const shell = document.querySelector('[data-ft-shell="true"]');
          const procedures = document.querySelector('[data-ft-procedures-page="true"]');
          const procedurePicker = procedures?.querySelector('select[aria-label="Procedure"]');
          const firstOperate = procedures?.querySelector('[aria-label="Operate"]');

          const navigation = performance.getEntriesByType("navigation")[0];
          const timing = navigation instanceof PerformanceNavigationTiming
            ? {
                domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
                loadEventMs: Math.round(navigation.loadEventEnd),
                responseEndMs: Math.round(navigation.responseEnd),
              }
            : null;

          return {
            timing,
            horizontalOverflowPx: Math.max(
              0,
              root.scrollWidth - root.clientWidth,
            ),
            shellMounted: Boolean(shell),
            procedurePickerVisible: Boolean(
              procedurePicker &&
              procedurePicker instanceof HTMLElement &&
              procedurePicker.offsetParent !== null,
            ),
            firstOperateTop:
              firstOperate instanceof HTMLElement
                ? Math.round(firstOperate.getBoundingClientRect().top)
                : null,
          };
        }).catch(() => ({
          timing: null,
          horizontalOverflowPx: null,
          shellMounted: false,
          procedurePickerVisible: false,
          firstOperateTop: null,
        }));

        const systemsUnavailable = await page
          .getByText("No published Systems package", { exact: true })
          .isVisible()
          .catch(() => false);

        const legacyUnavailable = await page
          .getByText("This training item is not available.", { exact: true })
          .isVisible()
          .catch(() => false);

        const title = await page.title().catch(() => "");
        const screenshotPath = path.join(directory, routeName + ".png");
        await page.screenshot({ path: screenshotPath, fullPage: true });

        manifest.entries.push({
          theme,
          viewport: viewportName,
          width: viewport.width,
          height: viewport.height,
          route: routeName,
          requestedUrl: url,
          finalUrl: page.url(),
          status,
          systemsUnavailable,
          legacyUnavailable,
          title,
          elapsedMs: Date.now() - startedAt,
          ...diagnostics,
          consoleErrors: [...consoleErrors],
          pageErrors: [...pageErrors],
          error,
          screenshot: path.relative(outputRoot, screenshotPath).replaceAll("\\", "/"),
        });

        console.log(
          [
            theme.padEnd(5),
            viewportName.padEnd(15),
            routeName.padEnd(12),
            "status=" + String(status).padEnd(4),
            "overflow=" + String(diagnostics.horizontalOverflowPx).padEnd(4),
            "systemsUnavailable=" + String(systemsUnavailable).padEnd(5),
            page.url(),
          ].join(" "),
        );
      }

      await context.close();
    }
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

console.log("UX6 capture complete: " + outputRoot);
